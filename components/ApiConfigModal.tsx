import React, { useState, useEffect } from 'react';
import { OpenRouterModelId, OPENROUTER_MODELS } from '../types';

type SelectedProvider = 'gemini_studio' | 'gemini_custom' | 'external';

export interface ApiModalConfig {
    selectedProvider: SelectedProvider;
    geminiKey: string;
    externalKey: string;
    externalEndpoint: string;
    externalModel?: OpenRouterModelId;
}

interface ApiConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (config: ApiModalConfig) => void;
    currentProvider: 'gemini' | 'external';
    currentGeminiKey: string;
    currentExternalKey: string;
    currentExternalEndpoint: string;
    currentExternalModel?: OpenRouterModelId;
}

const ApiConfigModal: React.FC<ApiConfigModalProps> = ({
    isOpen,
    onClose,
    onSave,
    currentProvider,
    currentGeminiKey,
    currentExternalKey,
    currentExternalEndpoint,
    currentExternalModel = 'google/gemini-2.5-flash-image'
}) => {
    
    const [selectedProvider, setSelectedProvider] = useState<SelectedProvider>('gemini_custom');
    const [geminiKey, setGeminiKey] = useState(currentGeminiKey);
    const [externalKey, setExternalKey] = useState(currentExternalKey);
    const [externalEndpoint, setExternalEndpoint] = useState(currentExternalEndpoint);
    const [externalModel, setExternalModel] = useState<OpenRouterModelId>(currentExternalModel);

    useEffect(() => {
        if (isOpen) {
            // Set initial state based on current app config
            if (currentProvider === 'external') {
                setSelectedProvider('external');
            } else {
                if (currentGeminiKey === 'USE_GOOGLE_AI_STUDIO') {
                    setSelectedProvider('gemini_studio');
                } else {
                    setSelectedProvider('gemini_custom');
                }
            }
            setGeminiKey(currentGeminiKey === 'USE_GOOGLE_AI_STUDIO' ? '' : currentGeminiKey);
            setExternalKey(currentExternalKey);
            setExternalEndpoint(currentExternalEndpoint);
            setExternalModel(currentExternalModel);
        }
    }, [isOpen, currentProvider, currentGeminiKey, currentExternalKey, currentExternalEndpoint, currentExternalModel]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave({
            selectedProvider,
            geminiKey,
            externalKey,
            externalEndpoint,
            externalModel,
        });
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-slate-700"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold mb-4 text-white">Configuración de API</h2>

                <div className="space-y-4">
                    <fieldset className="space-y-3">
                        <legend className="text-sm font-medium text-slate-300 mb-2">Proveedor de API</legend>
                        <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-slate-700/50 transition-colors">
                            <input type="radio" name="provider" value="gemini_studio" checked={selectedProvider === 'gemini_studio'} onChange={() => setSelectedProvider('gemini_studio')} className="form-radio text-cyan-500 bg-slate-700 border-slate-600 focus:ring-cyan-500" />
                            <span>Google AI Studio (Sistema)</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-slate-700/50 transition-colors">
                            <input type="radio" name="provider" value="gemini_custom" checked={selectedProvider === 'gemini_custom'} onChange={() => setSelectedProvider('gemini_custom')} className="form-radio text-cyan-500 bg-slate-700 border-slate-600 focus:ring-cyan-500" />
                            <span>Google Gemini (Clave Personal)</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-slate-700/50 transition-colors">
                            <input type="radio" name="provider" value="external" checked={selectedProvider === 'external'} onChange={() => setSelectedProvider('external')} className="form-radio text-cyan-500 bg-slate-700 border-slate-600 focus:ring-cyan-500" />
                            <span>OpenRouter (API Externa)</span>
                        </label>
                    </fieldset>

                    {selectedProvider === 'gemini_studio' && (
                        <div className="p-3 bg-slate-700/50 rounded-md text-sm text-slate-300">
                           Esta opción utiliza la clave de API proporcionada por el entorno de ejecución, como en Google AI Studio. No se requiere configuración adicional.
                        </div>
                    )}

                    {selectedProvider === 'gemini_custom' && (
                        <div>
                            <label htmlFor="gemini-key-modal" className="block text-sm font-medium text-slate-300 mb-1">Clave de API de Gemini</label>
                            <input
                                id="gemini-key-modal"
                                type="password"
                                value={geminiKey}
                                onChange={(e) => setGeminiKey(e.target.value)}
                                placeholder="Introduce tu clave de API de Gemini"
                                className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>
                    )}
                    
                    {selectedProvider === 'external' && (
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="external-key-modal" className="block text-sm font-medium text-slate-300 mb-1">Clave de API de OpenRouter</label>
                                <input
                                    id="external-key-modal"
                                    type="password"
                                    value={externalKey}
                                    onChange={(e) => setExternalKey(e.target.value)}
                                    placeholder="sk-or-v1-..."
                                    className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="external-endpoint-modal" className="block text-sm font-medium text-slate-300 mb-1">Endpoint de OpenRouter</label>
                                <input
                                    id="external-endpoint-modal"
                                    type="text"
                                    value={externalEndpoint}
                                    onChange={(e) => setExternalEndpoint(e.target.value)}
                                    placeholder="https://openrouter.ai/api/v1/chat/completions"
                                    className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="external-model-modal" className="block text-sm font-medium text-slate-300 mb-1">Modelo</label>
                                <select
                                    id="external-model-modal"
                                    value={externalModel}
                                    onChange={(e) => setExternalModel(e.target.value as OpenRouterModelId)}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                >
                                    {OPENROUTER_MODELS.map((model) => (
                                        <option key={model.id} value={model.id}>
                                            {model.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-400 mt-1">
                                    {OPENROUTER_MODELS.find(m => m.id === externalModel)?.supportsImages 
                                        ? '✓ Soporta imágenes' 
                                        : '✗ No soporta imágenes'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 rounded-md bg-slate-600 hover:bg-slate-500 text-white font-semibold transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSave}
                        className="px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-colors"
                    >
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApiConfigModal;