# Sistema de Historial de Imágenes

Este proyecto ahora incluye un sistema completo de historial de imágenes generadas con un backend Express.

## Características

- **Panel lateral de historial**: Muestra todas las imágenes generadas en un panel a la izquierda del chat
- **Persistencia**: Las imágenes se guardan en la carpeta `/generated-images/` con metadata
- **Títulos editables**: Cada imagen tiene un título generado automáticamente del prompt (primeras 5 palabras) que puede editarse
- **Dos modos de vista**:
  - Vista de miniaturas (default): Solo muestra las imágenes pequeñas
  - Vista detallada: Muestra miniaturas + título + fecha de creación
- **Formato de archivo**: `YYYY-MM-DD_HH-MM-SS_titulo.png`
- **Eliminación**: Puedes eliminar imágenes del historial

## Estructura de Archivos

```
generated-images/
├── 2025-02-02_14-30-45_robot_futurista.png
├── 2025-02-02_14-35-12_paisaje_montana.png
└── metadata.json
```

## Cómo Iniciar

### Desarrollo (Frontend + Backend)

```bash
npm run dev
```

Esto ejecutará:
- Backend Express en http://localhost:3001
- Frontend Vite en http://localhost:3000

### Solo Backend

```bash
npm run server
```

### Solo Frontend

```bash
vite
```

## Endpoints del Backend

- `POST /api/save-image` - Guardar nueva imagen
- `GET /api/images` - Listar todas las imágenes
- `GET /api/images/:filename` - Obtener imagen específica
- `PUT /api/images/:filename` - Actualizar título
- `DELETE /api/images/:filename` - Eliminar imagen

## Uso

1. Genera una imagen usando el modo de generación de imágenes
2. La imagen se guarda automáticamente en el historial
3. Aparece en el panel lateral izquierdo
4. Puedes:
   - Cambiar entre vista de miniaturas y vista detallada
   - Editar el título haciendo clic en el ícono de lápiz
   - Eliminar imágenes con el ícono de basura
   - Ver la fecha de creación en formato: año, mes, día, hora, minutos

## Notas

- Las imágenes se guardan automáticamente cuando se generan exitosamente
- El título inicial se genera a partir de las primeras 5 palabras del prompt
- El panel se actualiza automáticamente cada 5 segundos
- Las imágenes se almacenan localmente en tu proyecto