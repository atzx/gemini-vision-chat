import React, { useState, useCallback, useEffect } from 'react';
import { ChatMessage, MessagePart, OpenRouterModelId, OPENROUTER_MODELS } from './types';
import { runQuery, ApiConfig } from './services/geminiService';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import InputBar from './components/InputBar';
import ApiConfigModal from './components/ApiConfigModal';
import { ApiModalConfig } from './components/ApiConfigModal';

const App: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isApiModalOpen, setIsApiModalOpen] = useState<boolean>(false);

    // API State Management
    // Get API keys from .env.local (set by Vite during build)
    const envApiKey = process.env.GEMINI_API_KEY || '';
    const envOpenRouterKey = process.env.OPENROUTER_API_KEY || '';
    const envOpenRouterEndpoint = process.env.OPENROUTER_ENDPOINT || 'https://openrouter.ai/api/v1/chat/completions';
    const envOpenRouterModel = (process.env.OPENROUTER_MODEL as OpenRouterModelId) || 'google/gemini-2.5-flash-image';
    
    // Use Gemini as default provider, but allow localStorage override
    const [apiProvider, setApiProvider] = useState<'gemini' | 'external'>(() => {
        const savedProvider = localStorage.getItem('apiProvider') as 'gemini' | 'external';
        // If there's an env API key, default to Gemini unless user explicitly chose external
        return savedProvider || 'gemini';
    });
    
    // Use env API key as default for Gemini, but allow localStorage override
    const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
        const savedKey = localStorage.getItem('geminiApiKey');
        // Priority: 1) localStorage if user set it, 2) env variable, 3) placeholder
        return savedKey || envApiKey || 'USE_GOOGLE_AI_STUDIO';
    });
    
    // OpenRouter configuration with localStorage persistence
    const [externalApiKey, setExternalApiKey] = useState<string>(() => {
        const savedKey = localStorage.getItem('externalApiKey');
        // Validate that the saved key is actually an OpenRouter key (starts with sk-or-v1-)
        // If it's a Gemini key (starts with AIza), ignore it and use env variable
        if (savedKey && savedKey.startsWith('AIza')) {
            console.warn('Detected Gemini API key in OpenRouter storage, using env variable instead');
            return envOpenRouterKey || '';
        }
        return savedKey || envOpenRouterKey || '';
    });
    const [externalApiEndpoint, setExternalApiEndpoint] = useState<string>(() => {
        const savedEndpoint = localStorage.getItem('externalApiEndpoint');
        // Validate that the saved endpoint is OpenRouter, not OpenAI or other APIs
        // If it's OpenAI endpoint, ignore it and use env variable
        if (savedEndpoint && savedEndpoint.includes('openai.com')) {
            console.warn('Detected OpenAI endpoint in storage, using OpenRouter endpoint instead');
            return envOpenRouterEndpoint || 'https://openrouter.ai/api/v1/chat/completions';
        }
        return savedEndpoint || envOpenRouterEndpoint || 'https://openrouter.ai/api/v1/chat/completions';
    });
    const [externalApiModel, setExternalApiModel] = useState<OpenRouterModelId>(() => {
        const savedModel = localStorage.getItem('externalApiModel') as OpenRouterModelId;
        return savedModel || envOpenRouterModel || 'google/gemini-2.5-flash-image';
    });

    useEffect(() => { localStorage.setItem('apiProvider', apiProvider); }, [apiProvider]);
    useEffect(() => { localStorage.setItem('geminiApiKey', geminiApiKey); }, [geminiApiKey]);
    useEffect(() => { 
        // Only save to localStorage if it's a valid OpenRouter key
        if (externalApiKey && !externalApiKey.startsWith('AIza')) {
            localStorage.setItem('externalApiKey', externalApiKey); 
        }
    }, [externalApiKey]);
    useEffect(() => { 
        // Only save to localStorage if it's an OpenRouter endpoint
        if (externalApiEndpoint && !externalApiEndpoint.includes('openai.com')) {
            localStorage.setItem('externalApiEndpoint', externalApiEndpoint); 
        }
    }, [externalApiEndpoint]);
    useEffect(() => { localStorage.setItem('externalApiModel', externalApiModel); }, [externalApiModel]);

    // Clean up invalid external API keys and endpoints from localStorage on mount
    useEffect(() => {
        const savedExternalKey = localStorage.getItem('externalApiKey');
        if (savedExternalKey && savedExternalKey.startsWith('AIza')) {
            console.warn('Cleaning up invalid Gemini API key from OpenRouter storage');
            localStorage.removeItem('externalApiKey');
            // Reset to env variable if available
            if (envOpenRouterKey) {
                setExternalApiKey(envOpenRouterKey);
            }
        }
        
        const savedEndpoint = localStorage.getItem('externalApiEndpoint');
        if (savedEndpoint && savedEndpoint.includes('openai.com')) {
            console.warn('Cleaning up OpenAI endpoint from storage, switching to OpenRouter');
            localStorage.removeItem('externalApiEndpoint');
            // Reset to env variable if available
            if (envOpenRouterEndpoint) {
                setExternalApiEndpoint(envOpenRouterEndpoint);
            }
        }
    }, []);

    // Auto-switch to Gemini if env key is available but provider is external
    // This fixes the issue where users had external provider configured but want to use .env.local
    useEffect(() => {
        if (envApiKey && envApiKey !== 'USE_GOOGLE_AI_STUDIO' && apiProvider === 'external') {
            console.log('Detected Gemini API key in .env.local, switching from External to Gemini provider');
            setApiProvider('gemini');
            setGeminiApiKey(envApiKey);
        }
    }, [envApiKey, apiProvider]);

    const isApiConfigured = (apiProvider === 'gemini' && !!geminiApiKey) || (apiProvider === 'external' && !!externalApiKey && !!externalApiEndpoint);

    const handleSaveApiConfig = (config: ApiModalConfig) => {
        if (config.selectedProvider === 'external') {
            setApiProvider('external');
            setExternalApiKey(config.externalKey);
            setExternalApiEndpoint(config.externalEndpoint);
            if (config.externalModel) {
                setExternalApiModel(config.externalModel);
            }
        } else { // 'gemini_studio' or 'gemini_custom'
            setApiProvider('gemini');
            if (config.selectedProvider === 'gemini_studio') {
                setGeminiApiKey('USE_GOOGLE_AI_STUDIO');
            } else {
                setGeminiApiKey(config.geminiKey);
            }
        }
        setIsApiModalOpen(false);
    };


    const handleSend = useCallback(async (
        prompt: string, 
        images?: { mimeType: string, data: string }[],
        options?: { isImageEditMode?: boolean, isImageGenerationMode?: boolean }
    ) => {
        if (!prompt && (!images || images.length === 0)) return;
        if (!isApiConfigured) {
            setIsApiModalOpen(true);
            return;
        }

        // Validate OpenRouter API key format
        if (apiProvider === 'external' && externalApiKey && externalApiKey.startsWith('AIza')) {
            setIsLoading(false);
            const errorMessage: ChatMessage = {
                id: `error-${Date.now()}`,
                role: 'error',
                parts: [{ text: "Error: Invalid OpenRouter API key detected. You have a Gemini API key configured for OpenRouter.\n\nPlease click 'API Externo' button and enter a valid OpenRouter API key (starts with 'sk-or-v1-')." }],
            };
            setMessages(prev => [...prev, errorMessage]);
            return;
        }

        setIsLoading(true);

        const userParts: MessagePart[] = [];
        if (prompt && !options?.isImageGenerationMode) userParts.push({ text: prompt });
        if (images) {
            images.forEach(image => {
                userParts.push({ inlineData: { mimeType: image.mimeType, data: image.data }});
            });
        }
        if (options?.isImageGenerationMode) {
             userParts.push({ text: `*Generando imagen a partir de: "${prompt}"*` });
        }
        
        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            parts: userParts.length > 0 ? userParts : [{text: prompt}],
        };

        setMessages(prev => [...prev, userMessage]);
        
        let apiConfig: ApiConfig;
        if (apiProvider === 'gemini') {
            apiConfig = { provider: 'gemini', apiKey: geminiApiKey };
        } else {
            apiConfig = { 
                provider: 'external', 
                apiKey: externalApiKey, 
                endpoint: externalApiEndpoint,
                model: externalApiModel 
            };
        }

        try {
            let modelParts = await runQuery(apiConfig, prompt, images, options);
            
            // Check if Gemini image generation failed due to billing requirements
            const errorText = modelParts[0]?.text || '';
            if (options?.isImageGenerationMode && 
                apiProvider === 'gemini' && 
                errorText.includes('billing enabled') &&
                externalApiKey && 
                externalApiEndpoint &&
                externalApiEndpoint.includes('openrouter.ai')) {
                // Fallback to OpenRouter for image generation
                console.log('Falling back to OpenRouter for image generation...');
                const fallbackConfig: ApiConfig = { 
                    provider: 'external', 
                    apiKey: externalApiKey, 
                    endpoint: externalApiEndpoint,
                    model: externalApiModel 
                };
                modelParts = await runQuery(fallbackConfig, prompt, images, options);
            } else if (options?.isImageGenerationMode && 
                       apiProvider === 'gemini' && 
                       errorText.includes('billing enabled')) {
                // Cannot fallback because OpenRouter is not properly configured
                modelParts = [{ 
                    text: `Error: ${errorText}\n\nOpenRouter is not configured correctly. Please click 'API Externo' and set up OpenRouter with:\n- API Key: sk-or-v1-...\n- Endpoint: https://openrouter.ai/api/v1/chat/completions` 
                }];
            }
            
            const modelMessage: ChatMessage = {
                id: `model-${Date.now()}`,
                role: modelParts[0]?.text?.toLowerCase().startsWith('error:') ? 'error' : 'model',
                parts: modelParts,
            };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            console.error(error);
            const errorMessage: ChatMessage = {
                id: `error-${Date.now()}`,
                role: 'error',
                parts: [{ text: "An unexpected error occurred. Please check the console." }],
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [apiProvider, geminiApiKey, externalApiKey, externalApiEndpoint, externalApiModel, isApiConfigured]);

    // Determine if using env API key
    const isUsingEnvKey = geminiApiKey === envApiKey && envApiKey !== '' && envApiKey !== 'USE_GOOGLE_AI_STUDIO';

    return (
        <div className="flex flex-col h-screen bg-slate-900 text-white">
            <Header 
                onOpenApiModal={() => setIsApiModalOpen(true)} 
                apiProvider={apiProvider}
                isUsingEnvKey={isUsingEnvKey}
            />
            <ApiConfigModal
                isOpen={isApiModalOpen}
                onClose={() => setIsApiModalOpen(false)}
                onSave={handleSaveApiConfig}
                currentProvider={apiProvider}
                currentGeminiKey={geminiApiKey}
                currentExternalKey={externalApiKey}
                currentExternalEndpoint={externalApiEndpoint}
                currentExternalModel={externalApiModel}
            />
            <ChatWindow messages={messages} isLoading={isLoading} />
            <InputBar onSend={handleSend} isLoading={isLoading} disabled={!isApiConfigured} />
        </div>
    );
};

export default App;
