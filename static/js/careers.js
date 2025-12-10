/**
 * careers.js - Módulo de Gestión de Carreras y Planificación Académica
 * ======================================================================
 * 
 * Estado: EN DESARROLLO ⚠️
 * 
 * ADVERTENCIA: Este módulo está en fase experimental y requiere:
 * - Sistema de autenticación con roles de usuario
 * - Base de datos persistente (actualmente usa memoria)
 * - Arquitectura multiusuario
 * Ver README.md sección "Limitaciones Actuales" para más detalles.
 * 
 * Funcionalidades implementadas:
 * - CRUD completo de carreras universitarias
 * - Configuración de períodos académicos (semestres pares/impares)
 * - Planificador visual de horarios (tipo grilla)
 * - Gestión de bloques de clases (añadir, editar, eliminar)
 * - Detección de conflictos de horario
 * - Buscador de asignaturas por NRC
 * - Autocompletado de códigos de materia
 * - Gestión de mallas curriculares
 * 
 * Variables globales:
 * - careerDatabase: Objeto con todas las carreras y sus planificaciones
 * - careerPendingDelete: Código de carrera pendiente de eliminación
 * - currentPlanningPeriod: 1=Impares, 2=Pares
 * - currentEditBlock: Bloque siendo editado en modal
 * - blockIndexToDelete: Índice del bloque a eliminar
 * 
 * Dependencias:
 * - main.js: switchTab(), showStatusModal()
 * - subjects.js: loadSubjectsFromDatabase()
 * - Lucide Icons: Iconografía
 */

// ===================================
// VARIABLES GLOBALES DEL MÓDULO
// ===================================
let careerDatabase = {};  // Almacena todas las carreras y planificaciones
let careerPendingDelete = null;  // Código de carrera a eliminar (para confirmación)
let currentPlanningPeriod = 1;  // 1 = Semestres Impares (1,3,5,7,9), 2 = Pares (2,4,6,8,10)

// ===================================
// INICIALIZACIÓN AL CARGAR LA PÁGINA
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    loadCareers();
});

// ===================================
// API CLIENTE - COMUNICACIÓN CON BACKEND
// ===================================

/**
 * Carga todas las carreras desde el backend.
 * Se ejecuta automáticamente al cargar la página.
 * 
 * Actualiza:
 * - careerDatabase: Con datos del servidor
 * - currentPlanningPeriod: Con el período activo
 * - UI: Renderiza lista de carreras y actualiza selectores
 */
async function loadCareers() {
    try {
        const res = await fetch('/get_careers');
        const json = await res.json();
        if(json.success) {
            careerDatabase = json.data;
            currentPlanningPeriod = json.period || 1;
            updatePeriodUI();
            renderCareerListTable();
            updateScheduleSelectors();
        }
    } catch(e) { console.error("Error cargando carreras", e); }
}

// ===================================
// CONFIGURACIÓN DE PERÍODO ACADÉMICO
// ===================================

/**
 * Abre el modal para configurar el período académico.
 * Permite alternar entre semestres pares e impares.
 */
function openPeriodConfigModal() {
    document.getElementById('modal-period-config').classList.remove('hidden');
    updatePeriodUI();
}

/**
 * Configura el período académico activo en el backend.
 * 
 * @param {number} period - 1 para semestres impares, 2 para pares
 * 
 * Efecto en UI:
 * - Filtra los selectores de semestre para mostrar solo impares o pares
 * - Actualiza la etiqueta del botón de período
 */
async function setPlanningPeriod(period) {
    try {
        const res = await fetch('/set_planning_period', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ period })
        });
        const json = await res.json();
        if(json.success) {
            currentPlanningPeriod = json.period;
            updatePeriodUI();
            updateScheduleSelectors(); // Refrescar selectores
            document.getElementById('modal-period-config').classList.add('hidden');
        }
    } catch(e) { console.error("Error setting period", e); }
}

/**
 * Actualiza la interfaz para reflejar el período académico activo.
 * 
 * Cambios visuales:
 * - Etiqueta del botón principal (1° o 2° Semestre)
 * - Indicador visual en el modal de configuración
 * - Estilos de los botones de selección
 */
function updatePeriodUI() {
    // Actualizar etiqueta en el botón principal
    const label = document.getElementById('current-period-label');
    if(label) label.innerText = currentPlanningPeriod === 1 ? "Periodo: 1° Semestre" : "Periodo: 2° Semestre";

    // Actualizar selección en el modal
    document.querySelectorAll('.check-indicator').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('[id^="btn-period-"]').forEach(el => el.classList.remove('border-purple-500', 'bg-purple-50'));
    
    const activeBtn = document.getElementById('btn-period-' + currentPlanningPeriod);
    if(activeBtn) {
        activeBtn.classList.add('border-purple-500', 'bg-purple-50');
        activeBtn.querySelector('.check-indicator').classList.remove('hidden');
    }
}

// ===================================
// VISTA 1: LISTADO DE CARRERAS
// ===================================

/**
 * Renderiza la tabla con todas las carreras disponibles.
 * 
 * Muestra:
 * - Código de la carrera
 * - Nombre completo
 * - Número de semestres
 * - Mallas curriculares activas
 * - Botones de acción (Editar, Ver Horarios, Eliminar)
 * 
 * Estado vacío: Muestra mensaje cuando no hay carreras
 */
function renderCareerListTable() {
    const tbody = document.getElementById('career-list-body');
    const empty = document.getElementById('career-list-empty');
    if(!tbody) return;
    tbody.innerHTML = '';
    const keys = Object.keys(careerDatabase);
    if(keys.length === 0) { empty.classList.remove('hidden'); return; }
    empty.classList.add('hidden');
    keys.forEach(code => {
        const c = careerDatabase[code];
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 transition group";
        tr.innerHTML = `
            <td class="px-6 py-4 font-mono font-bold text-slate-600">${code}</td>
            <td class="px-6 py-4 font-bold text-slate-800">${c.nombre}</td>
            <td class="px-6 py-4 text-center"><span class="bg-slate-100 px-2 py-1 rounded text-xs border border-slate-200">${c.semestres} Sem.</span></td>
            <td class="px-6 py-4 text-center text-xs text-slate-500">${c.mallas.join(', ')}</td>
            <td class="px-6 py-4 text-right flex justify-end gap-2">
                <button onclick="openEditCareerModal('${code}')" class="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-2 border border-blue-200"><i data-lucide="edit-3" class="w-3 h-3"></i> Editar</button>
                <button onclick="goToSchedule('${code}')" class="bg-purple-50 text-purple-600 hover:bg-purple-100 px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-2 border border-purple-200"><i data-lucide="calendar" class="w-3 h-3"></i> Horarios</button>
                <button onclick="promptDeleteCareer('${code}')" class="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    if(window.lucide) lucide.createIcons();
}

/**
 * Abre el modal para añadir una nueva carrera.
 * Limpia el formulario y prepara la UI para entrada de datos.
 */
function openCareerConfigModal() {
    document.getElementById('modal-career-config').classList.remove('hidden');
    document.getElementById('cfg-code').value = '';
    document.getElementById('cfg-code').disabled = false;
    document.getElementById('cfg-name').value = '';
    document.getElementById('cfg-semesters').value = 10;
    renderMeshCheckboxes('cfg-meshes-container', []);
}

/**
 * Abre el modal para editar una carrera existente.
 * 
 * @param {string} code - Código de la carrera a editar
 * 
 * Precarga:
 * - Nombre actual
 * - Número de semestres
 * - Mallas curriculares activas (checkboxes marcados)
 */
function openEditCareerModal(code) {
    const career = careerDatabase[code];
    if (!career) return;
    
    document.getElementById('modal-edit-career').classList.remove('hidden');
    document.getElementById('edit-code').value = code;
    document.getElementById('edit-name').value = career.nombre;
    document.getElementById('edit-semesters').value = career.semestres;
    renderMeshCheckboxes('edit-meshes-container', career.mallas || []);
}

/**
 * Convierte un string a formato Title Case.
 * 
 * @param {string} str - Texto a convertir
 * @returns {string} - Texto con primera letra de cada palabra en mayúscula
 * 
 * Ejemplo: "ingeniería civil informática" → "Ingeniería Civil Informática"
 */
function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

/**
 * Guarda una nueva carrera en el sistema.
 * 
 * Validaciones:
 * - Código y nombre no vacíos
 * - Al menos una malla curricular seleccionada
 * 
 * Flujo:
 * 1. Lee datos del formulario
 * 2. Formatea nombre a Title Case
 * 3. Envía POST a /save_career
 * 4. Actualiza careerDatabase y UI
 * 5. Cierra modal
 */
async function saveCareerConfig() {
    const code = document.getElementById('cfg-code').value.toUpperCase();
    const nameRaw = document.getElementById('cfg-name').value;
    const name = toTitleCase(nameRaw);
    const sem = document.getElementById('cfg-semesters').value;
    const meshes = getSelectedMeshes('cfg-meshes-container');

    if(!code || !name) { alert("Faltan datos"); return; }
    if(meshes.length === 0) { alert("Debe seleccionar al menos una malla"); return; }

    try {
        const res = await fetch('/save_career', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ code, name, semesters: sem, meshes })
        });
        const json = await res.json();
        if(json.success) {
            careerDatabase = json.data; 
            renderCareerListTable();     
            updateScheduleSelectors();   
            document.getElementById('modal-career-config').classList.add('hidden');
        } else { alert("Error: " + json.error); }
    } catch(e) { alert("Error de conexión"); }
}

/**
 * Guarda los cambios de una carrera editada.
 * 
 * Similar a saveCareerConfig pero usa código existente.
 * Permite cambiar nombre, semestres y mallas curriculares.
 */
async function saveEditedCareer() {
    const code = document.getElementById('edit-code').value.toUpperCase();
    const nameRaw = document.getElementById('edit-name').value;
    const name = toTitleCase(nameRaw);
    const sem = document.getElementById('edit-semesters').value;
    const meshes = getSelectedMeshes('edit-meshes-container');

    if(!code || !name) { alert("Faltan datos"); return; }
    if(meshes.length === 0) { alert("Debe seleccionar al menos una malla"); return; }

    try {
        const res = await fetch('/save_career', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ code, name, semesters: sem, meshes })
        });
        const json = await res.json();
        if(json.success) {
            careerDatabase = json.data; 
            renderCareerListTable();     
            updateScheduleSelectors();   
            document.getElementById('modal-edit-career').classList.add('hidden');
        } else { alert("Error: " + json.error); }
    } catch(e) { alert("Error de conexión"); }
}

/**
 * Abre el modal de confirmación para eliminar una carrera.
 * 
 * @param {string} code - Código de la carrera a eliminar
 * 
 * Seguridad:
 * - Muestra nombre completo para confirmación visual
 * - Requiere clic explícito en "Confirmar"
 */
function promptDeleteCareer(code) {
    careerPendingDelete = code;
    document.getElementById('del-career-name').innerText = careerDatabase[code].nombre;
    document.getElementById('modal-delete-career').classList.remove('hidden');
}

/**
 * Ejecuta la eliminación de la carrera pendiente.
 * 
 * ADVERTENCIA: Eliminación permanente sin papelera de reciclaje.
 * Se pierde toda la planificación de horarios asociada.
 * 
 * Flujo:
 * 1. Envía DELETE a /delete_career
 * 2. Elimina del careerDatabase local
 * 3. Actualiza tabla y selectores
 * 4. Cierra modal
 */
async function confirmDeleteCareer() {
    if(!careerPendingDelete) return;
    try {
        const res = await fetch('/delete_career', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ code: careerPendingDelete })
        });
        if(res.ok) {
            delete careerDatabase[careerPendingDelete];
            renderCareerListTable();
            updateScheduleSelectors();
            document.getElementById('modal-delete-career').classList.add('hidden');
        }
    } catch(e) { alert("Error al eliminar"); }
}

// ===================================
// VISTA 2: PLANIFICADOR DE HORARIOS
// ===================================

/**
 * Navega a la vista del planificador de horarios.
 * 
 * @param {string} code - Código de la carrera a planificar
 * 
 * Efecto:
 * - Cambia a pestaña 'career-schedule'
 * - Carga la planificación de la carrera
 */
function goToSchedule(code) {
    if(window.switchTab) {
        switchTab('career-schedule');
        selectCareer(code);
    }
}

/**
 * Actualiza los selectores de carrera en todas las vistas.
 * 
 * Propósito:
 * - Sincronizar cambios en careerDatabase con la UI
 * - Mantener consistencia después de CRUD
 * 
 * Actualiza:
 * - Lista de opciones en el buscador
 * - Estado del botón de añadir bloques
 */
function updateScheduleSelectors() {
    // Inicializar lista de opciones para el buscador
    const optionsContainer = document.getElementById('schedule-career-options');
    if(!optionsContainer) return;
    
    optionsContainer.innerHTML = '';
    Object.keys(careerDatabase).forEach(code => {
        const div = document.createElement('div');
        div.className = "p-2 hover:bg-purple-50 cursor-pointer text-sm text-slate-700 border-b border-slate-50 last:border-0";
        div.innerText = `${code} - ${careerDatabase[code].nombre}`;
        div.onclick = () => selectCareer(code);
        div.dataset.code = code;
        div.dataset.name = careerDatabase[code].nombre;
        optionsContainer.appendChild(div);
    });
    
    // Asegurar que no haya selección inicial si no se ha especificado
    const selector = document.getElementById('schedule-career-selector');
    const searchInput = document.getElementById('schedule-career-search');
    if(selector && !selector.value) {
        searchInput.value = '';
        updateScheduleFilters();
    } else {
        updateAddButtonState();
    }
}

/**
 * Muestra el dropdown de opciones de carreras.
 * Se activa al hacer clic en el campo de búsqueda.
 */
function showCareerOptions() {
    document.getElementById('schedule-career-options').classList.remove('hidden');
}

/**
 * Oculta el dropdown con un pequeño delay.
 * Permite hacer clic en opciones antes de que se oculte.
 */
function hideCareerOptionsDelayed() {
    setTimeout(() => {
        document.getElementById('schedule-career-options').classList.add('hidden');
    }, 200);
}

/**
 * Filtra las opciones de carreras según el texto ingresado.
 * 
 * Búsqueda:
 * - Insensible a mayúsculas/minúsculas
 * - Busca en código y nombre de carrera
 * - Resultados en tiempo real (keyup event)
 */
function filterCareerOptions() {
    const query = document.getElementById('schedule-career-search').value.toUpperCase();
    const options = document.getElementById('schedule-career-options').children;
    
    for(let opt of options) {
        const text = opt.innerText.toUpperCase();
        if(text.includes(query)) {
            opt.classList.remove('hidden');
        } else {
            opt.classList.add('hidden');
        }
    }
    showCareerOptions();
}

/**
 * Selecciona una carrera del dropdown y carga su planificación.
 * 
 * @param {string} code - Código de la carrera seleccionada
 * 
 * Efecto:
 * - Actualiza campo de búsqueda con nombre completo
 * - Oculta dropdown
 * - Carga la grilla de horarios
 * - Habilita botón de añadir bloques
 */
function selectCareer(code) {
    const selector = document.getElementById('schedule-career-selector');
    const searchInput = document.getElementById('schedule-career-search');
    
    if(selector && searchInput && careerDatabase[code]) {
        selector.value = code;
        searchInput.value = code; // Mostrar solo el código como se solicitó
        updateScheduleFilters();
    }
}

/**
 * Habilita o deshabilita el botón de añadir bloque.
 * 
 * Requiere:
 * - Carrera seleccionada
 * - Malla curricular seleccionada
 * - Semestre seleccionado
 * 
 * Cambia:
 * - Estado disabled del botón
 * - Estilos visuales (color, cursor)
 */
function updateAddButtonState() {
    const code = document.getElementById('schedule-career-selector').value;
    const malla = document.getElementById('schedule-malla-selector').value;
    const sem = document.getElementById('schedule-sem-selector').value;
    const btn = document.getElementById('btn-add-block-trigger');

    if (!btn) return;

    const isReady = Boolean(code && malla && sem);
    btn.disabled = !isReady;
    btn.setAttribute('aria-disabled', String(!isReady));

    if (isReady) {
        btn.className = "bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm flex items-center gap-2";
    } else {
        btn.className = "bg-purple-200 text-purple-400 px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 cursor-not-allowed";
    }
}

/**
 * Actualiza los filtros (malla y semestre) según la carrera seleccionada.
 * 
 * Lógica:
 * 1. Lee carrera seleccionada
 * 2. Llena selector de mallas con las activas
 * 3. Llena selector de semestres según período académico
 *    - Período 1: Solo semestres impares (1,3,5,7,9)
 *    - Período 2: Solo semestres pares (2,4,6,8,10)
 * 4. Si solo hay una malla, la selecciona automáticamente
 */
function updateScheduleFilters() {
    const code = document.getElementById('schedule-career-selector').value;
    const mallaSel = document.getElementById('schedule-malla-selector');
    const semSel = document.getElementById('schedule-sem-selector');
    const emptyState = document.getElementById('schedule-empty-state');

    updateAddButtonState();

    if(!code) {
        mallaSel.innerHTML = '<option value="">--</option>';
        semSel.innerHTML = '<option value="">--</option>';
        emptyState.classList.remove('hidden');
        return;
    }
    const career = careerDatabase[code];
    mallaSel.innerHTML = '<option value="">-- Seleccionar Malla --</option>';
    career.mallas.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.innerText = `Malla ${m}`;
        mallaSel.appendChild(opt);
    });
    
    // Si solo hay una malla activa, seleccionarla automáticamente
    if (career.mallas.length === 1) {
        mallaSel.value = career.mallas[0];
    }
    
    semSel.innerHTML = '<option value="">-- Seleccionar Semestre --</option>';
    for(let i=1; i<=career.semestres; i++) {
        // Filtrar según periodo: 
        // Periodo 1 (Impares): i % 2 !== 0
        // Periodo 2 (Pares): i % 2 === 0
        const isOdd = i % 2 !== 0;
        const show = (currentPlanningPeriod === 1 && isOdd) || (currentPlanningPeriod === 2 && !isOdd);
        
        if(show) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.innerText = `Semestre ${i}`;
            semSel.appendChild(opt);
        }
    }
}

/**
 * Renderiza la grilla visual del planificador de horarios.
 * 
 * Estructura:
 * - 8 filas (módulos 1-8 con horarios)
 * - 6 columnas (lunes a sábado)
 * - Bloques de clases posicionados en celdas correspondientes
 * 
 * Colores por tipo:
 * - TEO: Azul (teoría)
 * - LAB: Naranja (laboratorio)
 * - TAL: Verde (taller)
 * - SIM: Morado (simulación)
 * 
 * Interacción:
 * - Clic en bloque: abre modal de edición
 * - Hover en bloque: muestra botón de eliminar
 * 
 * IMPORTANTE: Guarda originalIndex para permitir eliminación correcta
 */
function renderCareerGrid() {
    const code = document.getElementById('schedule-career-selector').value;
    const malla = document.getElementById('schedule-malla-selector').value;
    const sem = document.getElementById('schedule-sem-selector').value;
    const codeLiteral = JSON.stringify(code);
    const mallaLiteral = JSON.stringify(malla);
    const semLiteral = JSON.stringify(sem);
    const tbody = document.getElementById('schedule-grid-body');
    const emptyState = document.getElementById('schedule-empty-state');

    if(!code || !malla || !sem) {
        if(emptyState) emptyState.classList.remove('hidden');
        if(tbody) tbody.innerHTML = '';
        return;
    }

    emptyState.classList.add('hidden');
    tbody.innerHTML = '';

    const allBlocks = careerDatabase[code].planificacion || [];
    
    // IMPORTANTE: Mapeamos los bloques pero guardamos su ÍNDICE ORIGINAL
    // Esto es vital para saber cuál borrar después.
    const activeBlocks = allBlocks
        .map((block, index) => ({ ...block, originalIndex: index })) // Guardamos el índice real
        .filter(b => b.malla === malla && b.semestre == sem);

    const times = ["08:00 - 09:20", "09:30 - 10:50", "11:00 - 12:20", "12:30 - 13:50", "14:00 - 15:20", "15:30 - 16:50", "17:00 - 18:20", "18:30 - 19:50"];
    const days = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
    
    for (let i = 0; i < 8; i++) { 
        const tr = document.createElement('tr');
        tr.className = "border-b border-slate-100"; 

        tr.innerHTML = `
            <td class="p-1.5 border-r border-slate-100 bg-slate-50 text-center align-middle h-16">
                <span class="block font-bold text-slate-700 text-xs">M${i+1}</span>
                <span class="text-[9px] text-slate-400 whitespace-nowrap">${times[i]}</span>
            </td>
        `;

        days.forEach(day => {
            const blocksInCell = activeBlocks.filter(b => b.dia === day && b.modulo === (i+1));
            let content = '';
            
            if (blocksInCell.length > 0) {
                const blocksHTML = blocksInCell.map(block => {
                    let bgClass = "bg-blue-50 border-blue-200 text-blue-700"; 
                    if(block.tipo === 'LAB') bgClass = "bg-orange-50 border-orange-200 text-orange-700";
                    if(block.tipo === 'TAL') bgClass = "bg-green-50 border-green-200 text-green-700";
                    if(block.tipo === 'SIM') bgClass = "bg-purple-50 border-purple-200 text-purple-700";

                    const nrcLiteral = JSON.stringify(block.nrc);
                    const secLiteral = JSON.stringify(block.seccion);
                    const dayLiteral = JSON.stringify(day);

                    return `
                        <div class="flex-1 ${bgClass} border border-l-4 p-1 text-[10px] flex flex-col justify-center items-center overflow-hidden hover:brightness-95 transition cursor-pointer text-center group relative"
                             onclick='openEditBlockModal(${codeLiteral}, ${mallaLiteral}, ${semLiteral}, ${dayLiteral}, ${i+1}, ${nrcLiteral}, ${secLiteral})'>
                            <button type="button" onclick='promptDeleteBlock(${block.originalIndex}, ${codeLiteral}); event.stopPropagation();' class="absolute top-0.5 right-0.5 hidden group-hover:flex items-center justify-center bg-white/80 text-red-600 rounded-full p-0.5 shadow-sm hover:bg-white">
                                <i data-lucide="trash-2" class="w-2.5 h-2.5"></i>
                            </button>
                            <div class="font-bold truncate w-full text-[10px]">NRC ${block.nrc}</div>
                            <div class="text-[9px] opacity-80">${block.seccion}</div>
                        </div>
                    `;
                }).join('');

                content = `<div class="flex h-full w-full gap-1 p-0.5">${blocksHTML}</div>`;
            }

            tr.innerHTML += `<td class="h-16 p-0 border-r border-slate-100 align-top relative hover:bg-slate-50 transition">${content}</td>`;
        });
        tbody.appendChild(tr);
    }
    if(window.lucide) lucide.createIcons();
}

// ===================================
// GESTIÓN DE BLOQUES (AÑADIR/EDITAR)
// ===================================

/**
 * Abre el modal para añadir un nuevo bloque de clase.
 * 
 * Validación previa:
 * - Verifica que haya carrera, malla y semestre seleccionados
 * - Si falta alguno, muestra modal de advertencia con lista
 * 
 * Prepara:
 * - Focus en campo NRC para entrada rápida
 * - Formulario limpio
 */
function openAddBlockModal() {
    const code = document.getElementById('schedule-career-selector').value;
    const malla = document.getElementById('schedule-malla-selector').value;
    const sem = document.getElementById('schedule-sem-selector').value;

    const missing = [];
    if (!code) missing.push("Carrera");
    if (!malla) missing.push("Malla Curricular");
    if (!sem) missing.push("Semestre");

    if (missing.length > 0) {
        const listEl = document.getElementById('missing-selection-list');
        listEl.innerHTML = missing.map(item => `<li>${item}</li>`).join('');
        
        document.getElementById('modal-warning-missing-selection').classList.remove('hidden');
        lucide.createIcons();
        return;
    }

    document.getElementById('modal-add-block').classList.remove('hidden');
    document.getElementById('block-nrc').focus();
}

/**
 * Selecciona el tipo de bloque (TEO/LAB/TAL/SIM).
 * 
 * @param {string} type - Tipo: TEO, LAB, TAL o SIM
 * @param {HTMLElement} btn - Botón clickeado
 * 
 * Efecto visual:
 * - Resalta el botón seleccionado con color temático
 * - Deselecciona los demás botones
 * - Actualiza el input hidden 'block-type'
 */
function selectBlockType(type, btn) {
    document.querySelectorAll('.type-btn').forEach(b => {
        b.className = "type-btn border border-slate-200 text-slate-500 hover:bg-slate-50 py-2 rounded text-xs transition";
    });

    let activeClasses = "type-btn active border-2 font-bold py-2 rounded text-xs transition ";
    if (type === 'TEO') activeClasses += "border-blue-500 bg-blue-50 text-blue-700";
    else if (type === 'LAB') activeClasses += "border-orange-500 bg-orange-50 text-orange-700";
    else if (type === 'TAL') activeClasses += "border-green-500 bg-green-50 text-green-700";
    else if (type === 'SIM') activeClasses += "border-purple-500 bg-purple-50 text-purple-700";
    
    btn.className = activeClasses;
    document.getElementById('block-type').value = type;
}

/**
 * Similar a selectBlockType pero para el modal de edición.
 * Actualiza el campo 'edit-block-type' en lugar de 'block-type'.
 */
function selectEditBlockType(type, btn) {
    document.querySelectorAll('.edit-type-btn').forEach(b => {
        b.className = "edit-type-btn border border-slate-200 text-slate-500 hover:bg-slate-50 py-2 rounded text-xs transition";
    });

    let activeClasses = "edit-type-btn active border-2 font-bold py-2 rounded text-xs transition ";
    if (type === 'TEO') activeClasses += "border-blue-500 bg-blue-50 text-blue-700";
    else if (type === 'LAB') activeClasses += "border-orange-500 bg-orange-50 text-orange-700";
    else if (type === 'TAL') activeClasses += "border-green-500 bg-green-50 text-green-700";
    else if (type === 'SIM') activeClasses += "border-purple-500 bg-purple-50 text-purple-700";
    
    btn.className = activeClasses;
    document.getElementById('edit-block-type').value = type;
}

/**
 * Envía el nuevo bloque al backend para ser guardado.
 * 
 * Flujo:
 * 1. Lee datos del formulario (carrera, malla, semestre)
 * 2. Obtiene NRC y sección (desde select o input según modo)
 * 3. Lee tipo, día y módulo
 * 4. Valida campos requeridos
 * 5. Envía POST a /add_block
 * 6. Actualiza planificación local
 * 7. Rerenderiza grilla y cierra modal
 * 
 * Modos de entrada NRC:
 * - Select: Usa buscador de asignaturas (autocomplete)
 * - Input: Entrada manual de NRC y sección
 */
async function submitNewBlock() {
    const code = document.getElementById('schedule-career-selector').value;
    const malla = document.getElementById('schedule-malla-selector').value;
    const sem = document.getElementById('schedule-sem-selector').value;
    
    // Obtener código de materia y número de curso
    const subjectCode = document.getElementById('block-subject-code').value.trim().toUpperCase();
    const courseNumber = document.getElementById('block-course-number').value.trim();
    
    // Determinar si se usa input o select para NRC
    const nrcInput = document.getElementById('block-nrc-input');
    const nrcSelect = document.getElementById('block-nrc-select');
    const secInput = document.getElementById('block-sec');
    
    let nrc, sec;
    
    // Si el select está visible, usarlo
    if (!nrcSelect.classList.contains('hidden')) {
        const selectedValue = nrcSelect.value;
        if(!selectedValue) {
            alert("Debe seleccionar un NRC");
            return;
        }
        try {
            const data = JSON.parse(selectedValue);
            nrc = data.nrc;
            sec = data.seccion;
        } catch(e) {
            alert("Error al procesar el NRC seleccionado");
            return;
        }
    } else {
        // Si el input está visible, usarlo
        nrc = nrcInput.value.trim();
        sec = secInput.value.trim();
        
        if(!nrc || !sec) {
            alert("NRC y Sección son obligatorios");
            return;
        }
    }
    
    if(!subjectCode || !courseNumber) {
        alert("Código de Materia y Nro Curso son obligatorios");
        return;
    }
    
    const type = document.getElementById('block-type').value;

    // Obtener todos los días y módulos seleccionados
    const dayModuleRows = document.querySelectorAll('.day-module-row');
    const blocks = [];
    
    dayModuleRows.forEach(row => {
        const day = row.querySelector('.block-day').value;
        const mod = row.querySelector('.block-mod').value;
        blocks.push({ dia: day, modulo: mod });
    });

    if (blocks.length === 0) {
        alert("Debe seleccionar al menos un día y módulo");
        return;
    }

    try {
        // Enviar todos los bloques
        for (const block of blocks) {
            const res = await fetch('/add_block', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    career_code: code,
                    malla: malla,
                    semestre: sem,
                    dia: block.dia,
                    modulo: block.modulo,
                    codigo_materia: subjectCode,
                    n_curso: courseNumber,
                    nrc: nrc,
                    seccion: sec,
                    tipo: type
                })
            });
            
            const json = await res.json();
            if(!json.success) {
                alert(`Error en ${block.dia} M${block.modulo}: ${json.error}`);
                return;
            }
            careerDatabase = json.data;
        }
        
        // Si todo fue exitoso
        renderCareerGrid(); 
        closeAddBlockModal();
    } catch(e) { 
        alert("Error de conexión"); 
    }
}

/**
 * Cierra el modal de añadir bloque y limpia todos los campos.
 * 
 * Resetea:
 * - Código de materia y número de curso
 * - NRC y sección (inputs y selects)
 * - Contenedor de días/módulos a una sola fila
 */
function closeAddBlockModal() {
    document.getElementById('modal-add-block').classList.add('hidden');
    document.getElementById('block-subject-code').value = '';
    document.getElementById('block-course-number').value = '';
    
    // Resetear campos de NRC
    const nrcInput = document.getElementById('block-nrc-input');
    const nrcSelect = document.getElementById('block-nrc-select');
    
    nrcInput.value = '';
    nrcInput.classList.remove('hidden');
    nrcSelect.classList.add('hidden');
    nrcSelect.innerHTML = '<option value="">-- Seleccione NRC --</option>';
    
    document.getElementById('block-sec').value = '';
    
    // Resetear a una sola fila de día/módulo
    const container = document.getElementById('day-module-container');
    container.innerHTML = `
        <div class="day-module-row grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
            <select class="block-day w-full border border-slate-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-purple-500 bg-white">
                <option value="lunes">Lunes</option>
                <option value="martes">Martes</option>
                <option value="miercoles">Miércoles</option>
                <option value="jueves">Jueves</option>
                <option value="viernes">Viernes</option>
                <option value="sabado">Sábado</option>
            </select>
            <select class="block-mod w-full border border-slate-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-purple-500 bg-white">
                <option value="1">M1 (08:00 - 09:20)</option>
                <option value="2">M2 (09:30 - 10:50)</option>
                <option value="3">M3 (11:00 - 12:20)</option>
                <option value="4">M4 (12:30 - 13:50)</option>
                <option value="5">M5 (14:00 - 15:20)</option>
                <option value="6">M6 (15:30 - 16:50)</option>
                <option value="7">M7 (17:00 - 18:20)</option>
                <option value="8">M8 (18:30 - 19:50)</option>
            </select>
            <button onclick="removeDayModuleRow(this)" class="text-slate-400 hover:text-red-500 p-1.5 rounded hover:bg-red-50 transition opacity-0 pointer-events-none" title="Eliminar">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>
        </div>
    `;
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

/**
 * Añade una nueva fila de día/módulo en el modal.
 * Permite crear bloques en múltiples horarios simultáneamente.
 * 
 * Efecto:
 * - Crea nueva fila con selectores de día y módulo
 * - Muestra botones de eliminar si hay más de una fila
 * - Refresca iconografía Lucide
 */
function addDayModuleRow() {
    const container = document.getElementById('day-module-container');
    const newRow = document.createElement('div');
    newRow.className = 'day-module-row grid grid-cols-[1fr_1fr_auto] gap-2 items-center';
    newRow.innerHTML = `
        <select class="block-day w-full border border-slate-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-purple-500 bg-white">
            <option value="lunes">Lunes</option>
            <option value="martes">Martes</option>
            <option value="miercoles">Miércoles</option>
            <option value="jueves">Jueves</option>
            <option value="viernes">Viernes</option>
            <option value="sabado">Sábado</option>
        </select>
        <select class="block-mod w-full border border-slate-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-purple-500 bg-white">
            <option value="1">M1 (08:00 - 09:20)</option>
            <option value="2">M2 (09:30 - 10:50)</option>
            <option value="3">M3 (11:00 - 12:20)</option>
            <option value="4">M4 (12:30 - 13:50)</option>
            <option value="5">M5 (14:00 - 15:20)</option>
            <option value="6">M6 (15:30 - 16:50)</option>
            <option value="7">M7 (17:00 - 18:20)</option>
            <option value="8">M8 (18:30 - 19:50)</option>
        </select>
        <button onclick="removeDayModuleRow(this)" class="text-slate-400 hover:text-red-500 p-1.5 rounded hover:bg-red-50 transition" title="Eliminar">
            <i data-lucide="x" class="w-4 h-4"></i>
        </button>
    `;
    container.appendChild(newRow);
    
    // Actualizar botones de eliminar: mostrar solo si hay más de una fila
    updateRemoveButtons();
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

/**
 * Elimina una fila de día/módulo del modal.
 * 
 * @param {HTMLElement} btn - Botón de eliminar clickeado
 * 
 * Protección:
 * - No permite eliminar si solo hay una fila (mínimo 1 horario)
 */
function removeDayModuleRow(btn) {
    const row = btn.closest('.day-module-row');
    const container = document.getElementById('day-module-container');
    
    // No permitir eliminar si solo hay una fila
    if (container.querySelectorAll('.day-module-row').length > 1) {
        row.remove();
        updateRemoveButtons();
    }
}

/**
 * Actualiza la visibilidad de los botones de eliminar fila.
 * 
 * Lógica:
 * - Si hay más de 1 fila: botones visibles
 * - Si hay solo 1 fila: botones ocultos (no se puede eliminar)
 */
function updateRemoveButtons() {
    const container = document.getElementById('day-module-container');
    const rows = container.querySelectorAll('.day-module-row');
    const removeButtons = container.querySelectorAll('.day-module-row button');
    
    removeButtons.forEach(btn => {
        if (rows.length > 1) {
            btn.classList.remove('opacity-0', 'pointer-events-none');
        } else {
            btn.classList.add('opacity-0', 'pointer-events-none');
        }
    });
}

// ===================================
// EDICIÓN DE BLOQUES EXISTENTES
// ===================================

let currentEditBlock = null;  // Almacena datos del bloque siendo editado

/**
 * Abre el modal de edición para un bloque existente.
 * 
 * @param {string} careerCode - Código de la carrera
 * @param {string} malla - Malla curricular
 * @param {number} semestre - Número de semestre
 * @param {string} dia - Día de la semana
 * @param {number} modulo - Número de módulo (1-8)
 * @param {string} nrc - NRC de la asignatura
 * @param {string} seccion - Sección del curso
 * 
 * Busca:
 * - Bloque completo en careerDatabase para obtener todos sus datos
 * 
 * Precarga:
 * - Campos de información (disabled): código materia, n° curso, NRC, sección
 * - Campos editables: día, módulo, tipo
 */
function openEditBlockModal(careerCode, malla, semestre, dia, modulo, nrc, seccion) {
    // Buscar el bloque en la base local para obtener todos sus datos
    let tipo = 'TEO';
    let codigoMateria = '';
    let nCurso = '';
    
    const career = careerDatabase[careerCode];
    if (career && Array.isArray(career.planificacion)) {
        const found = career.planificacion.find(b =>
            b.malla === malla && String(b.semestre) === String(semestre) &&
            b.dia === dia && Number(b.modulo) === Number(modulo) &&
            String(b.nrc) === String(nrc) && b.seccion === seccion
        );
        if (found) {
            tipo = found.tipo || 'TEO';
            codigoMateria = found.codigo_materia || '';
            nCurso = found.n_curso || '';
        }
    }

    currentEditBlock = { careerCode, malla, semestre, dia, modulo, nrc, seccion, tipo };

    // Llenar campos de información (disabled)
    document.getElementById('edit-subject-code').value = codigoMateria;
    document.getElementById('edit-course-number').value = nCurso;
    document.getElementById('edit-nrc').value = nrc;
    document.getElementById('edit-sec').value = seccion;
    
    // Llenar campos editables
    document.getElementById('edit-day').value = dia;
    document.getElementById('edit-mod').value = modulo;
    
    // Set type
    const typeBtn = Array.from(document.querySelectorAll('.edit-type-btn')).find(b => b.innerText.includes(tipo));
    if(typeBtn) {
        selectEditBlockType(tipo, typeBtn);
    } else {
        // Fallback if something is wrong, default to TEO
        const defaultBtn = document.querySelector('.edit-type-btn');
        if(defaultBtn) selectEditBlockType('TEO', defaultBtn);
    }

    document.getElementById('modal-edit-block').classList.remove('hidden');
}

/**
 * Guarda los cambios de un bloque editado.
 * 
 * Permite modificar:
 * - Día de la semana
 * - Módulo horario
 * - Tipo de clase (TEO/LAB/TAL/SIM)
 * 
 * NO modifica:
 * - NRC
 * - Sección
 * - Código de materia
 * - Número de curso
 * 
 * Flujo:
 * 1. Lee nuevos valores del formulario
 * 2. Envía POST a /edit_block con identificadores old/new
 * 3. Actualiza careerDatabase local
 * 4. Rerenderiza grilla y recarga asignaturas
 * 5. Cierra modal
 */
async function saveEditedBlock() {
    if (!currentEditBlock) return;

    const newDay = document.getElementById('edit-day').value;
    const newMod = document.getElementById('edit-mod').value;
    const newType = document.getElementById('edit-block-type').value;

    try {
        const res = await fetch('/edit_block', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                career_code: currentEditBlock.careerCode,
                malla: currentEditBlock.malla,
                semestre: currentEditBlock.semestre,
                old_dia: currentEditBlock.dia,
                old_modulo: currentEditBlock.modulo,
                nrc: currentEditBlock.nrc,
                seccion: currentEditBlock.seccion,
                new_dia: newDay,
                new_modulo: newMod,
                new_tipo: newType
            })
        });
        const json = await res.json();
        if (json.success) {
            careerDatabase = json.data;
            renderCareerGrid();
            if (typeof loadSubjectsFromDatabase === 'function') {
                loadSubjectsFromDatabase();
            }
            document.getElementById('modal-edit-block').classList.add('hidden');
            currentEditBlock = null;
        } else {
            alert('Error: ' + json.error);
        }
    } catch (e) {
        alert('Error de conexión');
    }
}

/**
 * Inicia el proceso de eliminación desde el modal de edición.
 * Delega a promptDeleteBlock usando el índice del bloque actual.
 */
function deleteBlockFromModal() {
    if (!currentEditBlock) return;
    const code = currentEditBlock.careerCode;
    const plan = (careerDatabase[code] && careerDatabase[code].planificacion) || [];
    const matchIndex = plan.findIndex(block =>
        block.malla === currentEditBlock.malla &&
        String(block.semestre) === String(currentEditBlock.semestre) &&
        block.dia === currentEditBlock.dia &&
        Number(block.modulo) === Number(currentEditBlock.modulo) &&
        String(block.nrc) === String(currentEditBlock.nrc) &&
        block.seccion === currentEditBlock.seccion
    );

    if (matchIndex === -1) {
        alert('No se pudo identificar el bloque a eliminar.');
        return;
    }

    promptDeleteBlock(matchIndex, code);
}

// ===================================
// AUTOCOMPLETADO DE NRC (BUSCADOR)
// ===================================

/**
 * Lista de códigos de materia válidos en el sistema.
 * Usados para autocompletado en el formulario de bloques.
 * 
 * Ejemplos:
 * - OBMA: Matemática
 * - ICOM: Computación
 * - INGE: Ingeniería
 * - MEDI: Medicina
 * etc.
 */
const VALID_SUBJECT_CODES = [
    'OBMA', 'MEVE', 'TMED', 'ADPU', 'ICOM', 'ARQT', 'FIAD', 'DERE', 'EDUC', 'PEDI', 
    'ENFE', 'DBIO', 'PSIC', 'QYFA', 'PEEI', 'FORI', 'LCEN', 'CFIN', 'BCSA', 'MEDI', 
    'DMOR', 'FAEG', 'DQUI', 'DSPU', 'DGEE', 'DCEX', 'CIVU', 'FONA', 'TEOC', 'FAOR', 
    'DAEC', 'DAED', 'KINE', 'INGE', 'ICIF', 'ICID', 'FACU', 'NYGA', 'ODON', 'DMAE', 
    'PTAP', 'IGEE', 'ESAP', 'PEMI'
];

/**
 * Muestra el dropdown de códigos de materia.
 * Construye las opciones y lo hace visible.
 */
function showSubjectCodes() {
    const container = document.getElementById('subject-code-options');
    if (container) {
        buildSubjectCodeOptions();
        container.classList.remove('hidden');
    }
}

/**
 * Oculta el dropdown de códigos de materia con delay.
 * Permite hacer clic en opciones antes de que desaparezca.
 */
function hideSubjectCodesDelayed() {
    setTimeout(() => {
        const container = document.getElementById('subject-code-options');
        if (container) container.classList.add('hidden');
    }, 200);
}

/**
 * Construye la lista de opciones de códigos de materia.
 * Crea un elemento clickeable por cada código válido.
 */
function buildSubjectCodeOptions() {
    const container = document.getElementById('subject-code-options');
    if (!container) return;
    
    container.innerHTML = '';
    
    VALID_SUBJECT_CODES.forEach(code => {
        const div = document.createElement('div');
        div.className = "px-3 py-2 hover:bg-purple-50 cursor-pointer text-sm font-mono text-slate-700";
        div.textContent = code;
        div.onclick = () => {
            document.getElementById('block-subject-code').value = code;
            container.classList.add('hidden');
            filterNrcBySubject();
        };
        container.appendChild(div);
    });
}

/**
 * Filtra los códigos de materia según el texto ingresado.
 * 
 * Funcionalidad:
 * - Convierte input a mayúsculas automáticamente
 * - Filtra lista de códigos válidos
 * - Muestra/oculta dropdown según resultados
 * - Dispara filtrado de NRCs cuando cambia el código
 */
function filterSubjectCodes() {
    const input = document.getElementById('block-subject-code');
    const container = document.getElementById('subject-code-options');
    
    if (!input || !container) return;
    
    const query = input.value.toUpperCase();
    input.value = query; // Mantener en mayúsculas
    
    // Si no hay opciones construidas, construirlas
    if (!container.children.length) {
        buildSubjectCodeOptions();
    }
    
    // Filtrar opciones
    let visibleCount = 0;
    Array.from(container.children).forEach(child => {
        const text = child.textContent.toUpperCase();
        if (text.includes(query)) {
            child.classList.remove('hidden');
            visibleCount++;
        } else {
            child.classList.add('hidden');
        }
    });
    
    // Mostrar u ocultar el contenedor según si hay resultados
    if (visibleCount > 0 && query.length > 0) {
        container.classList.remove('hidden');
    } else {
        container.classList.add('hidden');
    }
    
    // Actualizar NRC cuando cambia el código de materia
    filterNrcBySubject();
}

/**
 * Filtra los NRCs disponibles según código de materia y número de curso.
 * 
 * Lógica:
 * 1. Si no hay código + curso: muestra input libre
 * 2. Si no hay datos en globalGroupsData: muestra input libre
 * 3. Si hay coincidencias: crea select con opciones filtradas
 * 4. Si no hay coincidencias: muestra input libre
 * 
 * Fuente de datos:
 * - window.globalGroupsData: Array con datos del Excel de grupos
 * 
 * Efecto UI:
 * - Alterna entre input libre (block-nrc-input) y select (block-nrc-select)
 * - Autocompleta sección al seleccionar NRC
 */
function filterNrcBySubject() {
    const subjectCode = document.getElementById('block-subject-code').value.trim().toUpperCase();
    const courseNumber = document.getElementById('block-course-number').value.trim();
    const nrcInput = document.getElementById('block-nrc-input');
    const nrcSelect = document.getElementById('block-nrc-select');
    
    if (!nrcInput || !nrcSelect) return;
    
    // Si no hay código de materia Y número de curso, mostrar input libre
    if (!subjectCode || !courseNumber) {
        nrcInput.classList.remove('hidden');
        nrcSelect.classList.add('hidden');
        return;
    }
    
    // Buscar en globalGroupsData (datos del Excel de grupos)
    if (!window.globalGroupsData || !Array.isArray(window.globalGroupsData)) {
        // Si no hay datos, dejar input libre
        nrcInput.classList.remove('hidden');
        nrcSelect.classList.add('hidden');
        return;
    }
    
    // Filtrar por codigo_materia y n_curso
    const filtered = window.globalGroupsData.filter(item => 
        item.codigo_materia === subjectCode && item.n_curso === courseNumber
    );
    
    if (filtered.length === 0) {
        // Si no hay coincidencias, dejar input libre
        nrcInput.classList.remove('hidden');
        nrcSelect.classList.add('hidden');
        return;
    }
    
    // Hay coincidencias: mostrar select y ocultar input
    nrcInput.classList.add('hidden');
    nrcSelect.classList.remove('hidden');
    
    // Limpiar selector
    nrcSelect.innerHTML = '<option value="">-- Seleccione NRC --</option>';
    document.getElementById('block-sec').value = '';
    
    // Extraer NRC y secciones únicas
    const nrcMap = new Map();
    filtered.forEach(item => {
        const key = `${item.nrc}-${item.seccion}`;
        if (!nrcMap.has(key)) {
            nrcMap.set(key, {
                nrc: item.nrc,
                seccion: item.seccion,
                materia: item.materia
            });
        }
    });
    
    // Ordenar y agregar opciones
    const sorted = Array.from(nrcMap.values()).sort((a, b) => {
        if (a.nrc !== b.nrc) return a.nrc.localeCompare(b.nrc);
        return a.seccion.localeCompare(b.seccion);
    });
    
    sorted.forEach(item => {
        const option = document.createElement('option');
        option.value = JSON.stringify({ nrc: item.nrc, seccion: item.seccion });
        option.textContent = `${item.nrc} - ${item.seccion}`;
        nrcSelect.appendChild(option);
    });
}

/**
 * Manejador para input libre de NRC.
 * Permite escritura libre sin restricciones.
 */
function handleNrcInput() {
    // Esta función se llama cuando el usuario escribe en el campo NRC libre
    // No hace nada especial, solo permite escritura libre
}

/**
 * Actualiza el campo de sección según el NRC seleccionado.
 * Lee el valor JSON del select y extrae la sección.
 */
function updateSectionFromNrc() {
    const nrcSelect = document.getElementById('block-nrc-select');
    const secInput = document.getElementById('block-sec');
    
    if (!nrcSelect || !secInput) return;
    
    const selectedValue = nrcSelect.value;
    if (!selectedValue) {
        secInput.value = '';
        return;
    }
    
    try {
        const data = JSON.parse(selectedValue);
        secInput.value = data.seccion;
    } catch(e) {
        console.error('Error parsing NRC data:', e);
    }
}

// ===================================
// ELIMINACIÓN DE BLOQUES
// ===================================

let blockIndexToDelete = null;  // Índice del bloque a eliminar
let blockCareerForDeletion = null;  // Código de carrera del bloque

/**
 * Abre el modal de confirmación para eliminar un bloque.
 * 
 * @param {number} index - Índice del bloque en el array de planificación
 * @param {string} careerCode - Código de la carrera (opcional, se infiere del selector)
 * 
 * Seguridad:
 * - Requiere confirmación explícita del usuario
 * - Almacena temporalmente índice y código de carrera
 */
function promptDeleteBlock(index, careerCode = null) {
    blockIndexToDelete = index;
    const selector = document.getElementById('schedule-career-selector');
    blockCareerForDeletion = careerCode || (selector ? selector.value : null);

    const modal = document.getElementById('modal-confirm-delete-block');
    if(modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

/**
 * Ejecuta la eliminación del bloque pendiente.
 * 
 * Flujo:
 * 1. Envía POST a /delete_planning_block con índice del bloque
 * 2. Actualiza careerDatabase local
 * 3. Rerenderiza grilla
 * 4. Recarga asignaturas (actualiza subjects.js)
 * 5. Cierra modales de confirmación y edición
 * 6. Limpia variables temporales
 * 
 * ADVERTENCIA: Eliminación permanente sin deshacer
 */
async function confirmPlanningBlockDelete() {
    const targetCareer = blockCareerForDeletion;

    if (blockIndexToDelete === null || !targetCareer) {
        alert('Selecciona un bloque válido para eliminar.');
        return;
    }

    try {
        const res = await fetch('/delete_planning_block', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
                career_code: targetCareer,
                block_index: blockIndexToDelete
            })
        });
        const json = await res.json();

        if(json.success) {
            careerDatabase = json.data;
            renderCareerGrid();
            if (typeof loadSubjectsFromDatabase === 'function') {
                loadSubjectsFromDatabase();
            }
            const confirmModal = document.getElementById('modal-confirm-delete-block');
            if(confirmModal) {
                confirmModal.classList.add('hidden');
                confirmModal.classList.remove('flex');
            }
            const editModal = document.getElementById('modal-edit-block');
            if(editModal) {
                editModal.classList.add('hidden');
            }
            blockIndexToDelete = null;
            blockCareerForDeletion = null;
            currentEditBlock = null;
        } else {
            alert("Error: " + json.error);
        }
    } catch(e) {
        alert("Error de conexión");
    }
}

/**
 * Manejador para cambios en los selectores de la vista planificador.
 * Actualiza el estado del botón de añadir y rerenderiza la grilla.
 */
function handleScheduleSelectorChange() {
    updateAddButtonState();
    renderCareerGrid();
}

// ===================================
// GESTIÓN DE MALLAS CURRICULARES
// ===================================

/**
 * Renderiza checkboxes para las mallas curriculares de una carrera.
 * 
 * @param {string} containerId - ID del contenedor HTML
 * @param {Array<string>} selectedMeshes - Array con años de mallas activas
 * 
 * Características:
 * - Ordena mallas de mayor a menor (más reciente primero)
 * - Todas vienen marcadas por defecto
 * - Muestra mensaje si no hay mallas configuradas
 */
function renderMeshCheckboxes(containerId, selectedMeshes = []) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    // Si no hay mallas seleccionadas, mostrar mensaje
    if (selectedMeshes.length === 0) {
        container.innerHTML = '<p class="text-xs text-slate-400 italic p-2">No hay mallas configuradas. Use el botón "Agregar nueva malla" para comenzar.</p>';
        return;
    }
    
    // Ordenar mallas de mayor a menor
    const sortedMeshes = [...selectedMeshes].sort((a, b) => b - a);
    
    sortedMeshes.forEach(mesh => {
        const checkboxId = `mesh-${containerId}-${mesh}`;
        
        const label = document.createElement('label');
        label.className = 'flex items-center gap-2 cursor-pointer hover:bg-purple-50 p-2 rounded transition';
        label.innerHTML = `
            <input type="checkbox" id="${checkboxId}" value="${mesh}" checked 
                   class="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500">
            <span class="text-sm text-slate-700">${mesh}</span>
        `;
        container.appendChild(label);
    });
    
    // Re-inicializar iconos de Lucide si es necesario
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

/**
 * Obtiene las mallas curriculares seleccionadas de un contenedor.
 * 
 * @param {string} containerId - ID del contenedor con checkboxes
 * @returns {Array<string>} - Array con años de mallas marcadas, ordenados
 */
function getSelectedMeshes(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return [];
    
    const checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value).sort((a, b) => b - a);
}

let currentMeshContainer = null;  // Almacena a qué contenedor agregar la nueva malla

/**
 * Abre el modal para agregar una nueva malla curricular.
 * Se usa desde el modal de crear carrera.
 */
function addNewMesh() {
    currentMeshContainer = 'cfg-meshes-container';
    document.getElementById('modal-add-mesh').classList.remove('hidden');
    document.getElementById('new-mesh-year').value = '';
    document.getElementById('new-mesh-year').focus();
}

/**
 * Similar a addNewMesh pero se usa desde el modal de editar carrera.
 */
function addNewMeshToEdit() {
    currentMeshContainer = 'edit-meshes-container';
    document.getElementById('modal-add-mesh').classList.remove('hidden');
    document.getElementById('new-mesh-year').value = '';
    document.getElementById('new-mesh-year').focus();
}

/**
 * Cierra el modal de añadir malla y limpia el estado.
 */
function closeMeshModal() {
    document.getElementById('modal-add-mesh').classList.add('hidden');
    currentMeshContainer = null;
}

/**
 * Confirma y añade una nueva malla curricular al listado.
 * 
 * Validaciones:
 * - Año debe ser numérico
 * - No puede duplicar mallas existentes
 * 
 * Efecto:
 * - Crea checkbox marcado con el nuevo año
 * - Elimina mensaje de "no hay mallas" si existe
 * - Inserta al inicio de la lista (más reciente primero)
 */
function confirmAddMesh() {
    const newMesh = document.getElementById('new-mesh-year').value.trim();
    
    if (!newMesh || isNaN(newMesh)) {
        alert("Debe ingresar un año válido");
        return;
    }
    
    if (!currentMeshContainer) {
        alert("Error: No se especificó el contenedor");
        return;
    }
    
    const container = document.getElementById(currentMeshContainer);
    const existingCheckbox = container.querySelector(`input[value="${newMesh}"]`);
    
    if (existingCheckbox) {
        alert("Esta malla ya existe");
        existingCheckbox.checked = true;
        closeMeshModal();
        return;
    }
    
    // Agregar la nueva malla
    const checkboxId = `mesh-${currentMeshContainer}-${newMesh}`;
    const label = document.createElement('label');
    label.className = 'flex items-center gap-2 cursor-pointer hover:bg-purple-50 p-2 rounded transition';
    label.innerHTML = `
        <input type="checkbox" id="${checkboxId}" value="${newMesh}" checked 
               class="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500">
        <span class="text-sm text-slate-700">${newMesh}</span>
    `;
    
    // Limpiar mensaje de "No hay mallas" si existe
    const noMeshesMsg = container.querySelector('p.italic');
    if (noMeshesMsg) {
        container.innerHTML = '';
    }
    
    container.prepend(label);
    closeMeshModal();
}