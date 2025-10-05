import React, { useState, useRef, useEffect } from 'react';

interface InputBarProps {
    onSend: (
        prompt: string, 
        image?: { mimeType:string, data: string },
        options?: { isImageEditMode?: boolean, isImageGenerationMode?: boolean }
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
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isImageEditMode, setIsImageEditMode] = useState(false);
    const [isImageGenerationMode, setIsImageGenerationMode] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isDisabled = isLoading || disabled;

    useEffect(() => {
        if (imageFile) {
            setIsImageGenerationMode(false); // Cannot generate if image is attached
        }
        if (!imageFile) {
            setIsImageEditMode(false); // Cannot edit if no image is attached
        }
    }, [imageFile]);

     useEffect(() => {
        if (!prompt.trim()) {
            setIsImageGenerationMode(false); // Cannot generate without a prompt
        }
    }, [prompt]);


    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const items = event.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    event.preventDefault();
                    setImageFile(file);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setImagePreview(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                    break; // Stop after finding the first image
                }
            }
        }
    };


    const handleSend = async () => {
        if (isDisabled || (!prompt.trim() && !imageFile)) return;

        let imagePayload: { mimeType: string, data: string } | undefined = undefined;
        if (imageFile) {
            imagePayload = await fileToBase64(imageFile);
        }

        onSend(prompt, imagePayload, { isImageEditMode, isImageGenerationMode });

        setPrompt('');
        setImageFile(null);
        setImagePreview(null);
        setIsImageEditMode(false);
        setIsImageGenerationMode(false);
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

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <footer className="bg-slate-800/70 backdrop-blur-sm p-4 border-t border-slate-700">
            <div className="max-w-4xl mx-auto">
                {imagePreview && (
                    <div className="mb-2 relative w-fit">
                        <img src={imagePreview} alt="Preview" className="h-24 w-auto rounded-lg" />
                        <button 
                            onClick={removeImage} 
                            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center hover:bg-red-700 transition-colors"
                            aria-label="Remove image"
                        >
                            &times;
                        </button>
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
                        disabled={isDisabled}
                    />
                    <button
                        onClick={() => setIsImageEditMode(prev => !prev)}
                        disabled={isDisabled || !imageFile}
                        className={`p-2 rounded-lg transition-colors ${
                            isImageEditMode ? 'bg-purple-600 text-white' : 'text-slate-400'
                        } hover:text-purple-400 disabled:opacity-50 disabled:hover:text-slate-400 disabled:cursor-not-allowed`}
                        aria-label="Toggle Image Edit Mode"
                        title="Toggle Image Edit Mode"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z"></path></svg>
                    </button>
                     <button
                        onClick={() => setIsImageGenerationMode(prev => !prev)}
                        disabled={isDisabled || !!imageFile || !prompt.trim()}
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
                        placeholder={disabled ? "Please configure your API key in the header." : "Type your message or add an image..."}
                        className="flex-1 bg-transparent resize-none focus:outline-none p-2 text-slate-100 placeholder-slate-400 max-h-40"
                        rows={1}
                        disabled={isDisabled}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isDisabled || (!prompt.trim() && !imageFile)}
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
    );
};

export default InputBar;