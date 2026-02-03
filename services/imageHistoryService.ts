const API_BASE_URL = 'http://localhost:3001';

export interface SaveImageData {
  imageData: string;
  prompt: string;
  mimeType?: string;
}

export async function saveGeneratedImage(data: SaveImageData): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/save-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Image saved successfully:', result);
      return true;
    } else {
      const error = await response.json();
      console.error('Error saving image:', error);
      return false;
    }
  } catch (error) {
    console.error('Failed to save image:', error);
    return false;
  }
}

// Función para extraer imagen de los MessagePart y guardarla
export function extractAndSaveImage(
  parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>,
  prompt: string
): void {
  // Buscar partes con imágenes
  const imageParts = parts.filter(part => part.inlineData);
  
  if (imageParts.length === 0) {
    console.log('No images found in response');
    return;
  }

  // Guardar cada imagen encontrada
  imageParts.forEach((part, index) => {
    if (part.inlineData) {
      const imageData = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      const imagePrompt = index === 0 ? prompt : `${prompt} (${index + 1})`;
      
      saveGeneratedImage({
        imageData,
        prompt: imagePrompt,
        mimeType: part.inlineData.mimeType,
      });
    }
  });
}