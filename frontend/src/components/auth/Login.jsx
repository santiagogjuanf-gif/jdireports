import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { EyeIcon, EyeSlashIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

// Componente selector de idioma
const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('language', langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-200"
      >
        <GlobeAltIcon className="h-4 w-4" />
        <span className="text-sm font-medium">{currentLanguage.flag} {currentLanguage.name}</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50"
          >
            {languages.map((language) => (
              <motion.button
                key={language.code}
                whileHover={{ backgroundColor: '#f3f4f6' }}
                onClick={() => handleLanguageChange(language.code)}
                className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition-colors duration-150"
              >
                <span className="text-lg">{language.flag}</span>
                <span className="font-medium">{language.name}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Componente principal de Login
const Login = () => {
  const { t } = useTranslation();
  const { login, isLoading, error, clearError } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Limpiar errores cuando el componente se monta
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Validación del formulario
  const validateForm = () => {
    const errors = {};
    
    if (!formData.email) {
      errors.email = t('auth.requiredEmail');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = t('auth.invalidEmail');
    }
    
    if (!formData.password) {
      errors.password = t('auth.requiredPassword');
    } else if (formData.password.length < 6) {
      errors.password = t('auth.passwordMinLength');
    }
    
    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error específico cuando el usuario empiece a escribir
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar formulario
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setValidationErrors({});
    
    // Intentar login
    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      toast.success(t('auth.loginSuccess', { name: result.user.name }));
      // La redirección se manejará en App.js basado en el estado de autenticación
    } else {
      toast.error(result.error || t('auth.loginError'));
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo - Información de la empresa */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex lg:w-1/2 gradient-primary relative overflow-hidden"
      >
        {/* Patrón de fondo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 rounded-full bg-white/20"></div>
          <div className="absolute top-40 right-32 w-20 h-20 rounded-full bg-white/10"></div>
          <div className="absolute bottom-32 left-32 w-24 h-24 rounded-full bg-white/15"></div>
          <div className="absolute bottom-20 right-20 w-16 h-16 rounded-full bg-white/20"></div>
        </div>

        {/* Contenido */}
        <div className="relative z-10 flex flex-col justify-center px-12 py-20">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                <span className="text-primary-500 font-bold text-xl">JD</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">JD Cleaning Services</h1>
                <p className="text-white/80 text-sm">{t('auth.welcome')}</p>
              </div>
            </div>
          </motion.div>

          {/* Características */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="space-y-6"
          >
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
          </motion.div>

          {/* Estadísticas */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="mt-12 grid grid-cols-3 gap-6"
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-white">99%</div>
              <div className="text-white/80 text-xs">Satisfacción</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">24/7</div>
              <div className="text-white/80 text-xs">Disponibilidad</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">5★</div>
              <div className="text-white/80 text-xs">Calificación</div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Panel derecho - Formulario de login */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        {/* Selector de idioma */}
        <div className="absolute top-6 right-6">
          <LanguageSelector />
        </div>

        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="mx-auto w-full max-w-sm"
        >
          {/* Header del formulario */}
          <div className="text-center mb-8">
            <motion.h2
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-3xl font-bold text-gray-900"
            >
              {t('auth.login')}
            </motion.h2>
            <motion.p
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-2 text-sm text-gray-600"
            >
              {t('auth.loginSubtitle')}
            </motion.p>
          </div>

          {/* Formulario */}
          <motion.form
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Campo Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                className={`input-field ${validationErrors.email ? 'input-error' : ''}`}
                placeholder="tu@email.com"
              />
              {validationErrors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-600"
                >
                  {validationErrors.email}
                </motion.p>
              )}
            </div>

            {/* Campo Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`input-field pr-10 ${validationErrors.password ? 'input-error' : ''}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-600"
                >
                  {validationErrors.password}
                </motion.p>
              )}
            </div>

            {/* Remember me y Forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  {t('auth.rememberMe')}
                </label>
              </div>
              <div className="text-sm">
                <button
                  type="button"
                  className="font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200"
                >
                  {t('auth.forgotPassword')}
                </button>
              </div>
            </div>

            {/* Error global */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="rounded-lg bg-red-50 p-4 border border-red-200"
                >
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        {error}
                      </h3>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Botón de login */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="loading-dots">
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                  <span className="ml-3">{t('common.loading')}</span>
                </div>
              ) : (
                t('auth.loginButton')
              )}
            </motion.button>
          </motion.form>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="mt-8 text-center"
          >
            <p className="text-xs text-gray-500">
              © 2025 JD Cleaning Services. Todos los derechos reservados.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;