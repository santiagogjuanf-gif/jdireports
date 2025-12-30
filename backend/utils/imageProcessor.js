// ================================================
// PROCESADOR DE IMÁGENES - JD CLEANING SERVICES
// ================================================

const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

// ================================================
// CONFIGURACIÓN
// ================================================

const config = {
  // Directorio base para imágenes
  uploadsDir: path.join(__dirname, '../../uploads'),
  photosDir: path.join(__dirname, '../../uploads/photos'),
  thumbnailsDir: path.join(__dirname, '../../uploads/thumbnails'),
  watermarkPath: path.join(__dirname, '../../assets/watermark.png'),

  // Configuración de imágenes
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 80,
  thumbnailSize: 300,
  watermarkOpacity: 0.3,

  // Formatos permitidos
  allowedFormats: ['jpg', 'jpeg', 'png', 'webp']
};

// ================================================
// INICIALIZAR DIRECTORIOS
// ================================================

const initializeDirectories = async () => {
  try {
    await fs.mkdir(config.uploadsDir, { recursive: true });
    await fs.mkdir(config.photosDir, { recursive: true });
    await fs.mkdir(config.thumbnailsDir, { recursive: true });
    console.log(' Directorios de imágenes inicializados correctamente');
  } catch (error) {
    console.error('L Error al inicializar directorios de imágenes:', error);
    throw error;
  }
};

// ================================================
// GENERAR NOMBRE DE ARCHIVO ÚNICO
// ================================================

const generateUniqueFilename = (originalName) => {
  const ext = path.extname(originalName).toLowerCase();
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  return `${timestamp}-${randomString}${ext}`;
};

// ================================================
// PROCESAR IMAGEN PRINCIPAL
// ================================================

const processImage = async (inputBuffer, options = {}) => {
  try {
    const {
      addWatermark = false,
      maxWidth = config.maxWidth,
      maxHeight = config.maxHeight,
      quality = config.quality
    } = options;

    let image = sharp(inputBuffer);

    // Obtener metadata
    const metadata = await image.metadata();

    // Redimensionar si excede las dimensiones máximas
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      image = image.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Agregar marca de agua si se solicita
    if (addWatermark) {
      try {
        // Verificar si existe el archivo de marca de agua
        await fs.access(config.watermarkPath);

        const watermark = await sharp(config.watermarkPath)
          .resize(Math.floor(maxWidth * 0.3)) // 30% del ancho
          .png()
          .toBuffer();

        image = image.composite([{
          input: watermark,
          gravity: 'southeast',
          blend: 'over'
        }]);
      } catch (error) {
        console.warn('   Marca de agua no disponible:', error.message);
        // Continuar sin marca de agua si el archivo no existe
      }
    }

    // Comprimir y convertir a JPEG
    const processedBuffer = await image
      .jpeg({ quality, progressive: true })
      .toBuffer();

    return processedBuffer;

  } catch (error) {
    console.error('L Error al procesar imagen:', error);
    throw new Error('Error al procesar la imagen');
  }
};

// ================================================
// GENERAR THUMBNAIL
// ================================================

const generateThumbnail = async (inputBuffer, size = config.thumbnailSize) => {
  try {
    const thumbnail = await sharp(inputBuffer)
      .resize(size, size, {
        fit: 'cover',
        position: 'centre'
      })
      .jpeg({ quality: 70 })
      .toBuffer();

    return thumbnail;

  } catch (error) {
    console.error('L Error al generar thumbnail:', error);
    throw new Error('Error al generar thumbnail');
  }
};

// ================================================
// GUARDAR IMAGEN EN DISCO
// ================================================

const saveImage = async (buffer, filename, isThumbnail = false) => {
  try {
    const directory = isThumbnail ? config.thumbnailsDir : config.photosDir;
    const filePath = path.join(directory, filename);

    await fs.writeFile(filePath, buffer);

    return filePath;

  } catch (error) {
    console.error('L Error al guardar imagen:', error);
    throw new Error('Error al guardar la imagen');
  }
};

// ================================================
// ELIMINAR IMAGEN
// ================================================

const deleteImage = async (filename) => {
  try {
    const photoPath = path.join(config.photosDir, filename);
    const thumbnailPath = path.join(config.thumbnailsDir, filename);

    // Eliminar foto principal (sin throw si no existe)
    try {
      await fs.unlink(photoPath);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    // Eliminar thumbnail (sin throw si no existe)
    try {
      await fs.unlink(thumbnailPath);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    return true;

  } catch (error) {
    console.error('L Error al eliminar imagen:', error);
    throw new Error('Error al eliminar la imagen');
  }
};

// ================================================
// PROCESAR Y GUARDAR FOTO COMPLETA
// ================================================

const processAndSavePhoto = async (inputBuffer, originalName, options = {}) => {
  try {
    // Generar nombre único
    const filename = generateUniqueFilename(originalName);

    // Procesar imagen principal
    const processedImage = await processImage(inputBuffer, options);

    // Generar thumbnail
    const thumbnail = await generateThumbnail(processedImage);

    // Guardar ambas versiones
    await saveImage(processedImage, filename, false);
    await saveImage(thumbnail, filename, true);

    return {
      filename,
      photoUrl: `/uploads/photos/${filename}`,
      thumbnailUrl: `/uploads/thumbnails/${filename}`
    };

  } catch (error) {
    console.error('L Error al procesar y guardar foto:', error);
    throw error;
  }
};

// ================================================
// VALIDAR FORMATO DE IMAGEN
// ================================================

const validateImageFormat = (mimetype) => {
  const validMimetypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ];

  return validMimetypes.includes(mimetype.toLowerCase());
};

// ================================================
// VALIDAR TAMAÑO DE IMAGEN
// ================================================

const validateImageSize = (size, maxSizeMB = 10) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return size <= maxSizeBytes;
};

// ================================================
// CREAR MARCA DE AGUA POR DEFECTO
// ================================================

const createDefaultWatermark = async () => {
  try {
    const watermarkDir = path.join(__dirname, '../../assets');
    await fs.mkdir(watermarkDir, { recursive: true });

    // Crear una marca de agua simple con texto
    const watermark = await sharp({
      create: {
        width: 400,
        height: 100,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([{
        input: Buffer.from(`
          <svg width="400" height="100">
            <text
              x="200"
              y="50"
              font-family="Arial"
              font-size="32"
              font-weight="bold"
              fill="white"
              text-anchor="middle"
              opacity="0.5"
            >JD CLEANING</text>
          </svg>
        `),
        top: 0,
        left: 0
      }])
      .png()
      .toFile(config.watermarkPath);

    console.log(' Marca de agua por defecto creada');
    return true;

  } catch (error) {
    console.error('L Error al crear marca de agua por defecto:', error);
    return false;
  }
};

// ================================================
// EXPORTAR FUNCIONES
// ================================================

module.exports = {
  initializeDirectories,
  processImage,
  generateThumbnail,
  saveImage,
  deleteImage,
  processAndSavePhoto,
  validateImageFormat,
  validateImageSize,
  generateUniqueFilename,
  createDefaultWatermark,
  config
};
