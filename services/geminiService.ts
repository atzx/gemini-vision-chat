import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { MessagePart } from '../types';

export type ApiConfig = {
    provider: 'gemini';
    apiKey: string;
} | {
    provider: 'external';
    apiKey: string;
    endpoint: string;
};

async function runImageGenerationQuery(apiKey: string, prompt: string): Promise<MessagePart[]> {
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

async function runExternalQuery(apiKey: string, endpoint: string, prompt: string, images?: { mimeType: string, data: string }[]): Promise<MessagePart[]> {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
    };

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

    const body = JSON.stringify({
        model: "gpt-4o", // A sensible default for OpenAI-compatible APIs
        messages: [{
            role: "user",
            content: content,
        }],
        max_tokens: 1024,
    });

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
    const textResponse = data.choices[0]?.message?.content || "No content generated.";
    
    // External APIs like OpenAI Vision don't typically generate images in the response, so we only handle text.
    return [{ text: textResponse }];
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
             if (options?.isImageGenerationMode) {
                throw new Error("Image generation is not supported with an external API provider.");
            }
            return await runExternalQuery(apiConfig.apiKey, apiConfig.endpoint, prompt, images);
        } else {
            throw new Error('Invalid API provider specified.');
        }
    } catch (error) {
        console.error("Error calling AI API:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return [{ text: `Error: ${errorMessage}` }];
    }
}
