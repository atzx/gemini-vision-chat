import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { MessagePart, OpenRouterModelId } from '../types';

export type ApiConfig = {
    provider: 'gemini';
    apiKey: string;
} | {
    provider: 'external';
    apiKey: string;
    endpoint: string;
    model?: OpenRouterModelId;
};

async function runImageGenerationQuery(apiKey: string, prompt: string): Promise<MessagePart[]> {
    try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const imageBytes = response.generatedImages[0].image.imageBytes;
            const base64Data = typeof imageBytes === 'string' ? imageBytes : btoa(String.fromCharCode(...new Uint8Array(imageBytes as any)));
            return [{
                inlineData: {
                    mimeType: 'image/png',
                    data: base64Data,
                }
            }];
        }
        return [{ text: "Sorry, I couldn't generate an image based on that prompt." }];
    } catch (error: any) {
        // Check if the error is about billing/requirements
        if (error?.message?.includes('billed users') || 
            error?.message?.includes('Imagen API is only accessible') ||
            error?.error?.message?.includes('billed users')) {
            throw new Error(
                "Image generation with Gemini requires a Google Cloud account with billing enabled.\n\n" +
                "To generate images, you can:\n" +
                "1. Switch to OpenRouter provider (recommended) - use models like 'google/gemini-2.5-flash-image'\n" +
                "2. Enable billing on your Google Cloud project\n\n" +
                "Click the 'API Externo' button in the header to switch to OpenRouter."
            );
        }
        throw error;
    }
}


async function runGeminiQuery(apiKey: string, prompt: string, images?: { mimeType: string, data: string }[], isImageEditMode?: boolean): Promise<MessagePart[]> {
    const ai = new GoogleGenAI({ apiKey });

    if (images && images.length > 0) {
        const imageParts = images.map(image => ({ inlineData: { mimeType: image.mimeType, data: image.data } }));
        const textPart = { text: prompt };
        const modelName = isImageEditMode ? 'gemini-2.5-flash-image-preview' : 'gemini-2.5-flash';
        const contents = { parts: [...imageParts, textPart] };

        if (isImageEditMode) {
            const response = await ai.models.generateContent({
                model: modelName,
                contents,
                config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
            });
            if (response.candidates && response.candidates[0].content.parts) {
                return response.candidates[0].content.parts.map(part => {
                    if (part.text) {
                        return { text: part.text };
                    }
                    if (part.inlineData) {
                        return {
                            inlineData: {
                                mimeType: part.inlineData.mimeType,
                                data: part.inlineData.data,
                            }
                        };
                    }
                    return { text: "" }; // Should not happen
                }).filter(Boolean);
            }
            return [{ text: "No content generated." }];
        } else {
            // Standard vision query
            const response = await ai.models.generateContent({ model: modelName, contents });
            return [{ text: response.text }];
        }
    } else {
        // Text-only query
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return [{ text: response.text }];
    }
}

async function runExternalQuery(
    apiKey: string, 
    endpoint: string, 
    model: string,
    prompt: string, 
    images?: { mimeType: string, data: string }[],
    isImageGenerationMode?: boolean
): Promise<MessagePart[]> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
    };

    // Add OpenRouter specific headers if using OpenRouter
    if (endpoint.includes('openrouter.ai')) {
        headers['HTTP-Referer'] = window.location.origin;
        headers['X-Title'] = 'Gemini Vision Chat';
    }

    const content: any[] = [{ type: 'text', text: prompt }];
    if (images) {
        images.forEach(image => {
            content.push({
                type: 'image_url',
                image_url: {
                    url: `data:${image.mimeType};base64,${image.data}`,
                },
            });
        });
    }

    const requestBody: any = {
        model: model,
        messages: [{
            role: "user",
            content: content,
        }],
        max_tokens: 4096,
    };

    // CRITICAL: For image generation, we must include modalities parameter
    if (isImageGenerationMode && endpoint.includes('openrouter.ai')) {
        requestBody.modalities = ["image", "text"];
    }

    const body = JSON.stringify(requestBody);

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: body,
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: { message: 'Failed to parse error response.' } }));
        throw new Error(`External API Error: ${response.statusText} - ${errorBody.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    // Handle OpenRouter response format
    if (data.choices && data.choices[0]?.message) {
        const message = data.choices[0].message;
        
        // CRITICAL: Check for images array in the message (OpenRouter format for image generation)
        if (isImageGenerationMode && message.images && Array.isArray(message.images) && message.images.length > 0) {
            const imageParts: MessagePart[] = [];
            
            // First add the text content if present
            if (message.content) {
                imageParts.push({ text: message.content });
            }
            
            // Then add all generated images
            message.images.forEach((image: any) => {
                if (image.image_url && image.image_url.url) {
                    const imageUrl = image.image_url.url;
                    // Extract base64 data from data URL format: data:image/png;base64,...
                    const base64Match = imageUrl.match(/^data:image\/[^;]+;base64,(.+)$/);
                    if (base64Match) {
                        imageParts.push({
                            inlineData: {
                                mimeType: imageUrl.match(/^data:([^;]+);/)?.[1] || 'image/png',
                                data: base64Match[1],
                            }
                        });
                    }
                }
            });
            
            if (imageParts.length > 0) {
                return imageParts;
            }
        }
        
        const messageContent = message.content;
        
        // Fallback: Check if the response contains an image in the content (for image generation models)
        if (isImageGenerationMode && typeof messageContent === 'string') {
            // Try to extract base64 image from markdown or direct response
            const base64Match = messageContent.match(/data:image\/[^;]+;base64,([^"\s]+)/);
            if (base64Match) {
                return [{
                    inlineData: {
                        mimeType: 'image/png',
                        data: base64Match[1],
                    }
                }];
            }
            
            // Check if the content itself is base64
            if (messageContent.match(/^[A-Za-z0-9+/]*={0,2}$/) && messageContent.length > 100) {
                return [{
                    inlineData: {
                        mimeType: 'image/png',
                        data: messageContent,
                    }
                }];
            }
        }
        
        return [{ text: messageContent || "No content generated." }];
    }
    
    // Handle some OpenRouter models that might return different formats
    if (data.content) {
        return [{ text: data.content }];
    }
    
    return [{ text: "No content generated." }];
}


export async function runQuery(
    apiConfig: ApiConfig, 
    prompt: string, 
    images?: { mimeType: string, data: string }[],
    options?: { isImageEditMode?: boolean, isImageGenerationMode?: boolean }
): Promise<MessagePart[]> {
    try {
        if (apiConfig.provider === 'gemini') {
            const effectiveApiKey = apiConfig.apiKey;
            if (!effectiveApiKey || effectiveApiKey === 'USE_GOOGLE_AI_STUDIO') {
                throw new Error("Gemini API key is not configured. Please select 'Google Gemini (Personal Key)' and provide your API key in the API settings.");
            }

            if (options?.isImageGenerationMode) {
                 if (!prompt) throw new Error("A text prompt is required for image generation.");
                 return await runImageGenerationQuery(effectiveApiKey, prompt);
            }
            return await runGeminiQuery(effectiveApiKey, prompt, images, options?.isImageEditMode);

        } else if (apiConfig.provider === 'external') {
             if (!apiConfig.endpoint || !apiConfig.apiKey) {
                throw new Error("External API key or endpoint is not configured.");
            }
            
            // Use the configured model or default to a Gemini model for OpenRouter
            const model = apiConfig.model || 'google/gemini-2.5-flash-image';
            
            return await runExternalQuery(
                apiConfig.apiKey, 
                apiConfig.endpoint, 
                model,
                prompt, 
                images,
                options?.isImageGenerationMode
            );
        } else {
            throw new Error('Invalid API provider specified.');
        }
    } catch (error) {
        console.error("Error calling AI API:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return [{ text: `Error: ${errorMessage}` }];
    }
}