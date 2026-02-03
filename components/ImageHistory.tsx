import React, { useState, useEffect, useCallback } from 'react';
import ImageModal from './ImageModal';

interface ImageMetadata {
  filename: string;
  originalPrompt: string;
  title: string;
  createdAt: string;
  updatedAt?: string;
  mimeType: string;
  url: string;
}

interface ImageHistoryProps {
  onImageClick?: (image: ImageMetadata) => void;
}

const API_BASE_URL = 'http://localhost:3001';

const ImageHistory: React.FC<ImageHistoryProps> = ({ onImageClick }) => {
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [viewMode, setViewMode] = useState<'thumbnails' | 'detailed'>('thumbnails');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [selectedImage, setSelectedImage] = useState<ImageMetadata | null>(null);
  const [serverStatus, setServerStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

  // Cargar imágenes al montar el componente
  const loadImages = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/images`, { 
        signal: AbortSignal.timeout(3000) // Timeout de 3 segundos
      });
      if (response.ok) {
        const data = await response.json();
        setImages(data);
        setServerStatus('connected');
      }
    } catch (error) {
      // Solo loguear el error la primera vez, no en cada intento
      if (serverStatus === 'connected') {
        console.log('Image history server not available. Run: npm run server');
      }
      setServerStatus('disconnected');
    } finally {
      setLoading(false);
    }
  }, [serverStatus]);

  useEffect(() => {
    loadImages();
    // Recargar cada 10 segundos (aumentado para reducir errores en consola)
    const interval = setInterval(loadImages, 10000);
    return () => clearInterval(interval);
  }, [loadImages]);

  // Actualizar título
  const handleUpdateTitle = async (filename: string, newTitle: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/images/${filename}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      });

      if (response.ok) {
        setImages(prev => prev.map(img => 
          img.filename === filename ? { ...img, title: newTitle } : img
        ));
        setEditingId(null);
      }
    } catch (error) {
      console.error('Error updating title:', error);
    }
  };

  // Eliminar imagen
  const handleDelete = async (filename: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta imagen?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/images/${filename}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setImages(prev => prev.filter(img => img.filename !== filename));
        if (selectedImage?.filename === filename) {
          setSelectedImage(null);
        }
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Iniciar edición
  const startEditing = (image: ImageMetadata) => {
    setEditingId(image.filename);
    setEditTitle(image.title);
  };

  // Guardar edición
  const saveEdit = (filename: string) => {
    handleUpdateTitle(filename, editTitle);
  };

  // Cancelar edición
  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  if (loading) {
    return (
      <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Historial</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-white">Historial</h2>
          <span 
            className={`w-2 h-2 rounded-full ${serverStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}
            title={serverStatus === 'connected' ? 'Servidor conectado' : 'Servidor desconectado'}
          />
        </div>
        <button
          onClick={() => setViewMode(viewMode === 'thumbnails' ? 'detailed' : 'thumbnails')}
          className="p-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
          title={viewMode === 'thumbnails' ? 'Ver detalles' : 'Solo miniaturas'}
        >
          {viewMode === 'thumbnails' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          )}
        </button>
      </div>

      {/* Image List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {images.length === 0 ? (
          <div className="text-center text-slate-500 py-8 px-4">
            <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm mb-2">No hay imágenes guardadas</p>
            {serverStatus === 'disconnected' && (
              <p className="text-xs text-red-400">
                Servidor desconectado.<br/>
                Ejecuta: npm run server
              </p>
            )}
          </div>
        ) : (
          images.map((image) => (
            <div
              key={image.filename}
              className={`group relative rounded-lg overflow-hidden cursor-pointer transition-all ${
                selectedImage?.filename === image.filename
                  ? 'ring-2 ring-cyan-400'
                  : 'hover:ring-2 hover:ring-slate-600'
              }`}
              onClick={() => {
                setSelectedImage(image);
                onImageClick?.(image);
              }}
              onDoubleClick={() => {
                setModalImageUrl(`${API_BASE_URL}${image.url}`);
              }}
              title="Doble clic para maximizar"
            >
              {/* Thumbnail */}
              <div className="aspect-square bg-slate-900">
                <img
                  src={`${API_BASE_URL}${image.url}`}
                  alt={image.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Detailed View Overlay */}
              {viewMode === 'detailed' && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  {editingId === image.filename ? (
                    <div className="space-y-1">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full text-xs bg-slate-800 text-white px-2 py-1 rounded border border-slate-600"
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            saveEdit(image.filename);
                          }}
                          className="flex-1 text-xs bg-cyan-600 text-white px-2 py-0.5 rounded hover:bg-cyan-500"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelEdit();
                          }}
                          className="flex-1 text-xs bg-slate-600 text-white px-2 py-0.5 rounded hover:bg-slate-500"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-white font-medium truncate">{image.title}</p>
                      <p className="text-[10px] text-slate-300">{formatDate(image.createdAt)}</p>
                    </>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                {viewMode === 'thumbnails' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(image);
                      setViewMode('detailed');
                    }}
                    className="p-1 bg-slate-800/80 rounded text-slate-300 hover:text-white"
                    title="Editar título"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(image.filename);
                  }}
                  className="p-1 bg-slate-800/80 rounded text-red-400 hover:text-red-300"
                  title="Eliminar"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer with count */}
      <div className="p-3 border-t border-slate-700 text-xs text-slate-400">
        <div className="flex items-center justify-between">
          <span>{images.length} imagen{images.length !== 1 ? 'es' : ''} guardada{images.length !== 1 ? 's' : ''}</span>
          {serverStatus === 'disconnected' && (
            <span className="text-red-400 text-[10px]">Sin conexión</span>
          )}
        </div>
      </div>

      {/* Modal para maximizar imagen */}
      {modalImageUrl && (
        <ImageModal
          imageUrl={modalImageUrl}
          onClose={() => setModalImageUrl(null)}
        />
      )}
    </div>
  );
};

export default ImageHistory;