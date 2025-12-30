import React, { useState, useEffect } from 'react';
import './index.css';
import { useAuthStore } from './store/authStore';

// Componente de Login
const Login = () => {
  const { login, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success) {
      // El cambio de estado manejará la navegación automáticamente
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo */}
      <div className="hidden lg:flex lg:w-1/2" style={{background: 'linear-gradient(135deg, #1e88e5 0%, #43a047 100%)'}}>
        <div className="flex flex-col justify-center px-12 py-20 text-white">
          <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mx-auto mb-8">
            <span className="text-blue-500 font-bold text-2xl">JD</span>
          </div>
          <h1 className="text-3xl font-bold mb-4 text-center">JD Cleaning Services</h1>
          <p className="text-lg opacity-90 text-center">Sistema de gestión profesional para servicios de limpieza</p>
          
          <div className="mt-12 space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mt-1">
                <span className="text-white text-sm">✓</span>
              </div>
              <div>
                <h3 className="text-white font-semibold">Gestión Completa</h3>
                <p className="text-white/80 text-sm">Sistema integral para órdenes, trabajadores y reportes</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mt-1">
                <span className="text-white text-sm">✓</span>
              </div>
              <div>
                <h3 className="text-white font-semibold">Tiempo Real</h3>
                <p className="text-white/80 text-sm">Seguimiento en vivo del progreso de trabajos</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mt-1">
                <span className="text-white text-sm">✓</span>
              </div>
              <div>
                <h3 className="text-white font-semibold">Multiplataforma</h3>
                <p className="text-white/80 text-sm">Acceso desde escritorio y dispositivos móviles</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho - Login */}
      <div className="flex-1 flex flex-col justify-center py-12 px-8">
        <div className="w-full max-w-sm mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Iniciar Sesión</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="tu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 text-base"
            >
              {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              © 2025 JD Cleaning Services. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard moderno
const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  //const [stats, setStats] = useState({
    //totalOrders: 28,
    //completedToday: 12,
    //pendingOrders: 8,
    //activeWorkers: 15
  //});
  const stats = {
  totalOrders: 28,
  completedToday: 12,
  pendingOrders: 8,
  activeWorkers: 15
};

  // Actualizar reloj en tiempo real
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const recentActivities = [
    { id: 1, action: 'Orden #1024 completada', user: 'Juan Pérez', time: '10:30 AM', type: 'success' },
    { id: 2, action: 'Nueva orden creada', user: 'María García', time: '09:45 AM', type: 'info' },
    { id: 3, action: 'Trabajador Carlos asignado', user: 'Admin', time: '09:20 AM', type: 'assign' },
    { id: 4, action: 'Orden #1023 iniciada', user: 'Ana López', time: '08:30 AM', type: 'start' }
  ];

  const quickActions = [
    { name: 'Nueva Orden', icon: '📋', color: 'from-blue-500 to-blue-600', action: () => alert('Crear nueva orden') },
    { name: 'Gestionar Usuarios', icon: '👥', color: 'from-green-500 to-green-600', action: () => alert('Gestionar usuarios') },
    { name: 'Ver Reportes', icon: '📊', color: 'from-purple-500 to-purple-600', action: () => alert('Ver reportes') },
    { name: 'Configuración', icon: '⚙️', color: 'from-gray-500 to-gray-600', action: () => alert('Configuración') }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-soft border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo y nombre */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">JD</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">JD Cleaning Services</h1>
                <p className="text-sm text-gray-500">Sistema de Gestión</p>
              </div>
            </div>

            {/* Información del usuario */}
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <button
                onClick={logout}
                className="btn-logout"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Saludo y fecha */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl p-6 text-white relative overflow-hidden">
            {/* Patrón de fondo */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full"></div>
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-white opacity-5 rounded-full"></div>
            
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-2">
                {getGreeting()}, {user?.name}
              </h2>
              <p className="text-blue-100 mb-4 capitalize">
                {formatDate(currentTime)}
              </p>
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 rounded-lg px-4 py-2">
                  <span className="text-lg font-mono">{formatTime(currentTime)}</span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm text-blue-100">
                    Tienes acceso como <span className="font-semibold capitalize">{user?.role}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="stat-card">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-xl">📋</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Órdenes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completadas Hoy</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedToday}</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600 text-xl">⏳</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Trabajadores Activos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeWorkers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Grid de contenido */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Acciones rápidas */}
          <div className="lg:col-span-1">
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h3>
              </div>
              <div className="p-6 space-y-3">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className="quick-action-btn"
                  >
                    <div className={`w-10 h-10 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center`}>
                      <span className="text-white text-lg">{action.icon}</span>
                    </div>
                    <span className="font-medium text-gray-700">{action.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Actividad reciente */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
                <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  Ver todo
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="activity-item">
                      <div className={`activity-icon ${activity.type}`}>
                        {activity.type === 'success' && '✓'}
                        {activity.type === 'info' && '+'}
                        {activity.type === 'assign' && '→'}
                        {activity.type === 'start' && '▶'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                        <p className="text-xs text-gray-500">por {activity.user}</p>
                      </div>
                      <span className="text-xs text-gray-400">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Componente principal de la aplicación
function App() {
  const { isAuthenticated } = useAuthStore();
  
  return isAuthenticated ? <Dashboard /> : <Login />;
}

export default App;