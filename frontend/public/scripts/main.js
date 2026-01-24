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

// La navegación ahora funciona con enlaces reales a páginas
// No se necesita JavaScript adicional para manejar la navegación

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
// FUNCIONALIDAD DE BOTONES DEL DASHBOARD
// ================================================

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {

  // BOTONES DEL HERO
  const btnNuevaOrden = document.querySelector('.hero-actions .btn-primary');
  const btnVerCalendario = document.querySelector('.hero-actions .btn-secondary');

  if (btnNuevaOrden) {
    btnNuevaOrden.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = '/nueva-orden';
    });
  } else {
  }

  if (btnVerCalendario) {
    btnVerCalendario.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = '/calendario';
    });
  } else {
  }

  // BOTONES DE ACCIONES RÁPIDAS
  const actionCards = document.querySelectorAll('.action-card');

  actionCards.forEach((card, index) => {
    const title = card.querySelector('h3')?.textContent || 'Acción ' + (index + 1);

    card.addEventListener('click', function(e) {
      e.preventDefault();

      // Redirigir según la acción
      const redirects = {
        'Nueva Orden': '/nueva-orden',
        'Nuevo Trabajador': '/nuevo-trabajador',
        'Solicitar Material': '/solicitar-material',
        'Generar Reporte': '/generar-reporte'
      };

      if (redirects[title]) {
        window.location.href = redirects[title];
      } else {
        const actions = {
          'Generar Reporte': 'generará y descargará un reporte en formato PDF'
        };
        const description = actions[title] || 'ejecutará la funcionalidad correspondiente';
        alert(`Funcionalidad: ${title}\n\nEsta función ${description}.\n\n(En desarrollo)`);
        showNotification(`${title} - En desarrollo`, 'info');
      }
    });
  });

  // MENÚ DROPDOWN DE USUARIO
  const userAvatar = document.querySelector('.user-avatar');
  const userDropdown = document.getElementById('userDropdown');

  if (userAvatar && userDropdown) {

    // Toggle dropdown al hacer click en avatar
    userAvatar.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      userDropdown.classList.toggle('hidden');
    });

    // Cerrar dropdown al hacer click fuera
    document.addEventListener('click', function(e) {
      if (!userDropdown.contains(e.target) && !userAvatar.contains(e.target)) {
        userDropdown.classList.add('hidden');
      }
    });

    // OPCIÓN: MI PERFIL
    const menuProfile = document.getElementById('menuProfile');
    if (menuProfile) {
      menuProfile.addEventListener('click', function(e) {
        e.preventDefault();
        userDropdown.classList.add('hidden');
        window.location.href = '/perfil';
      });
    }

    // OPCIÓN: CONFIGURACIÓN
    const menuSettings = document.getElementById('menuSettings');
    if (menuSettings) {
      menuSettings.addEventListener('click', function(e) {
        e.preventDefault();
        userDropdown.classList.add('hidden');
        window.location.href = '/configuracion';
      });
    }

    // OPCIÓN: IDIOMA
    const menuLanguage = document.getElementById('menuLanguage');
    const languageSubmenu = document.getElementById('languageSubmenu');

    if (menuLanguage && languageSubmenu) {
      menuLanguage.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        languageSubmenu.classList.toggle('show');
        languageSubmenu.classList.toggle('hidden');
      });

      // Manejar selección de idioma
      document.querySelectorAll('.submenu-item').forEach(item => {
        item.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          const selectedLang = this.dataset.lang;

          // Guardar idioma en localStorage
          localStorage.setItem('language', selectedLang);

          // Actualizar checks
          document.querySelectorAll('.submenu-item i').forEach(check => check.classList.add('hidden'));
          document.getElementById('check' + selectedLang.charAt(0).toUpperCase() + selectedLang.slice(1)).classList.remove('hidden');

          // Actualizar texto de idioma actual
          const langNames = { es: 'Español', en: 'English', fr: 'Français' };
          document.getElementById('currentLanguage').textContent = langNames[selectedLang];

          // Cerrar menus
          languageSubmenu.classList.add('hidden');
          languageSubmenu.classList.remove('show');
          userDropdown.classList.add('hidden');

          // Recargar página para aplicar idioma
          location.reload();
        });
      });

      // Inicializar idioma actual
      const currentLang = localStorage.getItem('language') || 'es';
      const langNames = { es: 'Español', en: 'English', fr: 'Français' };
      document.getElementById('currentLanguage').textContent = langNames[currentLang];
      document.getElementById('check' + currentLang.charAt(0).toUpperCase() + currentLang.slice(1)).classList.remove('hidden');
    }

    // OPCIÓN: CERRAR SESIÓN
    const menuLogout = document.getElementById('menuLogout');
    if (menuLogout) {
      menuLogout.addEventListener('click', function(e) {
        e.preventDefault();
        userDropdown.classList.add('hidden');

        const shouldLogout = confirm('¿Estás seguro de que deseas cerrar sesión?');
        if (shouldLogout) {
          if (window.auth && typeof window.auth.logout === 'function') {
            window.auth.logout();
          } else {
            console.error('❌ [MAIN] Función logout no disponible');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
        }
      });
    }
  } else {
  }

  // ================================================
  // SISTEMA DE NOTIFICACIONES
  // ================================================
  const notificationBell = document.querySelector('.notification-bell');
  const notificationsPanel = document.getElementById('notificationsPanel');
  const closeNotifications = document.getElementById('closeNotifications');

  if (notificationBell && notificationsPanel) {

    notificationBell.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      notificationsPanel.classList.toggle('hidden');
      notificationsPanel.classList.toggle('show');
      // Cerrar chat si está abierto
      if (chatPanel) {
        chatPanel.classList.add('hidden');
        chatPanel.classList.remove('show');
      }
    });

    closeNotifications.addEventListener('click', function() {
      notificationsPanel.classList.add('hidden');
      notificationsPanel.classList.remove('show');
    });

    // Cerrar al hacer click fuera
    document.addEventListener('click', function(e) {
      if (!notificationsPanel.contains(e.target) && !notificationBell.contains(e.target)) {
        notificationsPanel.classList.add('hidden');
        notificationsPanel.classList.remove('show');
      }
    });
  }

  // ================================================
  // SISTEMA DE CHAT
  // ================================================
  const floatingChatBtn = document.getElementById('floatingChatBtn');
  const chatPanel = document.getElementById('chatPanel');
  const closeChat = document.getElementById('closeChat');
  const chatInput = document.getElementById('chatInput');
  const sendChatBtn = document.getElementById('sendChatBtn');
  const chatMessages = document.getElementById('chatMessages');

  if (floatingChatBtn && chatPanel) {

    floatingChatBtn.addEventListener('click', function() {
      chatPanel.classList.toggle('hidden');
      chatPanel.classList.toggle('show');
      // Cerrar notificaciones si están abiertas
      if (notificationsPanel) {
        notificationsPanel.classList.add('hidden');
        notificationsPanel.classList.remove('show');
      }
      // Focus en input si se abre
      if (chatPanel.classList.contains('show')) {
        chatInput.focus();
      }
    });

    closeChat.addEventListener('click', function() {
      chatPanel.classList.add('hidden');
      chatPanel.classList.remove('show');
    });

    // Enviar mensaje
    function sendMessage() {
      const message = chatInput.value.trim();
      if (!message) return;

      // Agregar mensaje del usuario
      const userMessage = document.createElement('div');
      userMessage.className = 'chat-message user';
      userMessage.innerHTML = `
        <div class="message-avatar">
          <i class="fas fa-user"></i>
        </div>
        <div class="message-content">
          <p>${message}</p>
          <span class="message-time">Ahora</span>
        </div>
      `;
      chatMessages.appendChild(userMessage);

      // Limpiar input
      chatInput.value = '';

      // Scroll to bottom
      chatMessages.scrollTop = chatMessages.scrollHeight;

      // Respuesta automática del bot
      setTimeout(() => {
        const botMessage = document.createElement('div');
        botMessage.className = 'chat-message bot';
        botMessage.innerHTML = `
          <div class="message-avatar">
            <i class="fas fa-robot"></i>
          </div>
          <div class="message-content">
            <p>Gracias por tu mensaje. Un miembro del equipo te responderá pronto.</p>
            <span class="message-time">Ahora</span>
          </div>
        `;
        chatMessages.appendChild(botMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }, 1000);
    }

    sendChatBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  }


  // ================================================
  // CARGAR DATOS REALES DEL DASHBOARD
  // ================================================

  loadDashboardData();
});

// ================================================
// FUNCIONES PARA CARGAR DATOS DEL BACKEND
// ================================================

const API_BASE_URL = 'http://localhost:3000/api';

async function loadDashboardData() {
  // Cargar datos en paralelo
  await Promise.all([
    loadUserName(),
    loadStatistics(),
    loadRecentOrders(),
    loadWorkersTable()
  ]);
}

// Cargar nombre de usuario
async function loadUserName() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userName = user.name || 'Usuario';

    const heroNameEl = document.getElementById('heroUserName');
    if (heroNameEl) {
      heroNameEl.textContent = userName;
    }
  } catch (error) {
    console.error('Error cargando nombre de usuario:', error);
  }
}

// Cargar estadísticas
async function loadStatistics() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Obtener estadísticas de órdenes
    const ordersResponse = await fetch(`${API_BASE_URL}/orders?limit=1000`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (ordersResponse.ok) {
      const ordersData = await ordersResponse.json();
      const orders = ordersData.orders || [];

      const activeOrders = orders.filter(o => ['assigned', 'in_progress'].includes(o.status)).length;
      const completedOrders = orders.filter(o => o.status === 'completed').length;
      const pendingOrders = orders.filter(o => o.status === 'pending').length;

      document.getElementById('statActiveOrders').textContent = activeOrders;
      document.getElementById('statCompletedOrders').textContent = completedOrders;
      document.getElementById('statPending').textContent = pendingOrders;
    }

    // Obtener cantidad de trabajadores
    const usersResponse = await fetch(`${API_BASE_URL}/users?role=trabajador`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      const workers = usersData.users || [];
      document.getElementById('statWorkers').textContent = workers.length;
    }

  } catch (error) {
    console.error('Error cargando estadísticas:', error);
    // Mostrar 0 en caso de error
    document.getElementById('statActiveOrders').textContent = '0';
    document.getElementById('statCompletedOrders').textContent = '0';
    document.getElementById('statWorkers').textContent = '0';
    document.getElementById('statPending').textContent = '0';
  }
}

// Cargar órdenes recientes
async function loadRecentOrders() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;

    const response = await fetch(`${API_BASE_URL}/orders?limit=3&orderBy=created_at&sortOrder=DESC`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const grid = document.getElementById('recentOrdersGrid');

    if (!response.ok) {
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #888;">No se pudieron cargar las órdenes</div>';
      return;
    }

    const data = await response.json();
    const orders = data.orders || [];

    if (orders.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #888;"><i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i><p>No hay órdenes aún</p></div>';
      return;
    }

    grid.innerHTML = orders.map(order => createOrderCard(order)).join('');

  } catch (error) {
    console.error('Error cargando órdenes recientes:', error);
    document.getElementById('recentOrdersGrid').innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #888;">Error al cargar órdenes</div>';
  }
}

function createOrderCard(order) {
  const statusMap = {
    'pending': { label: 'Pendiente', class: 'status-pending' },
    'assigned': { label: 'Asignada', class: 'status-pending' },
    'in_progress': { label: 'En Progreso', class: 'status-active' },
    'completed': { label: 'Completada', class: 'status-completed' },
    'cancelled': { label: 'Cancelada', class: 'status-cancelled' }
  };

  const status = statusMap[order.status] || { label: order.status, class: '' };
  const date = new Date(order.scheduled_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  return `
    <div class="order-card glass-effect hover-lift">
      <div class="order-header">
        <span class="order-number">${order.order_number || '#' + order.id}</span>
        <span class="order-status ${status.class}">${status.label}</span>
      </div>
      <h3 class="order-client">${order.client_name}</h3>
      <p class="order-address">
        <i class="fas fa-map-marker-alt"></i>
        ${order.address}${order.city ? ', ' + order.city : ''}
      </p>
      <div class="order-details">
        <div class="order-detail">
          <i class="fas fa-calendar"></i>
          <span>${date}</span>
        </div>
        ${order.responsible_worker_name ? `
          <div class="order-detail">
            <i class="fas fa-user"></i>
            <span>${order.responsible_worker_name}</span>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// Cargar tabla de trabajadores
async function loadWorkersTable() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;

    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const tbody = document.getElementById('workersTableBody');

    if (!response.ok) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #888;">No se pudieron cargar los trabajadores</td></tr>';
      return;
    }

    const data = await response.json();
    const users = data.users || [];

    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #888;"><i class="fas fa-users-slash" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i><p>No hay usuarios registrados</p></td></tr>';
      return;
    }

    const roleNames = {
      'admin': 'Administrador',
      'jefe': 'Jefe',
      'gerente': 'Gerente',
      'trabajador': 'Trabajador'
    };

    tbody.innerHTML = users.map(user => `
      <tr>
        <td><span class="worker-name">${user.name}</span></td>
        <td>${user.email}</td>
        <td>${user.phone || '-'}</td>
        <td><span class="worker-role-badge ${user.role}">${roleNames[user.role] || user.role}</span></td>
        <td><span class="worker-status-badge ${user.is_active ? 'active' : 'inactive'}">
          <i class="fas fa-circle"></i>
          ${user.is_active ? 'Activo' : 'Inactivo'}
        </span></td>
      </tr>
    `).join('');

  } catch (error) {
    console.error('Error cargando trabajadores:', error);
    document.getElementById('workersTableBody').innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #888;">Error al cargar trabajadores</td></tr>';
  }
}
