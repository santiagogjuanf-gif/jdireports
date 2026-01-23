// ================================================
// JDI CLEANING SERVICES - MAIN JAVASCRIPT
// ================================================

document.addEventListener('DOMContentLoaded', function() {
  // Inicializar animaciones
  initAnimations();

  // Inicializar contadores
  initCounters();

  // Inicializar efectos de hover
  initHoverEffects();

  // Inicializar tooltips
  initTooltips();

  // Inicializar notificaciones
  initNotifications();
});

// ================================================
// ANIMACIONES AL SCROLL
// ================================================

function initAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');

        // Si es un contador, iniciarlo
        if (entry.target.classList.contains('count-up')) {
          animateCounter(entry.target);
        }
      }
    });
  }, observerOptions);

  // Observar elementos con animación
  document.querySelectorAll('.slide-up, .fade-in, .scale-in').forEach(el => {
    observer.observe(el);
  });
}

// ================================================
// CONTADOR ANIMADO
// ================================================

function initCounters() {
  const counters = document.querySelectorAll('.count-up');

  counters.forEach(counter => {
    counter.textContent = '0';
  });
}

function animateCounter(element) {
  const target = parseInt(element.getAttribute('data-target'));
  const duration = 2000; // 2 segundos
  const increment = target / (duration / 16); // 60 FPS
  let current = 0;

  const timer = setInterval(() => {
    current += increment;

    if (current >= target) {
      element.textContent = target;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current);
    }
  }, 16);
}

// ================================================
// EFECTOS DE HOVER
// ================================================

function initHoverEffects() {
  // Efecto ripple en botones
  document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      ripple.classList.add('ripple-effect');

      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';

      this.appendChild(ripple);

      setTimeout(() => ripple.remove(), 600);
    });
  });

  // Efecto parallax en hero
  document.addEventListener('mousemove', function(e) {
    const floatingCards = document.querySelectorAll('.floating-card');
    const mouseX = e.clientX / window.innerWidth;
    const mouseY = e.clientY / window.innerHeight;

    floatingCards.forEach((card, index) => {
      const depth = (index + 1) * 20;
      const moveX = (mouseX - 0.5) * depth;
      const moveY = (mouseY - 0.5) * depth;

      card.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });
  });
}

// ================================================
// TOOLTIPS
// ================================================

function initTooltips() {
  const tooltipTriggers = document.querySelectorAll('[data-tooltip]');

  tooltipTriggers.forEach(trigger => {
    trigger.addEventListener('mouseenter', function(e) {
      const tooltipText = this.getAttribute('data-tooltip');
      const tooltip = createTooltip(tooltipText);

      document.body.appendChild(tooltip);

      const rect = this.getBoundingClientRect();
      tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
      tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';

      setTimeout(() => tooltip.classList.add('show'), 10);

      this._tooltip = tooltip;
    });

    trigger.addEventListener('mouseleave', function() {
      if (this._tooltip) {
        this._tooltip.classList.remove('show');
        setTimeout(() => this._tooltip.remove(), 200);
      }
    });
  });
}

function createTooltip(text) {
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  tooltip.textContent = text;
  return tooltip;
}

// ================================================
// NOTIFICACIONES
// ================================================

function initNotifications() {
  // Simulación de notificaciones en tiempo real
  setTimeout(() => {
    showNotification('Nueva orden asignada', 'success');
  }, 3000);

  setTimeout(() => {
    showNotification('Recordatorio: Revisión pendiente', 'warning');
  }, 6000);
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type} notification-slide-in`;

  const icon = getNotificationIcon(type);

  notification.innerHTML = `
    <i class="${icon}"></i>
    <span>${message}</span>
    <button class="notification-close">
      <i class="fas fa-times"></i>
    </button>
  `;

  document.body.appendChild(notification);

  // Cerrar al hacer click
  notification.querySelector('.notification-close').addEventListener('click', () => {
    closeNotification(notification);
  });

  // Auto cerrar después de 5 segundos
  setTimeout(() => {
    closeNotification(notification);
  }, 5000);
}

function closeNotification(notification) {
  notification.style.animation = 'notificationSlideOut 0.3s ease-out forwards';
  setTimeout(() => notification.remove(), 300);
}

function getNotificationIcon(type) {
  const icons = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    warning: 'fas fa-exclamation-triangle',
    info: 'fas fa-info-circle'
  };
  return icons[type] || icons.info;
}

// ================================================
// MANEJO DE NAVEGACIÓN
// ================================================

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();

    // Remover clase activa de todos
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

    // Agregar clase activa al clickeado
    this.classList.add('active');

    // Smooth scroll a la sección
    const target = this.getAttribute('href');
    if (target.startsWith('#')) {
      const section = document.querySelector(target);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
});

// ================================================
// PROGRESS BARS
// ================================================

function animateProgressBars() {
  const progressBars = document.querySelectorAll('.progress-fill');

  progressBars.forEach(bar => {
    const width = bar.style.width;
    bar.style.width = '0';

    setTimeout(() => {
      bar.style.width = width;
    }, 100);
  });
}

// Animar progress bars cuando sean visibles
const progressObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateProgressBars();
      progressObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.order-progress').forEach(progress => {
  progressObserver.observe(progress);
});

// ================================================
// FLOATING CHAT BUTTON
// ================================================

document.querySelector('.floating-chat-btn')?.addEventListener('click', function() {
  // Aquí se abriría el modal de chat
  showNotification('Abriendo chat...', 'info');

  // Animación de click
  this.style.transform = 'scale(0.9)';
  setTimeout(() => {
    this.style.transform = 'scale(1)';
  }, 100);
});

// ================================================
// SEARCH FUNCTIONALITY
// ================================================

function initSearch() {
  const searchInput = document.querySelector('.search-input');

  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      const searchTerm = e.target.value.toLowerCase();
      const orders = document.querySelectorAll('.order-card');

      orders.forEach(order => {
        const client = order.querySelector('.order-client').textContent.toLowerCase();
        const number = order.querySelector('.order-number').textContent.toLowerCase();

        if (client.includes(searchTerm) || number.includes(searchTerm)) {
          order.style.display = '';
          order.classList.add('fade-in');
        } else {
          order.style.display = 'none';
        }
      });
    });
  }
}

// ================================================
// THEME TOGGLE (FUTURO)
// ================================================

function toggleTheme() {
  document.body.classList.toggle('dark-theme');
  localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
}

// Cargar tema guardado
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.body.classList.add('dark-theme');
}

// ================================================
// UTILITY FUNCTIONS
// ================================================

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// ================================================
// PERFORMANCE OPTIMIZATION
// ================================================

// Lazy load images
if ('IntersectionObserver' in window) {
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove('lazy');
        imageObserver.unobserve(img);
      }
    });
  });

  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
}

// ================================================
// ERROR HANDLING
// ================================================

window.addEventListener('error', function(e) {
  console.error('Error:', e.error);
  // Aquí podrías enviar el error a un servicio de logging
});

// ================================================
// CONSOLE STYLING (DEV)
// ================================================

console.log(
  '%c🧹 JDI Cleaning Services %c- Sistema de Gestión',
  'color: #0099CC; font-size: 20px; font-weight: bold;',
  'color: #00A651; font-size: 16px;'
);

console.log(
  '%cVersión: 1.0.0',
  'color: #666; font-size: 12px;'
);

// ================================================
// FUNCIONALIDAD DE BOTONES DEL DASHBOARD
// ================================================

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  console.log('🔧 [MAIN] Inicializando funcionalidad de botones...');

  // BOTONES DEL HERO
  const btnNuevaOrden = document.querySelector('.hero-actions .btn-primary');
  const btnVerCalendario = document.querySelector('.hero-actions .btn-secondary');

  if (btnNuevaOrden) {
    console.log('✅ [MAIN] Botón "Nueva Orden" encontrado');
    btnNuevaOrden.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('🔘 [MAIN] Click en "Nueva Orden" - Redirigiendo...');
      window.location.href = '/nueva-orden.html';
    });
  } else {
    console.warn('⚠️ [MAIN] Botón "Nueva Orden" NO encontrado');
  }

  if (btnVerCalendario) {
    console.log('✅ [MAIN] Botón "Ver Calendario" encontrado');
    btnVerCalendario.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('🔘 [MAIN] Click en "Ver Calendario"');
      alert('Funcionalidad: Ver Calendario\n\nEsta función mostrará el calendario de órdenes programadas.\n\n(En desarrollo)');
    });
  } else {
    console.warn('⚠️ [MAIN] Botón "Ver Calendario" NO encontrado');
  }

  // BOTONES DE ACCIONES RÁPIDAS
  const actionCards = document.querySelectorAll('.action-card');
  console.log(`🔍 [MAIN] Se encontraron ${actionCards.length} tarjetas de acción`);

  actionCards.forEach((card, index) => {
    const title = card.querySelector('h3')?.textContent || 'Acción ' + (index + 1);
    console.log(`✅ [MAIN] Registrando event listener para: "${title}"`);

    card.addEventListener('click', function(e) {
      e.preventDefault();
      console.log(`🔘 [MAIN] Click en tarjeta: "${title}"`);

      // Redirigir según la acción
      const redirects = {
        'Nueva Orden': '/nueva-orden.html',
        'Nuevo Trabajador': '/nuevo-trabajador.html',
        'Generar Reporte': null,  // Pendiente
        'Solicitar Material': null // Pendiente
      };

      if (redirects[title]) {
        window.location.href = redirects[title];
      } else {
        const actions = {
          'Generar Reporte': 'generará y descargará un reporte en formato PDF',
          'Solicitar Material': 'abrirá el formulario para solicitar material del inventario'
        };
        const description = actions[title] || 'ejecutará la funcionalidad correspondiente';
        alert(`Funcionalidad: ${title}\n\nEsta función ${description}.\n\n(En desarrollo)`);
        showNotification(`${title} - En desarrollo`, 'info');
      }
    });
  });

  // BOTÓN DE LOGOUT EN EL MENÚ DE USUARIO
  const userAvatar = document.querySelector('.user-avatar');
  if (userAvatar) {
    console.log('✅ [MAIN] Avatar de usuario encontrado');
    userAvatar.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('🔘 [MAIN] Click en avatar de usuario');

      // Mostrar menú contextual
      const shouldLogout = confirm('¿Deseas cerrar sesión?');
      if (shouldLogout) {
        console.log('🚪 [MAIN] Usuario confirma logout');
        if (window.auth && typeof window.auth.logout === 'function') {
          window.auth.logout();
        } else {
          console.error('❌ [MAIN] Función logout no disponible');
          window.location.href = '/login.html';
        }
      }
    });
  } else {
    console.warn('⚠️ [MAIN] Avatar de usuario NO encontrado');
  }

  // CAMPANA DE NOTIFICACIONES
  const notificationBell = document.querySelector('.notification-bell');
  if (notificationBell) {
    console.log('✅ [MAIN] Campana de notificaciones encontrada');
    notificationBell.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('🔘 [MAIN] Click en campana de notificaciones');
      alert('Notificaciones\n\n• Nueva orden asignada\n• Recordatorio: Revisión pendiente\n• Material disponible para recoger\n\n(En desarrollo)');
    });
  } else {
    console.warn('⚠️ [MAIN] Campana de notificaciones NO encontrada');
  }

  console.log('✅ [MAIN] Todos los event listeners registrados correctamente');
});
