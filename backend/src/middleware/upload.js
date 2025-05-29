const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Configuração do diretório de uploads
const uploadDir = process.env.UPLOAD_DIR || './uploads';
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB
const allowedExtensions = (process.env.ALLOWED_EXTENSIONS || 'jpg,jpeg,png,webp').split(',');

// Criar diretórios se não existirem
const createUploadDirs = () => {
  const dirs = [
    uploadDir,
    path.join(uploadDir, 'products'),
    path.join(uploadDir, 'products', 'thumbnails'),
    path.join(uploadDir, 'temp')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// Configuração do storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(uploadDir, 'temp'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Filtro de arquivos
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Apenas arquivos ${allowedExtensions.join(', ')} são permitidos`), false);
  }
};

// Configuração do multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxFileSize,
    files: 10 // Máximo 10 arquivos por vez
  }
});

// Middleware para processar imagens
const processImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    const processedFiles = [];

    for (const file of req.files) {
      try {
        const filename = `${uuidv4()}-${Date.now()}`;
        const originalPath = path.join(uploadDir, 'products', `${filename}.webp`);
        const thumbnailPath = path.join(uploadDir, 'products', 'thumbnails', `${filename}-thumb.webp`);

        // Processar imagem original (redimensionar se muito grande)
        await sharp(file.path)
          .resize(1200, 1200, { 
            fit: 'inside',
            withoutEnlargement: true 
          })
          .webp({ quality: 85 })
          .toFile(originalPath);

        // Criar thumbnail
        await sharp(file.path)
          .resize(300, 300, { 
            fit: 'cover' 
          })
          .webp({ quality: 80 })
          .toFile(thumbnailPath);

        // Remover arquivo temporário
        fs.unlinkSync(file.path);

        // Informações do arquivo processado
        const fileStats = fs.statSync(originalPath);
        
        processedFiles.push({
          original: {
            file_name: `${filename}.webp`,
            file_path: `products/${filename}.webp`,
            full_path: originalPath,
            file_size: fileStats.size,
            mime_type: 'image/webp'
          },
          thumbnail: {
            file_name: `${filename}-thumb.webp`,
            file_path: `products/thumbnails/${filename}-thumb.webp`,
            full_path: thumbnailPath,
            file_size: fs.statSync(thumbnailPath).size,
            mime_type: 'image/webp'
          },
          original_name: file.originalname,
          original_size: file.size
        });

      } catch (imageError) {
        console.error('Erro ao processar imagem:', imageError);
        
        // Remover arquivo temporário em caso de erro
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        
        throw new Error(`Erro ao processar ${file.originalname}: ${imageError.message}`);
      }
    }

    req.processedFiles = processedFiles;
    next();

  } catch (error) {
    console.error('Erro no processamento de imagens:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erro ao processar imagens'
    });
  }
};

// Middleware para deletar imagens
const deleteImages = (filePaths) => {
  return new Promise((resolve) => {
    if (!Array.isArray(filePaths)) {
      filePaths = [filePaths];
    }

    let deletedCount = 0;

    filePaths.forEach(filePath => {
      try {
        const fullPath = path.join(uploadDir, filePath);
        
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          deletedCount++;
        }

        // Tentar deletar thumbnail correspondente
        if (filePath.includes('products/') && !filePath.includes('thumbnails/')) {
          const thumbnailPath = filePath.replace('products/', 'products/thumbnails/').replace('.webp', '-thumb.webp');
          const fullThumbnailPath = path.join(uploadDir, thumbnailPath);
          
          if (fs.existsSync(fullThumbnailPath)) {
            fs.unlinkSync(fullThumbnailPath);
          }
        }

      } catch (error) {
        console.error(`Erro ao deletar ${filePath}:`, error);
      }
    });

    resolve(deletedCount);
  });
};

// Middleware para servir imagens estáticas
const serveImage = (req, res) => {
  try {
    const imagePath = req.params[0]; // Captura todo o caminho após /images/
    const fullPath = path.join(uploadDir, imagePath);

    // Verificar se o arquivo existe
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        success: false,
        message: 'Imagem não encontrada'
      });
    }

    // Verificar se é uma extensão permitida
    const ext = path.extname(fullPath).toLowerCase().slice(1);
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de arquivo não suportado'
      });
    }

    // Definir content type
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp'
    };

    res.setHeader('Content-Type', mimeTypes[ext]);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache por 1 ano
    
    // Enviar arquivo
    res.sendFile(path.resolve(fullPath));

  } catch (error) {
    console.error('Erro ao servir imagem:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  upload,
  processImages,
  deleteImages,
  serveImage
}; 