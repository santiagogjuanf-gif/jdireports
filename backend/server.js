// ================================================
// SERVIDOR PRINCIPAL - JD CLEANING SERVICES
// ================================================

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

// Importar middleware
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');
const rateLimiter = require('./middleware/rateLimiter');

// Importar rutas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const orderRoutes = require('./routes/orders');
const dailyReportRoutes = require('./routes/daily-reports');
const areaRoutes = require('./routes/cleaning-areas');
const photoRoutes = require('./routes/photos');
const materialRoutes = require('./routes/materials');
const motivationalMessagesRoutes = require('./routes/motivational-messages');
const tutorialRoutes = require('./routes/tutorials');
const chatRoutes = require('./routes/chat');

// Importar handlers de Socket.IO
const { initializeChatHandler } = require('./sockets/chatHandler');

// ================================================
// CONFIGURACIÓN
// ================================================

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ================================================
// CREAR APLICACIÓN EXPRESS
// ================================================

const app = express();
const server = http.createServer(app);

// ================================================
// CONFIGURAR SOCKET.IO
// ================================================

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Inicializar chat handler
initializeChatHandler(io);

// Hacer io disponible en las rutas
app.set('io', io);

// ================================================
// MIDDLEWARE GLOBAL
// ================================================

// Seguridad
app.use(helmet({
  contentSecurityPolicy: false, // Desactivar para desarrollo
  crossOriginEmbedderPolicy: false
}));

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Compresión
app.use(compression());

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logger de requests
if (NODE_ENV !== 'test') {
  app.use(requestLogger);
}

// Rate limiting (solo en producción)
if (NODE_ENV === 'production') {
  app.use('/api/', rateLimiter);
}

// ================================================
// SERVIR ARCHIVOS ESTÁTICOS
// ================================================

// Servir uploads (fotos, PDFs, etc.)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Servir assets
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend/public')));

// ================================================
// RUTAS DE API
// ================================================

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/daily-reports', dailyReportRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api', photoRoutes); // Incluye /api/orders/:orderId/photos y /api/photos/:photoId
app.use('/api/materials', materialRoutes);
app.use('/api/motivational-messages', motivationalMessagesRoutes);
app.use('/api/tutorials', tutorialRoutes);
app.use('/api/chat', chatRoutes);

// ================================================
// RUTA DE HEALTH CHECK
// ================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// ================================================
// RUTA DE API INFO
// ================================================

app.get('/api', (req, res) => {
  res.json({
    name: 'JD Cleaning Services API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      api: '/api',
      docs: '/api/docs' // Para futuro
    }
  });
});

// ================================================
// MANEJO DE RUTAS DE API NO ENCONTRADAS
// ================================================

app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'No encontrado',
    message: 'La ruta de API solicitada no existe',
    path: req.originalUrl
  });
});

// ================================================
// SPA FALLBACK - Servir index.html para rutas no-API
// ================================================

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

// ================================================
// MIDDLEWARE DE MANEJO DE ERRORES
// ================================================

app.use(errorHandler);

// ================================================
// INICIAR SERVIDOR
// ================================================

const startServer = async () => {
  try {
    // Verificar conexión a base de datos
    const db = require('./config/database');
    await db.testConnection();

    // Inicializar directorios necesarios
    const { initializeDirectories } = require('./utils/imageProcessor');
    const { initializeReportsDirectory } = require('./utils/pdfGenerator');
    const { createDefaultWatermark } = require('./utils/imageProcessor');

    await initializeDirectories();
    await initializeReportsDirectory();
    await createDefaultWatermark();

    // Iniciar servidor HTTP + Socket.IO
    server.listen(PORT, '0.0.0.0', () => {
      console.log('\n================================================');
      console.log('  JD CLEANING SERVICES - SERVIDOR INICIADO');
      console.log('================================================\n');
      console.log(`✅ Servidor corriendo en puerto ${PORT}`);
      console.log(`✅ Entorno: ${NODE_ENV}`);
      console.log(`✅ URL: http://localhost:${PORT}`);
      console.log(`✅ Socket.IO habilitado para chat en tiempo real`);
      console.log('\n================================================\n');
    });

  } catch (error) {
    console.error('❌ Error al iniciar servidor:', error);
    process.exit(1);
  }
};

// ================================================
// MANEJO DE ERRORES NO CAPTURADOS
// ================================================

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// ================================================
// MANEJO DE SEÑALES DE TERMINACIÓN
// ================================================

const gracefulShutdown = () => {
  console.log('\n⚠️  Cerrando servidor...');

  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });

  // Forzar cierre después de 10 segundos
  setTimeout(() => {
    console.error('❌ No se pudo cerrar el servidor correctamente, forzando cierre');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// ================================================
// INICIAR
// ================================================

if (require.main === module) {
  startServer();
}

// ================================================
// EXPORTAR PARA TESTING
// ================================================

module.exports = { app, server, io };
