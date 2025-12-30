// ================================================
// SERVIDOR PRINCIPAL - JD CLEANING SERVICES
// ================================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Importar configuraciones y middlewares
const db = require('./backend/config/database');
const { authenticateToken } = require('./backend/middleware/auth');
const { logger } = require('./backend/middleware/logger');
const { errorHandler } = require('./backend/middleware/errorHandler');

// ================================================
// RUTAS COMENTADAS TEMPORALMENTE
// ================================================
  const authRoutes = require('./backend/routes/auth');
  const userRoutes = require('./backend/routes/users');
  const orderRoutes = require('./backend/routes/orders');
// const uploadRoutes = require('./backend/routes/uploads');
// const notificationRoutes = require('./backend/routes/notifications');
// const reportRoutes = require('./backend/routes/reports');

// Crear aplicación Express
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// ================================================
// CONFIGURACIÓN DE MIDDLEWARES
// ================================================

// Seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));

// Compresión
app.use(compression());

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana por IP
  message: {
    error: 'Demasiadas peticiones desde esta IP, intente nuevamente en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos de login por IP
  message: {
    error: 'Demasiados intentos de login, intente nuevamente en 15 minutos.'
  }
});

app.use(limiter);

// Parsing de body
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logger personalizado
app.use(logger);

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ================================================
// CONFIGURACIÓN DE SOCKET.IO
// ================================================
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log(`Usuario conectado: ${socket.id}`);
  
  // Autenticar usuario para notificaciones
  socket.on('authenticate', (token) => {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      connectedUsers.set(socket.id, decoded.userId);
      socket.join(`user_${decoded.userId}`);
      console.log(`Usuario ${decoded.userId} autenticado para notificaciones`);
    } catch (error) {
      console.log('Error de autenticación en socket:', error.message);
    }
  });
  
  socket.on('disconnect', () => {
    connectedUsers.delete(socket.id);
    console.log(`Usuario desconectado: ${socket.id}`);
  });
});

// Hacer io disponible globalmente
app.set('io', io);

// ================================================
// RUTAS BÁSICAS (SIN IMPORTAR ARCHIVOS AÚN)
// ================================================

// Ruta de salud del servidor
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'JD Cleaning Services API',
    version: '1.0.0',
    message: 'Servidor funcionando correctamente'
  });
});

// Ruta para obtener configuración del sistema
app.get('/api/config', (req, res) => {
  res.json({
    companyName: 'JD Cleaning Services',
    maxPhotosPerOrder: 30,
    supportedLanguages: ['es', 'en', 'fr'],
    version: '1.0.0'
  });
});

// Ruta de prueba de base de datos
app.get('/api/test-db', async (req, res) => {
  try {
    const stats = await db.getStats();
    res.json({
      status: 'OK',
      message: 'Conexión a base de datos exitosa',
      stats
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Error de conexión a base de datos',
      error: error.message
    });
  }
});

// ================================================
// RUTAS DE LA API - COMENTADAS TEMPORALMENTE
// ================================================
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/orders', authenticateToken, orderRoutes);
// app.use('/api/uploads', authenticateToken, uploadRoutes);
// app.use('/api/notifications', authenticateToken, notificationRoutes);
// app.use('/api/reports', authenticateToken, reportRoutes);

// ================================================
// MANEJO DE ERRORES Y RUTAS NO ENCONTRADAS
// ================================================

// Middleware para rutas no encontradas
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    message: `La ruta ${req.originalUrl} no existe en esta API`,
    availableRoutes: [
      'GET /api/health',
      'GET /api/config', 
      'GET /api/test-db'
    ]
  });
});

// Servir página de bienvenida para ruta raíz
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>JD Cleaning Services API</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            max-width: 800px; 
            margin: 50px auto; 
            padding: 20px;
            background: linear-gradient(135deg, #1E88E5, #43A047);
            color: white;
            text-align: center;
          }
          .container {
            background: rgba(255,255,255,0.1);
            padding: 30px;
            border-radius: 10px;
          }
          h1 { color: #fff; margin-bottom: 30px; }
          .api-link {
            display: inline-block;
            margin: 10px;
            padding: 10px 20px;
            background: rgba(255,255,255,0.2);
            text-decoration: none;
            color: white;
            border-radius: 5px;
            border: 1px solid rgba(255,255,255,0.3);
          }
          .api-link:hover {
            background: rgba(255,255,255,0.3);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🧽 JD Cleaning Services API</h1>
          <p>¡Servidor funcionando correctamente!</p>
          <h3>Rutas disponibles:</h3>
          <a href="/api/health" class="api-link">🏥 Health Check</a>
          <a href="/api/config" class="api-link">⚙️ Configuración</a>
          <a href="/api/test-db" class="api-link">🗄️ Test Database</a>
          <p style="margin-top: 30px;">
            <small>Version 1.0.0 | Puerto: ${process.env.PORT || 5000}</small>
          </p>
        </div>
      </body>
    </html>
  `);
});

// Middleware de manejo de errores
app.use(errorHandler);

// ================================================
// FUNCIONES UTILITARIAS
// ================================================

// Función para enviar notificaciones en tiempo real
const sendNotification = (userId, notification) => {
  io.to(`user_${userId}`).emit('notification', notification);
};

// Función para broadcast a todos los usuarios de un rol
const broadcastToRole = (role, message) => {
  io.emit('roleNotification', { role, message });
};

// Hacer funciones disponibles globalmente
app.set('sendNotification', sendNotification);
app.set('broadcastToRole', broadcastToRole);

// ================================================
// INICIALIZACIÓN DEL SERVIDOR
// ================================================

const PORT = process.env.PORT || 5000;

// Verificar conexión a la base de datos antes de iniciar
const startServer = async () => {
  try {
    // Probar conexión a la base de datos
    await db.testConnection();
    
    // Iniciar el servidor
    server.listen(PORT, () => {
      console.log('🚀 =======================================');
      console.log(`🧽 JD CLEANING SERVICES - SERVIDOR INICIADO`);
      console.log(`🌐 Puerto: ${PORT}`);
      console.log(`📅 Fecha: ${new Date().toLocaleString()}`);
      console.log(`🔗 URL: http://localhost:${PORT}`);
      console.log(`📡 API: http://localhost:${PORT}/api`);
      console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
      console.log(`🗄️  Test DB: http://localhost:${PORT}/api/test-db`);
      console.log('🚀 =======================================');
    });
    
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error);
    console.error('💡 Verifica que XAMPP esté corriendo y la configuración en .env');
    process.exit(1);
  }
};

// Manejar cierre graceful del servidor
process.on('SIGTERM', () => {
  console.log('🔄 Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

// Iniciar servidor
startServer();

module.exports = app;