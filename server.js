import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Directorio para imágenes generadas
const IMAGES_DIR = path.join(__dirname, 'generated-images');
const METADATA_FILE = path.join(IMAGES_DIR, 'metadata.json');

// Asegurar que el directorio existe
async function ensureDirectoryExists() {
  try {
    await fs.access(IMAGES_DIR);
  } catch {
    await fs.mkdir(IMAGES_DIR, { recursive: true });
    console.log(`Created directory: ${IMAGES_DIR}`);
  }
}

// Función para generar slug a partir del prompt (primeras 5 palabras)
function generateSlug(prompt) {
  const words = prompt.trim().toLowerCase()
    .replace(/[^\w\sáéíóúüñ]/g, '') // Remover caracteres especiales excepto espacios y letras
    .split(/\s+/)
    .slice(0, 5) // Tomar solo las primeras 5 palabras
    .join('_');
  return words || 'imagen';
}

// Función para generar nombre de archivo
function generateFilename(prompt) {
  const now = new Date();
  const dateStr = now.toISOString()
    .replace(/[:.]/g, '-')
    .slice(0, 19); // YYYY-MM-DDTHH-MM-SS
  const slug = generateSlug(prompt);
  return `${dateStr}_${slug}`;
}

// POST /api/save-image - Guardar nueva imagen
app.post('/api/save-image', async (req, res) => {
  try {
    const { imageData, prompt, mimeType = 'image/png' } = req.body;
    
    if (!imageData || !prompt) {
      return res.status(400).json({ error: 'Missing imageData or prompt' });
    }

    await ensureDirectoryExists();

    // Generar nombre de archivo
    const baseFilename = generateFilename(prompt);
    const extension = mimeType.split('/')[1] || 'png';
    const filename = `${baseFilename}.${extension}`;
    const filepath = path.join(IMAGES_DIR, filename);

    // Decodificar y guardar imagen
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    await fs.writeFile(filepath, buffer);

    // Guardar metadata
    const metadata = {
      filename,
      originalPrompt: prompt,
      title: generateSlug(prompt).replace(/_/g, ' '), // Título inicial
      createdAt: new Date().toISOString(),
      mimeType
    };

    // Leer metadata existente o crear nueva
    let allMetadata = [];
    try {
      const existingData = await fs.readFile(METADATA_FILE, 'utf8');
      allMetadata = JSON.parse(existingData);
    } catch {
      // Archivo no existe, usar array vacío
    }

    allMetadata.unshift(metadata); // Agregar al inicio (más reciente primero)
    await fs.writeFile(METADATA_FILE, JSON.stringify(allMetadata, null, 2));

    res.json({ 
      success: true, 
      filename,
      metadata 
    });
  } catch (error) {
    console.error('Error saving image:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/images - Listar todas las imágenes
app.get('/api/images', async (req, res) => {
  try {
    await ensureDirectoryExists();

    // Leer metadata
    let allMetadata = [];
    try {
      const data = await fs.readFile(METADATA_FILE, 'utf8');
      allMetadata = JSON.parse(data);
    } catch {
      // No hay metadata aún
    }

    // Verificar que los archivos existen
    const validImages = [];
    for (const meta of allMetadata) {
      const filepath = path.join(IMAGES_DIR, meta.filename);
      try {
        await fs.access(filepath);
        validImages.push({
          ...meta,
          url: `/api/images/${meta.filename}`
        });
      } catch {
        // Archivo no existe, ignorar
        console.log(`Image file not found: ${meta.filename}`);
      }
    }

    res.json(validImages);
  } catch (error) {
    console.error('Error listing images:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/images/:filename - Servir imagen
app.get('/api/images/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(IMAGES_DIR, filename);
    
    // Verificar que el archivo existe
    await fs.access(filepath);
    
    // Determinar content type
    const ext = path.extname(filename).toLowerCase();
    const contentType = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    }[ext] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    const data = await fs.readFile(filepath);
    res.send(data);
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(404).json({ error: 'Image not found' });
  }
});

// PUT /api/images/:filename - Actualizar título
app.put('/api/images/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Missing title' });
    }

    // Leer metadata
    let allMetadata = [];
    try {
      const data = await fs.readFile(METADATA_FILE, 'utf8');
      allMetadata = JSON.parse(data);
    } catch {
      return res.status(404).json({ error: 'Metadata not found' });
    }

    // Buscar y actualizar
    const imageIndex = allMetadata.findIndex(m => m.filename === filename);
    if (imageIndex === -1) {
      return res.status(404).json({ error: 'Image not found' });
    }

    allMetadata[imageIndex].title = title;
    allMetadata[imageIndex].updatedAt = new Date().toISOString();

    await fs.writeFile(METADATA_FILE, JSON.stringify(allMetadata, null, 2));

    res.json({ success: true, metadata: allMetadata[imageIndex] });
  } catch (error) {
    console.error('Error updating image:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/images/:filename - Eliminar imagen
app.delete('/api/images/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(IMAGES_DIR, filename);

    // Eliminar archivo
    try {
      await fs.unlink(filepath);
    } catch (error) {
      console.log(`File not found for deletion: ${filename}`);
    }

    // Actualizar metadata
    let allMetadata = [];
    try {
      const data = await fs.readFile(METADATA_FILE, 'utf8');
      allMetadata = JSON.parse(data);
    } catch {
      // No hay metadata
    }

    allMetadata = allMetadata.filter(m => m.filename !== filename);
    await fs.writeFile(METADATA_FILE, JSON.stringify(allMetadata, null, 2));

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: error.message });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Image History Server running on http://localhost:${PORT}`);
  console.log(`📁 Images will be saved to: ${IMAGES_DIR}`);
  ensureDirectoryExists();
});