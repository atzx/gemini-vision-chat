import React, { useState, useEffect } from 'react';

interface ImageEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    images: string[];
    onUpdate: (index: number, filters: any) => void;
    onSelect: (index: number) => void;
    selectedIndex: number;
    initialFilters: any;
}

const ImageEditModal: React.FC<ImageEditModalProps> = ({ isOpen, onClose, images, onUpdate, onSelect, selectedIndex, initialFilters }) => {
    const [imageFilters, setImageFilters] = useState(initialFilters || {
        rotation: 0,
        inverted: false,
        sepia: false,
    });

    useEffect(() => {
        setImageFilters(initialFilters || { rotation: 0, inverted: false, sepia: false });
    }, [selectedIndex, initialFilters]);

    if (!isOpen) return null;

    const applyFilters = () => {
        let filterStyle = '';
        if (imageFilters.inverted) filterStyle += 'invert(100%) ';
        if (imageFilters.sepia) filterStyle += 'sepia(100%) ';
        return filterStyle;
    };

    const handleUpdate = () => {
        onUpdate(selectedIndex, imageFilters);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-slate-800 rounded-lg p-4 max-w-4xl w-full h-3/4 flex gap-4" onClick={e => e.stopPropagation()}>
                <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-900 rounded-lg">
                    {images[selectedIndex] && (
                        <img
                            src={images[selectedIndex]}
                            alt="Selected for editing"
                            className="max-h-full max-w-full rounded-md"
                            style={{
                                transform: `rotate(${imageFilters.rotation}deg)`,
                                filter: applyFilters(),
                            }}
                        />
                    )}
                </div>
                <div className="w-1/3 flex flex-col gap-4">
                    <div className="flex-1 overflow-y-auto bg-slate-900 p-2 rounded-lg">
                        <h3 className="text-white text-lg mb-2 font-semibold">Images</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {images.map((img, index) => (
                                <img
                                    key={index}
                                    src={img}
                                    alt={`Thumbnail ${index}`}
                                    className={`w-full h-auto object-cover rounded-md cursor-pointer transition-all duration-200 ${selectedIndex === index ? 'ring-2 ring-purple-500' : 'opacity-70 hover:opacity-100'}`}
                                    onClick={() => onSelect(index)}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg">
                         <h3 className="text-white text-lg mb-2 font-semibold">Edit Tools</h3>
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => setImageFilters(f => ({ ...f, rotation: (f.rotation + 90) % 360 }))} className="p-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">Rotate</button>
                            <button onClick={() => setImageFilters(f => ({ ...f, inverted: !f.inverted }))} className="p-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">Invert</button>
                            <button onClick={() => setImageFilters(f => ({ ...f, sepia: !f.sepia }))} className="p-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">Sepia</button>
                        </div>
                    </div>
                     <button onClick={handleUpdate} className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors font-bold">Apply & Close</button>
                </div>
            </div>
        </div>
    );
};

export default ImageEditModal;
