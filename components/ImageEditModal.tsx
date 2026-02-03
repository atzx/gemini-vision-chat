import React, { useState, useEffect, useRef, useCallback } from 'react';

interface ImageFilters {
  rotation: number;
  inverted: boolean;
  sepia: boolean;
  grayscale: boolean;
  blur: number;
  brightness: number;
  contrast: number;
}

interface DrawingState {
  isDrawing: boolean;
  tool: 'brush' | 'rectangle' | 'circle' | 'arrow' | 'text' | 'eraser';
  color: string;
  size: number;
  opacity: number;
  startX: number;
  startY: number;
}

interface TextAnnotation {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  size: number;
}

interface ImageEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  onUpdate: (index: number, filters: ImageFilters, drawingData?: string) => void;
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

const defaultDrawingState: DrawingState = {
  isDrawing: false,
  tool: 'brush',
  color: '#ffffff',
  size: 3,
  opacity: 100,
  startX: 0,
  startY: 0,
};

const COLORS = [
  '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', 
  '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080'
];

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
  const [activeTab, setActiveTab] = useState<'filters' | 'draw' | 'text'>('filters');
  const [drawingState, setDrawingState] = useState<DrawingState>(defaultDrawingState);
  const [textAnnotations, setTextAnnotations] = useState<TextAnnotation[]>([]);
  const [currentText, setCurrentText] = useState('');
  const [textPosition, setTextPosition] = useState<{x: number, y: number} | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Store layout metrics for cropping the drawing later
  const layoutMetricsRef = useRef({ 
    offsetX: 0, 
    offsetY: 0, 
    displayWidth: 0, 
    displayHeight: 0 
  });

  // Initialize canvas when image loads
  useEffect(() => {
    setImageFilters(initialFilters || defaultFilters);
    // Clear canvas and text annotations when switching images
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    setTextAnnotations([]);
  }, [selectedIndex, initialFilters]);

  // Initialize canvas when image loads
  useEffect(() => {
    if (images[selectedIndex] && canvasRef.current && containerRef.current) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageRef.current = img;
        // Wait for image to render in DOM before positioning canvas
        requestAnimationFrame(() => {
          updateCanvasSize();
        });
      };
      img.src = images[selectedIndex];
    }
  }, [images, selectedIndex]);

  // Update canvas size on window resize
  useEffect(() => {
    const handleResize = () => {
      updateCanvasSize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update canvas size when tab changes to draw
  useEffect(() => {
    if (activeTab === 'draw' || activeTab === 'text') {
      requestAnimationFrame(() => {
        updateCanvasSize();
      });
    }
  }, [activeTab]);

  // Update canvas size when filters change (rotation affects dimensions)
  useEffect(() => {
    requestAnimationFrame(() => {
      updateCanvasSize();
    });
  }, [imageFilters.rotation, imageFilters.blur, imageFilters.inverted, imageFilters.sepia, imageFilters.grayscale, imageFilters.brightness, imageFilters.contrast]);

  const updateCanvasSize = () => {
    const img = imageRef.current;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    
    if (!img || !container || !canvas) return;

    // Get container dimensions (the full available area)
    const containerRect = container.getBoundingClientRect();
    
    // Set canvas to fill the entire container
    canvas.width = containerRect.width;
    canvas.height = containerRect.height;
    
    // Reset positioning to fill container
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.position = 'absolute';

    // Calculate metrics for saving (to crop later)
    const containerWidth = containerRect.width - 32; // Subtract padding
    const containerHeight = containerRect.height - 32;
    
    const isRotated = imageFilters.rotation === 90 || imageFilters.rotation === 270;
    const imgWidth = isRotated ? img.height : img.width;
    const imgHeight = isRotated ? img.width : img.height;
    
    const imgAspectRatio = imgWidth / imgHeight;
    const containerAspectRatio = containerWidth / containerHeight;
    
    let displayWidth, displayHeight;
    if (imgAspectRatio > containerAspectRatio) {
      displayWidth = containerWidth;
      displayHeight = containerWidth / imgAspectRatio;
    } else {
      displayHeight = containerHeight;
      displayWidth = containerHeight * imgAspectRatio;
    }
    
    const offsetX = (containerRect.width - displayWidth) / 2;
    const offsetY = (containerRect.height - displayHeight) / 2;

    layoutMetricsRef.current = { offsetX, offsetY, displayWidth, displayHeight };
  };

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
    // Combine canvas drawing with image
    let drawingData: string | undefined;
    if (canvasRef.current && (textAnnotations.length > 0 || hasDrawing())) {
      // Create a temporary canvas to crop the drawing to the image area
      const tempCanvas = document.createElement('canvas');
      const { offsetX, offsetY, displayWidth, displayHeight } = layoutMetricsRef.current;
      
      // Ensure we have valid dimensions
      if (displayWidth > 0 && displayHeight > 0) {
        tempCanvas.width = displayWidth;
        tempCanvas.height = displayHeight;
        const ctx = tempCanvas.getContext('2d');
        if (ctx) {
            // Draw only the part of the main canvas where the image is
            ctx.drawImage(
                canvasRef.current,
                offsetX, offsetY, displayWidth, displayHeight, // Source crop
                0, 0, displayWidth, displayHeight // Destination
            );
            drawingData = tempCanvas.toDataURL('image/png');
        }
      } else {
        // Fallback if something is wrong with metrics
        drawingData = canvasRef.current.toDataURL('image/png');
      }
    }
    onUpdate(selectedIndex, imageFilters, drawingData);
    onClose();
  };

  const hasDrawing = (): boolean => {
    if (!canvasRef.current) return false;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return false;
    const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    return imageData.data.some((value, index) => index % 4 !== 3 && value !== 0);
  };

  const resetFilters = () => {
    setImageFilters(defaultFilters);
  };

  const updateFilter = <K extends keyof ImageFilters>(key: K, value: ImageFilters[K]) => {
    setImageFilters(prev => ({ ...prev, [key]: value }));
  };

  // Drawing functions
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    // Using native offset is reliable because it's relative to the target element (canvas)
    // and accounts for border-box/padding-box.
    // We also correct for any resolution mismatch.
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: e.nativeEvent.offsetX * scaleX,
      y: e.nativeEvent.offsetY * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (drawingState.tool === 'text') {
      const coords = getCanvasCoordinates(e);
      setTextPosition(coords);
      return;
    }

    const coords = getCanvasCoordinates(e);
    setDrawingState(prev => ({ 
      ...prev, 
      isDrawing: true, 
      startX: coords.x, 
      startY: coords.y 
    }));

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.strokeStyle = drawingState.color;
    ctx.lineWidth = drawingState.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = drawingState.opacity / 100;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingState.isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const coords = getCanvasCoordinates(e);

    if (drawingState.tool === 'brush' || drawingState.tool === 'eraser') {
      ctx.globalCompositeOperation = drawingState.tool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  };

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingState.isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const coords = getCanvasCoordinates(e);

    if (drawingState.tool === 'rectangle') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = drawingState.color;
      ctx.lineWidth = drawingState.size;
      ctx.globalAlpha = drawingState.opacity / 100;
      ctx.strokeRect(
        drawingState.startX,
        drawingState.startY,
        coords.x - drawingState.startX,
        coords.y - drawingState.startY
      );
    } else if (drawingState.tool === 'circle') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = drawingState.color;
      ctx.lineWidth = drawingState.size;
      ctx.globalAlpha = drawingState.opacity / 100;
      const radius = Math.sqrt(
        Math.pow(coords.x - drawingState.startX, 2) + 
        Math.pow(coords.y - drawingState.startY, 2)
      );
      ctx.beginPath();
      ctx.arc(drawingState.startX, drawingState.startY, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (drawingState.tool === 'arrow') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = drawingState.color;
      ctx.fillStyle = drawingState.color;
      ctx.lineWidth = drawingState.size;
      ctx.globalAlpha = drawingState.opacity / 100;
      
      const headLength = drawingState.size * 3;
      const dx = coords.x - drawingState.startX;
      const dy = coords.y - drawingState.startY;
      const angle = Math.atan2(dy, dx);
      
      // Draw line
      ctx.beginPath();
      ctx.moveTo(drawingState.startX, drawingState.startY);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      
      // Draw arrowhead
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      ctx.lineTo(
        coords.x - headLength * Math.cos(angle - Math.PI / 6),
        coords.y - headLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        coords.x - headLength * Math.cos(angle + Math.PI / 6),
        coords.y - headLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
    }

    setDrawingState(prev => ({ ...prev, isDrawing: false }));
    ctx.globalCompositeOperation = 'source-over';
  };

  const addTextAnnotation = () => {
    if (!currentText.trim() || !textPosition) return;
    
    const newAnnotation: TextAnnotation = {
      id: Date.now().toString(),
      text: currentText,
      x: textPosition.x,
      y: textPosition.y,
      color: drawingState.color,
      size: drawingState.size * 3,
    };
    
    setTextAnnotations(prev => [...prev, newAnnotation]);
    
    // Draw text on canvas
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = drawingState.color;
      ctx.font = `${drawingState.size * 3}px Arial`;
      ctx.globalAlpha = drawingState.opacity / 100;
      ctx.fillText(currentText, textPosition.x, textPosition.y);
    }
    
    setCurrentText('');
    setTextPosition(null);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setTextAnnotations([]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg p-4 max-w-6xl w-full h-4/5 flex gap-4 relative" onClick={e => e.stopPropagation()}>
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
        <div ref={containerRef} className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-900 rounded-lg overflow-hidden relative">
          {images[selectedIndex] && (
            <>
              <img
                src={images[selectedIndex]}
                alt="Selected for editing"
                className="max-w-full max-h-full object-contain rounded-md absolute"
                style={{
                  transform: `rotate(${imageFilters.rotation}deg)`,
                  filter: applyFilters(),
                }}
              />
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="absolute inset-0 w-full h-full cursor-crosshair"
                style={{ zIndex: 10 }}
              />
            </>
          )}
        </div>

        {/* Sidebar Tools */}
        <div className="w-80 flex flex-col gap-4">
          {/* Thumbnails */}
          <div className="flex-1 bg-slate-900 p-3 rounded-lg min-h-0 max-h-48">
            <h3 className="text-white text-sm mb-2 font-semibold">Imágenes</h3>
            <div className="overflow-auto h-full">
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
              onClick={() => setActiveTab('draw')}
              className={`flex-1 py-2 px-3 text-sm rounded-md transition-colors ${activeTab === 'draw' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
            >
              Dibujar
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`flex-1 py-2 px-3 text-sm rounded-md transition-colors ${activeTab === 'text' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
            >
              Texto
            </button>
          </div>

          {/* Tools Panel */}
          <div className="bg-slate-900 p-3 rounded-lg flex-1 overflow-y-auto">
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
                </div>
              </div>
            )}

            {activeTab === 'draw' && (
              <div className="space-y-4">
                <h3 className="text-white text-sm font-semibold">Herramientas de Dibujo</h3>
                
                {/* Tools Grid */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setDrawingState(prev => ({ ...prev, tool: 'brush' }))}
                    className={`p-2 rounded-lg text-sm transition-colors ${drawingState.tool === 'brush' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    title="Pincel"
                  >
                    <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDrawingState(prev => ({ ...prev, tool: 'rectangle' }))}
                    className={`p-2 rounded-lg text-sm transition-colors ${drawingState.tool === 'rectangle' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    title="Rectángulo"
                  >
                    <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDrawingState(prev => ({ ...prev, tool: 'circle' }))}
                    className={`p-2 rounded-lg text-sm transition-colors ${drawingState.tool === 'circle' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    title="Círculo"
                  >
                    <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" strokeWidth={2} />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDrawingState(prev => ({ ...prev, tool: 'arrow' }))}
                    className={`p-2 rounded-lg text-sm transition-colors ${drawingState.tool === 'arrow' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    title="Flecha"
                  >
                    <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDrawingState(prev => ({ ...prev, tool: 'text' }))}
                    className={`p-2 rounded-lg text-sm transition-colors ${drawingState.tool === 'text' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    title="Texto"
                  >
                    <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDrawingState(prev => ({ ...prev, tool: 'eraser' }))}
                    className={`p-2 rounded-lg text-sm transition-colors ${drawingState.tool === 'eraser' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    title="Borrador"
                  >
                    <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* Color Palette */}
                <div className="space-y-2">
                  <span className="text-xs text-slate-400">Color</span>
                  <div className="flex flex-wrap gap-1">
                    {COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setDrawingState(prev => ({ ...prev, color }))}
                        className={`w-6 h-6 rounded-full border-2 ${drawingState.color === color ? 'border-white' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                {/* Size Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Tamaño</span>
                    <span>{drawingState.size}px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    step="1"
                    value={drawingState.size}
                    onChange={(e) => setDrawingState(prev => ({ ...prev, size: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>

                {/* Opacity Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Opacidad</span>
                    <span>{drawingState.opacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={drawingState.opacity}
                    onChange={(e) => setDrawingState(prev => ({ ...prev, opacity: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>

                {/* Clear Button */}
                <button
                  onClick={clearCanvas}
                  className="w-full p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Limpiar Todo
                </button>
              </div>
            )}

            {activeTab === 'text' && (
              <div className="space-y-4">
                <h3 className="text-white text-sm font-semibold">Añadir Texto</h3>
                
                <div className="text-xs text-slate-400 bg-slate-800 p-2 rounded">
                  Selecciona la herramienta "Texto" en la pestaña Dibujar y haz clic en la imagen para colocar texto.
                </div>

                {/* Text Input */}
                {textPosition && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={currentText}
                      onChange={(e) => setCurrentText(e.target.value)}
                      placeholder="Escribe tu texto..."
                      className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={addTextAnnotation}
                        className="flex-1 p-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-500 transition-colors"
                      >
                        Añadir
                      </button>
                      <button
                        onClick={() => { setTextPosition(null); setCurrentText(''); }}
                        className="flex-1 p-2 bg-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-600 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Text List */}
                {textAnnotations.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs text-slate-400">Textos añadidos:</span>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {textAnnotations.map((annotation, index) => (
                        <div key={annotation.id} className="flex items-center justify-between bg-slate-800 p-2 rounded text-xs">
                          <span className="text-slate-300 truncate flex-1">{index + 1}. {annotation.text}</span>
                          <button
                            onClick={() => {
                              setTextAnnotations(prev => prev.filter(a => a.id !== annotation.id));
                              // Redraw canvas without this text
                              clearCanvas();
                              textAnnotations.filter(a => a.id !== annotation.id).forEach(a => {
                                const canvas = canvasRef.current;
                                const ctx = canvas?.getContext('2d');
                                if (canvas && ctx) {
                                  ctx.fillStyle = a.color;
                                  ctx.font = `${a.size}px Arial`;
                                  ctx.fillText(a.text, a.x, a.y);
                                }
                              });
                            }}
                            className="text-red-400 hover:text-red-300 ml-2"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
