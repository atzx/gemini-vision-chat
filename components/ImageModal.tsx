import React from 'react';

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose }) => {
  const [zoom, setZoom] = React.useState(1);

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.5));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
      <div className="relative max-w-[90vw] max-h-[90vh] overflow-auto rounded-lg" onClick={e => e.stopPropagation()}>
        <img 
          src={imageUrl} 
          alt="Enlarged content" 
          className="transition-transform duration-200"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
        />
      </div>
      <button 
        onClick={onClose} 
        className="fixed top-4 right-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full w-12 h-12 flex items-center justify-center text-2xl z-[9999]"
      >
        &times;
      </button>
      <div className="fixed bottom-4 right-4 flex space-x-2" onClick={e => e.stopPropagation()}>
        <button onClick={handleZoomIn} className="bg-gray-800 text-white p-2 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button onClick={handleZoomOut} className="bg-gray-800 text-white p-2 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ImageModal;
