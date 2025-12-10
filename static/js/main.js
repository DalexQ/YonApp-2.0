/**
 * main.js - Lógica Global y Sistema de Navegación
 * ================================================
 * 
 * Este archivo maneja la navegación entre módulos y vistas de la aplicación.
 * También controla el sistema de sidebar dinámico y la gestión de tabs.
 * 
 * Funciones principales:
 * - Gestión de login (simulado)
 * - Navegación entre módulos (Salas, Carreras, Dashboard)
 * - Sistema de tabs dinámico
 * - Sidebar adaptativo según módulo activo
 * - Hooks para cargar datos específicos de cada vista
 * 
 * Dependencias:
 * - Lucide Icons: Para iconografía
 * - rooms.js: Funciones del módulo de salas
 * - careers.js: Funciones del módulo de carreras
 * - subjects.js: Funciones del buscador de asignaturas
 */

// Inicializar iconos de Lucide al cargar el script
lucide.createIcons();

// ===================================
// LÓGICA DE INTERFAZ - LOGIN
// ===================================

/**
 * Maneja el proceso de "login" simulado.
 * NOTA: Este es un login ficticio sin autenticación real.
 * Ver README.md sobre implementación de autenticación real pendiente.
 * 
 * @param {Event} e - Evento del formulario
 */
function handleLogin(e) {
    e.preventDefault();
    // Ocultar pantalla de login
    document.getElementById('view-login').classList.add('hidden');
    // Mostrar layout principal de la aplicación
    document.getElementById('main-layout').classList.remove('hidden');
}

// ===================================
// GESTIÓN DE NAVEGACIÓN Y SIDEBAR
// ===================================

/**
 * Cambia el contenido del sidebar según el módulo activo.
 * Cada módulo tiene su propio conjunto de opciones de navegación.
 * 
 * Modos disponibles:
 * - 'root': Vista principal con acceso a todos los módulos
 * - 'rooms': Navegación específica del módulo de salas
 * - 'careers': Navegación específica del módulo de carreras
 * 
 * @param {string} mode - Modo del sidebar ('root', 'rooms', 'careers')
 */
function setSidebarMode(mode) {
    // Ocultar todos los menús del sidebar
    document.getElementById('nav-root').classList.add('hidden');
    document.getElementById('nav-rooms').classList.add('hidden');
    document.getElementById('nav-careers').classList.add('hidden');

    // Mostrar el menú correspondiente al modo seleccionado
    if (mode === 'root') {
        document.getElementById('nav-root').classList.remove('hidden');
    } else if (mode === 'rooms') {
        document.getElementById('nav-rooms').classList.remove('hidden');
    } else if (mode === 'careers') {
        document.getElementById('nav-careers').classList.remove('hidden');
    }
    
    // Reinicializar iconos después de cambiar contenido del DOM
    lucide.createIcons(); 
}

/**
 * Entra a un módulo específico de la aplicación.
 * Configura el sidebar y navega a la vista inicial del módulo.
 * 
 * @param {string} moduleName - Nombre del módulo ('rooms' o 'careers')
 */
function enterModule(moduleName) {
    if (moduleName === 'rooms') {
        setSidebarMode('rooms');
        // Llamar a función del módulo de salas (definida en rooms.js)
        if (typeof handleRoomsClick === 'function') {
            handleRoomsClick();
        } else {
            switchTab('upload'); // Fallback si la función no existe
        }
    } else if (moduleName === 'careers') {
        setSidebarMode('careers');
        switchTab('career-schedule');
    }
}

/**
 * Regresa al dashboard principal desde cualquier módulo.
 */
function goBackToRoot() {
    setSidebarMode('root');
    switchTab('dashboard');
}

/**
 * Cambia entre las diferentes vistas/tabs de la aplicación.
 * También maneja la carga de datos específicos de cada vista.
 * 
 * @param {string} tabId - ID de la vista a mostrar (sin prefijo 'tab-')
 */
function switchTab(tabId) {
    // Limpiar highlights de salas si existe la función (en rooms.js)
    if (typeof resetRoomHighlights === 'function') {
        resetRoomHighlights();
    }

    // Si vamos al dashboard, forzamos el menú raíz
    if (tabId === 'dashboard') {
        setSidebarMode('root');
    }

    // Gestión de estilos de botones
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-slate-800', 'text-white');
        btn.classList.add('text-slate-300');
    });
    const activeBtn = document.getElementById('btn-' + tabId);
    if (activeBtn) activeBtn.classList.add('bg-slate-800', 'text-white');
    
    // Gestión de vistas
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    const view = document.getElementById('tab-' + tabId);
    if (view) view.classList.remove('hidden');
    
    // Títulos Dinámicos
    const titles = {
        'dashboard': 'Inicio',
        'upload': 'Importación de Datos',
        'timetable': 'Visualizador de Horarios',
        'occupancy': 'Monitor de Ocupación',
        'finder': 'Buscador de Salas',
        'unassigned-nrcs': 'NRCs Sin Sala Asignada',
        'no-teacher': 'Asignaturas Sin Docente',
        'career-schedule': 'Planificador Académico',
        'career-list': 'Carreras',
        'subject-list': 'Asignaturas'
    };
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.innerText = titles[tabId] || 'YonApp';

    // Hook para el gráfico de salas (si estamos en esa pestaña y existe la data)
    if(tabId === 'occupancy' && typeof renderOccupancyChart === 'function' && typeof globalData !== 'Sin Definir' && globalData) {
        setTimeout(renderOccupancyChart, 50);
    }

    // Hook para cargar asignaturas
    if(tabId === 'subject-list' && typeof loadSubjectsFromDatabase === 'function') {
        loadSubjectsFromDatabase();
    }

    // Hook para cargar NRCs sin sala
    if(tabId === 'unassigned-nrcs' && typeof loadUnassignedNRCs === 'function') {
        loadUnassignedNRCs();
    }

    // Hook para cargar salas sin docente
    if(tabId === 'no-teacher' && typeof loadRoomsWithoutTeacher === 'function') {
        loadRoomsWithoutTeacher();
    }

    // La carga de Excel para Grupos 1° Año se hace sólo
    // cuando se presiona el botón "Cargar" del formulario,
    // así evitamos mostrar el modal de carga al entrar a la vista.
    
    lucide.createIcons();
}

// --- MODALES GLOBALES (HELPERS) ---
function toggleLoading(show) {
    const modal = document.getElementById('modal-loading');
    if(!modal) return;
    if (show) modal.classList.remove('hidden');
    else modal.classList.add('hidden');
}

function showStatusModal(type, title, message) {
    const modal = document.getElementById('modal-status');
    if(!modal) { alert(message); return; }

    const iconContainer = document.getElementById('status-icon-container');
    const icon = document.getElementById('status-icon');
    
    document.getElementById('status-title').innerText = title;
    document.getElementById('status-message').innerText = message;

    if (type === 'success') {
        iconContainer.className = "mx-auto w-16 h-16 flex items-center justify-center rounded-full mb-4 bg-green-100 text-green-600";
        icon.setAttribute('data-lucide', 'check');
    } else {
        iconContainer.className = "mx-auto w-16 h-16 flex items-center justify-center rounded-full mb-4 bg-red-100 text-red-600";
        icon.setAttribute('data-lucide', 'x');
    }
    
    lucide.createIcons();
    modal.classList.remove('hidden');
}

function closeStatusModal() {
    const modal = document.getElementById('modal-status');
    if(modal) modal.classList.add('hidden');
}

// Inicialización Global
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    const dateEl = document.getElementById('date-display');
    if(dateEl) dateEl.innerText = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    
    // Animación Typewriter del Login
    if(document.getElementById('typewriter-text')) {
        const target = document.getElementById('typewriter-text');
        (async () => {
            const type = async (t) => { for(let c of t) { target.innerText += c; await new Promise(r=>setTimeout(r,100)); }};
            const del = async () => { while(target.innerText.length > 0) { target.innerText = target.innerText.slice(0,-1); await new Promise(r=>setTimeout(r,50)); }};
            await new Promise(r=>setTimeout(r,300));
            await type("✨Your on-campus network✨");
        })();
    }
});