import React, { useState, useRef, useEffect } from 'react';
import ImageEditModal from './ImageEditModal';
import { IMAGE_GENERATION_MODELS, ImageGenerationModel } from '../types';

interface InputBarProps {
    onSend: (
        prompt: string, 
        images?: { mimeType:string, data: string }[],
        options?: { isImageEditMode?: boolean, isImageGenerationMode?: boolean, imageGenerationModel?: string }
    ) => void;
    isLoading: boolean;
    disabled?: boolean;
}

// Helper to convert a file to a base64 string
const fileToBase64 = (file: File): Promise<{ mimeType: string, data: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            const data = result.split(',')[1];
            resolve({ mimeType: file.type, data });
        };
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
};


const InputBar: React.FC<InputBarProps> = ({ onSend, isLoading, disabled = false }) => {
    const [prompt, setPrompt] = useState('');
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isImageGenerationMode, setIsImageGenerationMode] = useState(false);
    const [selectedImageGenerationModel, setSelectedImageGenerationModel] = useState<string>(IMAGE_GENERATION_MODELS[0].id);
    const [imageFilters, setImageFilters] = useState<any[]>([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [tooltipModel, setTooltipModel] = useState<ImageGenerationModel | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isDisabled = isLoading || disabled;

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [prompt]);

    useEffect(() => {
        if (imageFiles.length > 0) {
            setIsImageGenerationMode(false); // Cannot generate if image is attached
        }
    }, [imageFiles]);

     useEffect(() => {
        if (!prompt.trim()) {
            setIsImageGenerationMode(false); // Cannot generate without a prompt
        }
    }, [prompt]);


    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            const newFiles = Array.from(files);
            setImageFiles(prev => [...prev, ...newFiles]);
            newFiles.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreviews(prev => [...prev, reader.result as string]);
                    setImageFilters(prev => [...prev, { rotation: 0, inverted: false, sepia: false }]);
                };
                reader.readAsDataURL(file);
            });
        }
    };
    
    const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const items = event.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    event.preventDefault();
                    setImageFiles(prev => [...prev, file]);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setImagePreviews(prev => [...prev, reader.result as string]);
                        setImageFilters(prev => [...prev, { rotation: 0, inverted: false, sepia: false }]);
                    };
                    reader.readAsDataURL(file);
                }
            }
        }
    };


    const handleSend = async () => {
        if (isDisabled || (!prompt.trim() && imageFiles.length === 0)) return;

        const applyFiltersToImage = (imageUrl: string, filters: any): Promise<{ mimeType: string, data: string }> => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    // Temp canvas for filtering
                    const tempCanvas = document.createElement('canvas');
                    const tempCtx = tempCanvas.getContext('2d');
                    if (!tempCtx) return reject(new Error('Could not get canvas context'));
                    tempCanvas.width = img.width;
                    tempCanvas.height = img.height;
                    tempCtx.drawImage(img, 0, 0);

                    if (filters.inverted || filters.sepia) {
                        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                        const data = imageData.data;
                        for (let i = 0; i < data.length; i += 4) {
                            let r = data[i], g = data[i + 1], b = data[i + 2];
                            if (filters.inverted) {
                                r = 255 - r;
                                g = 255 - g;
                                b = 255 - b;
                            }
                            if (filters.sepia) {
                                const sr = r * 0.393 + g * 0.769 + b * 0.189;
                                const sg = r * 0.349 + g * 0.686 + b * 0.168;
                                const sb = r * 0.272 + g * 0.534 + b * 0.131;
                                r = Math.min(255, sr);
                                g = Math.min(255, sg);
                                b = Math.min(255, sb);
                            }
                            data[i] = r;
                            data[i + 1] = g;
                            data[i + 2] = b;
                        }
                        tempCtx.putImageData(imageData, 0, 0);
                    }

                    // Final canvas for rotation
                    const finalCanvas = document.createElement('canvas');
                    const finalCtx = finalCanvas.getContext('2d');
                    if (!finalCtx) return reject(new Error('Could not get canvas context'));

                    if (filters.rotation === 90 || filters.rotation === 270) {
                        finalCanvas.width = img.height;
                        finalCanvas.height = img.width;
                    } else {
                        finalCanvas.width = img.width;
                        finalCanvas.height = img.height;
                    }

                    finalCtx.translate(finalCanvas.width / 2, finalCanvas.height / 2);
                    finalCtx.rotate(filters.rotation * Math.PI / 180);
                    finalCtx.drawImage(tempCanvas, -img.width / 2, -img.height / 2);

                    const dataUrl = finalCanvas.toDataURL('image/png');
                    const data = dataUrl.split(',')[1];
                    resolve({ mimeType: 'image/png', data });
                };
                img.onerror = reject;
                img.src = imageUrl;
            });
        };

        const imagePayloads = await Promise.all(
            imagePreviews.map((preview, index) => applyFiltersToImage(preview, imageFilters[index]))
        );

        onSend(prompt, imagePayloads, { 
            isImageEditMode: imageFiles.length > 0, 
            isImageGenerationMode,
            imageGenerationModel: isImageGenerationMode ? selectedImageGenerationModel : undefined
        });

        setPrompt('');
        setImageFiles([]);
        setImagePreviews([]);
        setImageFilters([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSend();
        }
    };

    const removeImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
        setImageFilters(prev => prev.filter((_, i) => i !== index));
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleUpdateFilters = (index: number, filters: any) => {
        setImageFilters(prev => prev.map((f, i) => i === index ? filters : f));
    };

    return (
        <>
            <ImageEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                images={imagePreviews}
                onUpdate={handleUpdateFilters}
                onSelect={setSelectedImageIndex}
                selectedIndex={selectedImageIndex}
                initialFilters={imageFilters[selectedImageIndex]}
            />
            <footer className="bg-slate-800/70 backdrop-blur-sm p-4 border-t border-slate-700">
                <div className="max-w-4xl mx-auto">
                    {imagePreviews.length > 0 && (
                        <div className="mb-2 flex gap-2 flex-wrap">
                            {imagePreviews.map((preview, index) => (
                                <div key={index} className="relative w-fit">
                                    <img 
                                        src={preview} 
                                        alt={`Preview ${index}`} 
                                        className="h-24 w-auto rounded-lg"
                                    />
                                    <button 
                                        onClick={() => removeImage(index)} 
                                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center hover:bg-red-700 transition-colors"
                                        aria-label={`Remove image ${index}`}
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    {isImageGenerationMode && (
                        <div className="mb-3">
                            <label className="text-sm text-slate-400 mb-1 block">Select Image Generation Model</label>
                            <div className="relative">
                                <select
                                    value={selectedImageGenerationModel}
                                    onChange={(e) => setSelectedImageGenerationModel(e.target.value)}
                                    className="w-full bg-slate-700 text-slate-100 border border-slate-600 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent appearance-none cursor-pointer"
                                >
                                    {IMAGE_GENERATION_MODELS.map((model) => (
                                        <option key={model.id} value={model.id}>
                                            {model.provider} - {model.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-sm">
                                <span className="text-slate-300">
                                    {IMAGE_GENERATION_MODELS.find(m => m.id === selectedImageGenerationModel)?.provider} - {IMAGE_GENERATION_MODELS.find(m => m.id === selectedImageGenerationModel)?.name}
                                </span>
                                <div className="relative">
                                    <button
                                        onMouseEnter={() => setTooltipModel(IMAGE_GENERATION_MODELS.find(m => m.id === selectedImageGenerationModel) || null)}
                                        onMouseLeave={() => setTooltipModel(null)}
                                        onClick={() => setTooltipModel(tooltipModel ? null : IMAGE_GENERATION_MODELS.find(m => m.id === selectedImageGenerationModel) || null)}
                                        className="text-cyan-400 hover:text-cyan-300 transition-colors"
                                        aria-label="Model information"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </button>
                                    {tooltipModel && tooltipModel.id === selectedImageGenerationModel && (
                                        <div className="absolute bottom-full left-0 mb-2 w-80 bg-slate-800 border border-slate-600 rounded-lg shadow-xl p-3 z-50">
                                            <div className="text-slate-100 font-semibold mb-1">{tooltipModel.name}</div>
                                            <div className="text-cyan-400 text-xs mb-2">{tooltipModel.tokens}</div>
                                            <div className="text-slate-300 text-sm leading-relaxed">{tooltipModel.description}</div>
                                            <div className="absolute bottom-0 left-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-slate-800 border-r border-b border-slate-600"></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="relative flex items-end bg-slate-700 rounded-lg p-2 gap-1">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isDisabled}
                        className="p-2 text-slate-400 hover:text-cyan-400 disabled:opacity-50 transition-colors"
                        aria-label="Attach image"
                        title="Attach image"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                        multiple
                        disabled={isDisabled}
                    />
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        disabled={isDisabled || imageFiles.length === 0}
                        className={`p-2 rounded-lg transition-colors text-slate-400 hover:text-purple-400 disabled:opacity-50 disabled:hover:text-slate-400 disabled:cursor-not-allowed`}
                        aria-label="Toggle Image Edit Mode"
                        title="Toggle Image Edit Mode"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z"></path></svg>
                    </button>
                     <button
                        onClick={() => setIsImageGenerationMode(prev => !prev)}
                        disabled={isDisabled || imageFiles.length > 0}
                        className={`p-2 rounded-lg transition-colors ${
                            isImageGenerationMode ? 'bg-cyan-500 text-white' : 'text-slate-400'
                        } hover:text-cyan-400 disabled:opacity-50 disabled:hover:text-slate-400 disabled:cursor-not-allowed`}
                        aria-label="Toggle Image Generation Mode"
                        title="Toggle Image Generation Mode"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
                    </button>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        ref={textareaRef}
                        placeholder={disabled ? "Please configure your API key in the header." : isImageGenerationMode ? "Describe the image you want to generate..." : "Type your message or add an image..."}
                        className="flex-1 bg-transparent resize-none focus:outline-none p-2 text-slate-100 placeholder-slate-400 max-h-[18rem] overflow-y-auto"
                        rows={1}
                        disabled={isDisabled}
                        style={{ height: 'auto' }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isDisabled || (!prompt.trim() && imageFiles.length === 0)}
                        className="p-2 rounded-full bg-cyan-500 text-white hover:bg-cyan-600 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                        aria-label="Send message"
                    >
                        {isLoading ? (
                           <div className="w-6 h-6 animate-spin rounded-full border-2 border-slate-800 border-t-white"></div>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                        )}
                    </button>
                    </div>
                </div>
            </footer>
        </>
    );
};

export default InputBar;
