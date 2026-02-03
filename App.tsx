import React, { useState, useCallback, useEffect } from 'react';
import { ChatMessage, MessagePart } from './types';
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
    // Get API key from .env.local (set by Vite during build)
    const envApiKey = process.env.GEMINI_API_KEY || '';
    
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
    
    const [externalApiKey, setExternalApiKey] = useState<string>(() => localStorage.getItem('externalApiKey') || '');
    const [externalApiEndpoint, setExternalApiEndpoint] = useState<string>(() => localStorage.getItem('externalApiEndpoint') || 'https://api.openai.com/v1/chat/completions');

    useEffect(() => { localStorage.setItem('apiProvider', apiProvider); }, [apiProvider]);
    useEffect(() => { localStorage.setItem('geminiApiKey', geminiApiKey); }, [geminiApiKey]);
    useEffect(() => { localStorage.setItem('externalApiKey', externalApiKey); }, [externalApiKey]);
    useEffect(() => { localStorage.setItem('externalApiEndpoint', externalApiEndpoint); }, [externalApiEndpoint]);

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
            apiConfig = { provider: 'external', apiKey: externalApiKey, endpoint: externalApiEndpoint };
        }

        try {
            const modelParts = await runQuery(apiConfig, prompt, images, options);
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
    }, [apiProvider, geminiApiKey, externalApiKey, externalApiEndpoint, isApiConfigured]);

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
            />
            <ChatWindow messages={messages} isLoading={isLoading} />
            <InputBar onSend={handleSend} isLoading={isLoading} disabled={!isApiConfigured} />
        </div>
    );
};

export default App;
