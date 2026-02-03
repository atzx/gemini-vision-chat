import React, { useState, useEffect } from 'react';

interface ImageFilters {
    rotation: number;
    inverted: boolean;
    sepia: boolean;
    grayscale: boolean;
    blur: number;
    brightness: number;
    contrast: number;
}

interface ImageEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    images: string[];
    onUpdate: (index: number, filters: ImageFilters) => void;
    onSelect: (index: number) => void;
    selectedIndex: number;
    initialFilters: ImageFilters | null;
}

const defaultFilters: ImageFilters = {
    rotation: 0,
    inverted: false,
    sepia: false,
    grayscale: false,
    blur: 0,
    brightness: 100,
    contrast: 100,
};

const ImageEditModal: React.FC<ImageEditModalProps> = ({ 
    isOpen, 
    onClose, 
    images, 
    onUpdate, 
    onSelect, 
    selectedIndex, 
    initialFilters 
}) => {
    const [imageFilters, setImageFilters] = useState<ImageFilters>(defaultFilters);
    const [activeTab, setActiveTab] = useState<'filters' | 'adjustments'>('filters');

    useEffect(() => {
        setImageFilters(initialFilters || defaultFilters);
    }, [selectedIndex, initialFilters]);

    if (!isOpen) return null;

    const applyFilters = (): string => {
        const filters: string[] = [];
        if (imageFilters.inverted) filters.push('invert(100%)');
        if (imageFilters.sepia) filters.push('sepia(100%)');
        if (imageFilters.grayscale) filters.push('grayscale(100%)');
        if (imageFilters.blur > 0) filters.push(`blur(${imageFilters.blur}px)`);
        if (imageFilters.brightness !== 100) filters.push(`brightness(${imageFilters.brightness}%)`);
        if (imageFilters.contrast !== 100) filters.push(`contrast(${imageFilters.contrast}%)`);
        return filters.join(' ');
    };

    const handleUpdate = () => {
        onUpdate(selectedIndex, imageFilters);
        onClose();
    };

    const resetFilters = () => {
        setImageFilters(defaultFilters);
    };

    const updateFilter = <K extends keyof ImageFilters>(key: K, value: ImageFilters[K]) => {
        setImageFilters(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-slate-800 rounded-lg p-4 max-w-5xl w-full h-3/4 flex gap-4 relative" onClick={e => e.stopPropagation()}>
                <button 
                    onClick={onClose} 
                    className="absolute top-2 right-2 text-slate-400 hover:text-white transition-colors z-10"
                    aria-label="Close"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                
                {/* Image Preview Area */}
                <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-900 rounded-lg overflow-auto">
                    {images[selectedIndex] && (
                        <img
                            src={images[selectedIndex]}
                            alt="Selected for editing"
                            className="max-w-full max-h-full object-contain rounded-md"
                            style={{
                                transform: `rotate(${imageFilters.rotation}deg)`,
                                filter: applyFilters(),
                            }}
                        />
                    )}
                </div>

                {/* Sidebar Tools */}
                <div className="w-80 flex flex-col gap-4">
                    {/* Thumbnails */}
                    <div className="flex-1 bg-slate-900 p-3 rounded-lg min-h-0">
                        <h3 className="text-white text-sm mb-2 font-semibold">Imágenes</h3>
                        <div className="overflow-auto h-full max-h-48">
                            <div className="grid grid-cols-3 gap-2">
                                {images.map((img, index) => (
                                    <img
                                        key={index}
                                        src={img}
                                        alt={`Thumbnail ${index}`}
                                        className={`w-full aspect-square object-cover rounded-md cursor-pointer transition-all duration-200 ${selectedIndex === index ? 'ring-2 ring-purple-500' : 'opacity-70 hover:opacity-100'}`}
                                        onClick={() => onSelect(index)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex gap-1 bg-slate-900 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('filters')}
                            className={`flex-1 py-2 px-3 text-sm rounded-md transition-colors ${activeTab === 'filters' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                        >
                            Filtros
                        </button>
                        <button
                            onClick={() => setActiveTab('adjustments')}
                            className={`flex-1 py-2 px-3 text-sm rounded-md transition-colors ${activeTab === 'adjustments' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                        >
                            Ajustes
                        </button>
                    </div>

                    {/* Tools Panel */}
                    <div className="bg-slate-900 p-3 rounded-lg">
                        {activeTab === 'filters' && (
                            <div className="space-y-4">
                                <h3 className="text-white text-sm font-semibold">Filtros Rápidos</h3>
                                
                                {/* Quick Filters Grid */}
                                <div className="grid grid-cols-2 gap-2">
                                    <button 
                                        onClick={() => updateFilter('inverted', !imageFilters.inverted)}
                                        className={`p-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 ${imageFilters.inverted ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                        Invertir
                                    </button>
                                    <button 
                                        onClick={() => updateFilter('sepia', !imageFilters.sepia)}
                                        className={`p-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 ${imageFilters.sepia ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Sepia
                                    </button>
                                    <button 
                                        onClick={() => updateFilter('grayscale', !imageFilters.grayscale)}
                                        className={`p-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 ${imageFilters.grayscale ? 'bg-gray-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        B/N
                                    </button>
                                    <button 
                                        onClick={() => updateFilter('rotation', (imageFilters.rotation + 90) % 360)}
                                        className="p-2 bg-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Rotar
                                    </button>
                                </div>

                                {/* Blur Slider */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs text-slate-400">
                                        <span>Desenfoque</span>
                                        <span>{imageFilters.blur}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="20"
                                        step="0.5"
                                        value={imageFilters.blur}
                                        onChange={(e) => updateFilter('blur', parseFloat(e.target.value))}
                                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'adjustments' && (
                            <div className="space-y-4">
                                <h3 className="text-white text-sm font-semibold">Ajustes de Imagen</h3>
                                
                                {/* Brightness Slider */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs text-slate-400">
                                        <span>Brillo</span>
                                        <span>{imageFilters.brightness}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="200"
                                        step="1"
                                        value={imageFilters.brightness}
                                        onChange={(e) => updateFilter('brightness', parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                    />
                                    <div className="flex justify-between text-[10px] text-slate-500">
                                        <span>Oscuro</span>
                                        <span>Normal</span>
                                        <span>Brillante</span>
                                    </div>
                                </div>

                                {/* Contrast Slider */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs text-slate-400">
                                        <span>Contraste</span>
                                        <span>{imageFilters.contrast}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="200"
                                        step="1"
                                        value={imageFilters.contrast}
                                        onChange={(e) => updateFilter('contrast', parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                    />
                                    <div className="flex justify-between text-[10px] text-slate-500">
                                        <span>Bajo</span>
                                        <span>Normal</span>
                                        <span>Alto</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                        <button 
                            onClick={resetFilters}
                            className="w-full p-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors text-sm flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Restablecer
                        </button>
                        <button 
                            onClick={handleUpdate}
                            className="w-full p-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg hover:from-purple-500 hover:to-purple-400 transition-all font-bold shadow-lg"
                        >
                            Aplicar Cambios
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageEditModal;
