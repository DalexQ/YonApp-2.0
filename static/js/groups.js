/**
 * groups.js - Módulo de Generador de Bloques para Primer Año
 * ===========================================================
 * 
 * Estado: NO FUNCIONAL 🔴 (EXPERIMENTAL)
 * 
 * ADVERTENCIA CRÍTICA:
 * Este módulo intenta automatizar la generación de bloques de estudiantes
 * de primer año, pero NO refleja el proceso real de registro académico.
 * 
 * Problemas identificados:
 * - Requiere múltiples iteraciones con ajustes manuales
 * - No considera restricciones de capacidad de salas
 * - No maneja conflictos de horario complejos
 * - No integra requisitos de prerrequisitos
 * - Falta validación de disponibilidad docente
 * 
 * RECOMENDACIÓN: NO usar en producción sin revisión completa del algoritmo
 * y validación con el departamento de registro académico.
 * 
 * Ver README.md sección "Limitaciones Actuales" para más detalles.
 * 
 * Funcionalidades implementadas:
 * - Carga de Excel con datos de bloques de primer año
 * - Selector de carreras filtrado por NI (Nuevo Ingreso)
 * - Generación experimental de agrupaciones
 * - Vista de horarios generados
 * - Exportación de resultados (sin validar)
 * 
 * Variables globales:
 * - globalGroupsData: Datos cargados desde el Excel de bloques
 * - globalBuiltGroups: Grupos generados (array de objetos)
 * - savedGroupNames: Nombres personalizados por carrera
 * 
 * Dependencias:
 * - toggleLoading(): Indicador de carga (main.js, opcional)
 * - Lucide Icons: Iconografía
 */

// ===================================
// VARIABLES GLOBALES DEL MÓDULO
// ===================================
let globalGroupsData = null;  // Datos del Excel procesado por backend
let globalBuiltGroups = [];  // Grupos de estudiantes generados
let savedGroupNames = {};  // Almacena nombres por carrera: { "Carrera": ["Nombre1", ...] }

/**
 * Manejador del evento change del input de archivo.
 * Actualiza el estado del botón de subida según haya archivo seleccionado.
 * 
 * @param {Event} e - Evento change del input file
 * 
 * Estados:
 * - Con archivo: Botón activo (bg-purple-600)
 * - Sin archivo: Botón desactivado (bg-purple-200)
 */
function onGroupsFileChange(e) {
    const fileInput = e.target;
    const btn = document.getElementById('groups-upload-submit');
    const label = document.getElementById('groups-file-name');
    if (!btn) return;

    if (fileInput && fileInput.files && fileInput.files.length > 0) {
        // Archivo seleccionado: activar botón y darle más saturación
        btn.disabled = false;
        btn.classList.remove('bg-purple-200', 'text-purple-700');
        btn.classList.add('bg-purple-600', 'text-white');

        if (label) {
            label.textContent = fileInput.files[0].name;
        }
    } else {
        // Sin archivo: desactivar y mostrarlo apagado
        btn.disabled = true;
        btn.classList.remove('bg-purple-600', 'text-white');
        btn.classList.add('bg-purple-200', 'text-purple-700');

        if (label) {
            label.textContent = 'Arrastra y suelta o haz clic';
        }
    }
}

/**
 * Inicializa la vista del generador de bloques.
 * Se ejecuta al cambiar a la pestaña de bloques.
 * 
 * Flujo:
 * 1. Verifica si ya hay datos cargados
 * 2. Si no hay datos, intenta cargar Excel desde formulario
 * 3. Envía POST a /groups/upload con el archivo
 * 4. Procesa respuesta y llena selector de carreras
 * 
 * ADVERTENCIA: El Excel debe tener estructura específica con columnas:
 * - ni_an: Indicador de Nuevo Ingreso (NI/AN)
 * - carrera: Nombre de la carrera
 * - Otros campos de bloques horarios
 */
async function initGroupsView() {
    console.log("--- Iniciando Vista de Bloques (1° Año) ---");

    const selector = document.getElementById('groups-career-selector');
    if (!selector) return;

    // Si ya tenemos datos cargados anteriormente, solo regenerar el selector
    if (globalGroupsData && Array.isArray(globalGroupsData.schedule_ni)) {
        populateCareerSelector(globalGroupsData.schedule_ni);
        return;
    }

    // Solicitar Excel específico para bloques 1° año
    // Se asume que el usuario ya subió un Excel a través de un formulario
    // con id="groups-upload-form" y un input type="file" con name="file".
    const form = document.getElementById('groups-upload-form');
    if (!form) {
        console.warn('No se encontró el formulario de subida para bloques (groups-upload-form).');
        selector.innerHTML = '<option value="">-- Configurar subida de Excel para Bloques --</option>';
        return;
    }

    const fileInput = form.querySelector('input[type="file"][name="file"]');
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        selector.innerHTML = '<option value="">-- Selecciona y sube un Excel de 1° Año --</option>';
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    if (typeof toggleLoading === 'function') toggleLoading(true);

    try {
        const resp = await fetch('/groups/upload', {
            method: 'POST',
            body: formData
        });
        const json = await resp.json();
        if (typeof toggleLoading === 'function') toggleLoading(false);
        if (!json.success) {
            console.error('Error al procesar Excel de bloques:', json.error);
            selector.innerHTML = '<option value="">-- Error al procesar Excel --</option>';
            return;
        }

        globalGroupsData = json.data;
        if (!globalGroupsData || !Array.isArray(globalGroupsData.schedule_ni)) {
            selector.innerHTML = '<option value="">-- No se encontraron datos NI --</option>';
            return;
        }

        populateCareerSelector(globalGroupsData.schedule_ni);
    } catch (err) {
        if (typeof toggleLoading === 'function') toggleLoading(false);
        console.error('Error de red al subir Excel de bloques:', err);
        selector.innerHTML = '<option value="">-- Error de red al subir Excel --</option>';
    }
}

/**
 * Llena el selector de carreras con las que tienen bloques NI.
 * 
 * @param {Array} scheduleNi - Array de bloques del Excel procesado
 * 
 * Filtrado:
 * - Solo bloques con ni_an === 'NI'
 * - Solo carreras con al menos un bloque NI
 * - Carreras únicas ordenadas alfabéticamente
 * 
 * Estado visual:
 * - Con datos: selector activo con estilo púrpura
 * - Sin datos: selector deshabilitado con mensaje
 */
function populateCareerSelector(scheduleNi) {
    const selector = document.getElementById('groups-career-selector');
    if (!selector) return;

    const carrerasSet = new Set();
    scheduleNi.forEach(item => {
        const niVal = (item.ni_an || "").toString().toUpperCase().trim();
        const carreraVal = (item.carrera || "").toString().trim();
        if (niVal === 'NI' && carreraVal) {
            carrerasSet.add(carreraVal);
        }
    });

    if (carrerasSet.size === 0) {
        selector.innerHTML = '<option value="">-- No se encontraron carreras NI --</option>';
        selector.disabled = true;
        selector.className = 'p-2 border rounded-lg text-sm font-bold outline-none w-64 bg-slate-100 text-slate-400';
        return;
    }

    // Activar selector y darle un estilo más notorio al tener datos
    selector.disabled = false;
    selector.className = 'p-2 border rounded-lg text-sm font-bold outline-none w-64 bg-purple-50 text-purple-700 border-purple-200';

    selector.innerHTML = '<option value="">-- Seleccionar Carrera --</option>';

    Array.from(carrerasSet).sort().forEach(carrera => {
        const opt = document.createElement('option');
        opt.value = carrera;
        opt.innerText = carrera;
        selector.appendChild(opt);
    });
}

/**
 * Genera los bloques de estudiantes para una carrera seleccionada.
 * 
 * ADVERTENCIA: Este algoritmo es EXPERIMENTAL y NO debe usarse en producción.
 * 
 * Proceso:
 * 1. Filtra bloques de la carrera con NI
 * 2. Identifica asignaturas únicas
 * 3. Agrupa bloques por asignatura
 * 4. Genera combinaciones de bloques compatibles (sin conflictos horarios)
 * 5. Renderiza tarjetas con los grupos generados
 * 
 * Limitaciones conocidas:
 * - No considera capacidad máxima de salas
 * - Puede generar grupos con conflictos no detectados
 * - No valida disponibilidad de docentes
 * - Algoritmo greedy sin optimización global
 */
function generateStudentGroups() {
    const career = document.getElementById('groups-career-selector').value;
    const container = document.getElementById('groups-container');
    const empty = document.getElementById('groups-empty-state');

    if (!career || !globalGroupsData || !Array.isArray(globalGroupsData.schedule_ni)) {
        container.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }

    empty.classList.add('hidden');
    container.innerHTML = '';

    // 1. Filtrar datos base: Solo esa carrera y solo Nuevo Ingreso (NI)
    const rawBlocks = globalGroupsData.schedule_ni.filter(b => 
        b.carrera === career && (b.ni_an || "").toString().toUpperCase().trim() === 'NI'
    );

    console.log(`Bloques para ${career} (Solo NI):`, rawBlocks.length);

    if (rawBlocks.length === 0) {
        container.innerHTML = `<div class="p-8 text-slate-500">No se encontraron asignaturas de primer año (ni) para ${career}.</div>`;
        return;
    }
    // 2. Construir bloques de alumnos basados en vacantes y choques de horario
    const builtGroups = buildGroupsForCareer(rawBlocks);

    globalBuiltGroups = builtGroups;

    if (builtGroups.length === 0) {
        container.innerHTML = `<div class="p-8 text-slate-500">No fue posible construir bloques para ${career}.</div>`;
        return;
    }

    // 3. Renderizar bloques construidos
    builtGroups.forEach((group, idx) => {
        const groupBlocks = group.blocks;
        const groupSize = group.size;

        // Cargar nombre guardado si existe
        const savedName = savedGroupNames[career] && savedGroupNames[career][idx] 
            ? savedGroupNames[career][idx] 
            : `Bloque ${idx + 1}`;
        group.name = savedName;

        const dayOrder = {"lunes":1, "martes":2, "miercoles":3, "jueves":4, "viernes":5, "sabado":6};
        groupBlocks.sort((a, b) => {
            if(dayOrder[a.dia_norm] !== dayOrder[b.dia_norm]) return dayOrder[a.dia_norm] - dayOrder[b.dia_norm];
            return a.modulo - b.modulo;
        });

        const colDiv = document.createElement('div');
        colDiv.className = "w-80 flex-shrink-0 flex flex-col bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow";

        let blocksHtml = '';
        groupBlocks.forEach(b => {
            let colorClass = "border-blue-500 bg-blue-50 text-blue-800"; // TEO
            const tipoUpper = (b.tipo || '').toString().toUpperCase();
            if (tipoUpper.includes("LAB")) colorClass = "border-orange-500 bg-orange-50 text-orange-800";
            if (tipoUpper.includes("TAL")) colorClass = "border-green-500 bg-green-50 text-green-800";
            if (tipoUpper.includes("SIM")) colorClass = "border-purple-500 bg-purple-50 text-purple-800";

            blocksHtml += `
                <div class="mb-2 p-3 border-l-4 ${colorClass} rounded relative group">
                    <div class="flex justify-between items-start mb-2">
                        <div class="font-bold text-lg leading-tight">
                            NRC ${b.nrc} - ${b.seccion || 'S/N'}
                        </div>
                        <span class="bg-white/60 px-2 py-0.5 rounded text-xs font-semibold">${b.tipo}</span>
                    </div>
                    <div class="text-xs opacity-80 mb-2 leading-snug">${b.materia}</div>
                    <div class="flex justify-between opacity-70 text-[10px]">
                        <span class="font-medium">${b.dia_norm.toUpperCase().substring(0,3)} ${b.horario_texto}</span>
                        <span>Sala: ${b.ubicacion || 'Sin definir'}</span>
                    </div>
                </div>
            `;
        });

        colDiv.innerHTML = `
            <div class="bg-slate-800 text-white p-4 border-b border-slate-700 cursor-pointer hover:bg-slate-900/90" onclick="showGroupTimetable(${idx})">
                <div class="flex justify-between items-center">
                    <span 
                        id="group-name-${idx}" 
                        contenteditable="true" 
                        class="font-bold text-lg outline-none focus:bg-slate-700 px-2 py-1 rounded cursor-text"
                        onblur="saveGroupName(${idx}, this.innerText)"
                        onclick="event.stopPropagation()"
                        onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur();}"
                    >${group.name || `Bloque ${idx + 1}`}</span>
                    <span class="bg-green-600 text-xs px-2 py-1 rounded-full font-bold">${groupSize} Cupos</span>
                </div>
                <p class="text-xs text-slate-400 mt-1">1er Año - Nuevo Ingreso</p>
            </div>
            <div class="p-3 overflow-y-auto flex-1 bg-slate-50 h-[500px]">
                ${blocksHtml || '<p class="text-center text-slate-400 mt-4">Sin asignaturas</p>'}
            </div>
        `;

        container.appendChild(colDiv);
    });
}

/**
 * Construye bloques de estudiantes para una carrera.
 * 
 * ADVERTENCIA CRÍTICA: Este algoritmo es una simplificación que NO refleja
 * el proceso real de registro académico.
 * 
 * Lógica:
 * 1. Identifica materias únicas y sus tipos (TEO/LAB/TAL/SIM)
 * 2. Para cada bloque:
 *    - Toma una sección de cada materia-tipo sin conflictos horarios
 *    - Tamaño del bloque = mínimo de vacantes entre secciones
 * 3. Descuenta vacantes usadas y repite hasta agotar
 * 
 * Algoritmo greedy:
 * - No optimiza asignación global
 * - Puede dejar secciones sin uso óptimo
 * - No considera preferencias de estudiantes
 * 
 * @param {Array} blocks - Array de bloques horarios de la carrera
 * @returns {Array} - Array de objetos {size, blocks, name}
 */
function buildGroupsForCareer(blocks) {
    if (!blocks || blocks.length === 0) return [];

    console.log('=== Iniciando construcción de bloques ===');
    console.log('Total de bloques disponibles:', blocks.length);

    // Copia mutable de todas las secciones con sus vacantes
    const allSections = blocks.map(b => ({
        ref: b,
        vac: b.vacantes || 0,
        nrc: b.nrc,
        seccion: b.seccion,
        materia: b.materia,
        tipo: (b.tipo || b.componente || '').toString().toUpperCase().trim(),
        dia_norm: b.dia_norm,
        horario_texto: b.horario_texto
    }));

    console.log('Todas las secciones con vacantes:');
    allSections.forEach(s => {
        console.log(`  NRC ${s.nrc} - ${s.materia} [${s.tipo}] - ${s.vac} vacantes`);
    });

    // Identificar todas las combinaciones únicas de materia + tipo
    // Cada combinación representa una "asignatura" que el estudiante debe tomar
    const uniqueSubjectTypes = [];
    const seenKeys = new Set();
    
    allSections.forEach(s => {
        const key = `${s.materia}|||${s.tipo}`;
        if (!seenKeys.has(key)) {
            seenKeys.add(key);
            uniqueSubjectTypes.push({ materia: s.materia, tipo: s.tipo });
        }
    });
    
    console.log(`Combinaciones materia-tipo encontradas: ${uniqueSubjectTypes.length}`);
    uniqueSubjectTypes.forEach(st => {
        const sectionsCount = allSections.filter(s => s.materia === st.materia && s.tipo === st.tipo).length;
        console.log(`  - ${st.materia} [${st.tipo}]: ${sectionsCount} secciones disponibles`);
    });

    // Verificar si dos secciones chocan en horario (mismo día y módulo)
    // Solo es conflicto si son de DIFERENTE materia o DIFERENTE tipo
    function hasTimeConflict(section1, section2) {
        // Si son la misma materia, NO hay conflicto (pueden tener horarios iguales)
        // Por ejemplo: COMUNICACION EFECTIVA [TEO] y COMUNICACION EFECTIVA [TAL]
        // pueden estar al mismo tiempo porque son tipos diferentes de la misma materia
        if (section1.materia === section2.materia) return false;
        
        // Si son materias diferentes, verificar si chocan en día y módulo
        if (section1.dia_norm !== section2.dia_norm) return false;
        const mod1 = getModuleFromTimeRange(section1.horario_texto);
        const mod2 = getModuleFromTimeRange(section2.horario_texto);
        return mod1 === mod2 && mod1 !== null;
    }

    // Obtener la mejor sección disponible (con más vacantes) de una materia-tipo que no choque
    function getBestAvailableSection(materia, tipo, currentBlocks) {
        console.log(`    Buscando ${materia} [${tipo}]...`);
        
        // Primero ver todas las secciones de esta materia-tipo
        const allMatchingSections = allSections.filter(s => 
            s.materia === materia && 
            s.tipo === tipo
        );
        console.log(`      Total secciones de esta materia-tipo: ${allMatchingSections.length}`);
        allMatchingSections.forEach(s => {
            console.log(`        NRC ${s.nrc} - Vacantes: ${s.vac}`);
        });
        
        const candidates = allSections.filter(s => 
            s.materia === materia && 
            s.tipo === tipo && 
            s.vac > 0
        );

        console.log(`      Candidatos con vacantes > 0: ${candidates.length}`);
        candidates.forEach(c => {
            console.log(`        NRC ${c.nrc} - ${c.vac} vacantes`);
        });

        // Filtrar las que no chocan con bloques de OTRAS materias ya asignados
        const validCandidates = candidates.filter(candidate => {
            const conflicts = currentBlocks.filter(block => hasTimeConflict(candidate, block));
            if (conflicts.length > 0) {
                console.log(`        NRC ${candidate.nrc} choca con: ${conflicts.map(c => `${c.materia} [${c.tipo}] NRC ${c.nrc}`).join(', ')}`);
            }
            return conflicts.length === 0;
        });

        console.log(`      Candidatos válidos sin choques: ${validCandidates.length}`);
        validCandidates.forEach(v => {
            console.log(`        NRC ${v.nrc} - ${v.vac} vacantes - VÁLIDO`);
        });

        if (validCandidates.length === 0) return null;

        // Retornar la sección con MÁS vacantes disponibles
        validCandidates.sort((a, b) => b.vac - a.vac);
        return validCandidates[0];
    }

    const groups = [];
    let iteration = 0;
    const MAX_ITERATIONS = 100;

    while (iteration < MAX_ITERATIONS) {
        iteration++;
        const groupBlocks = [];
        const groupSizeCandidates = [];

        // Intentar asignar una sección de cada materia-tipo al grupo
        for (const subjectType of uniqueSubjectTypes) {
            const bestSection = getBestAvailableSection(
                subjectType.materia, 
                subjectType.tipo, 
                groupBlocks
            );

            if (!bestSection) {
                // No hay secciones disponibles sin choques para esta materia-tipo
                console.log(`Iteración ${iteration}: No hay secciones disponibles para ${subjectType.materia} [${subjectType.tipo}]`);
                groupBlocks.length = 0;
                break;
            }

            groupBlocks.push(bestSection);
            groupSizeCandidates.push(bestSection.vac);
        }

        // Si no pudimos asignar todas las materias-tipo, terminamos
        if (groupBlocks.length !== uniqueSubjectTypes.length || groupSizeCandidates.length === 0) {
            console.log(`Iteración ${iteration}: No se pudo formar un bloque completo. Terminando.`);
            break;
        }

        // El tamaño del bloque es el MÍNIMO de vacantes entre todas las secciones
        console.log(`\n--- Calculando tamaño de Bloque ${groups.length + 1} ---`);
        console.log(`Vacantes candidatas: [${groupSizeCandidates.join(', ')}]`);
        const groupSize = Math.min(...groupSizeCandidates);
        console.log(`Mínimo calculado: ${groupSize}`);
        
        if (groupSize <= 0) {
            console.log(`Iteración ${iteration}: Tamaño de bloque es 0 o negativo. Terminando.`);
            break;
        }

        console.log(`\n--- Bloque ${groups.length + 1}: ${groupSize} cupos ---`);
        groupBlocks.forEach(s => {
            console.log(`  NRC ${s.nrc} - ${s.materia} [${s.tipo}] Secc ${s.seccion} - ${s.vac} vacantes -> quedarán ${s.vac - groupSize}`);
        });

        // Restar las vacantes usadas de todas las secciones asignadas al bloque
        groupBlocks.forEach(section => {
            section.vac -= groupSize;
        });

        // Guardar el bloque
        groups.push({
            size: groupSize,
            blocks: groupBlocks.map(s => s.ref),
            name: `Bloque ${groups.length + 1}`
        });
    }

    console.log(`\n=== Total de bloques generados: ${groups.length} ===\n`);
    return groups;
}

/**
 * Convierte un rango horario (ej: "08:00-09:20") a número de módulo (1-8).
 * 
 * @param {string} rangeStr - Rango horario en formato "HH:MM-HH:MM" o "HMM-HMM"
 * @returns {number|null} - Número de módulo o null si no se puede determinar
 * 
 * Mapeo:
 * - 08:00 → M1
 * - 09:30 → M2
 * - 11:00 → M3
 * - 12:30 → M4
 * - 14:00 → M5
 * - 15:30 → M6
 * - 17:00 → M7
 * - 18:30 → M8
 */
function getModuleFromTimeRange(rangeStr) {
    if (!rangeStr) return null;
    const parts = rangeStr.split('-');
    if (parts.length < 2) return null;
    let start = parts[0].trim();

    // Normalizar formato sin dos puntos: "800" -> "08:00"
    if (!start.includes(':')) {
        if (start.length === 3) {
            start = '0' + start[0] + ':' + start.substring(1);
        } else if (start.length === 4) {
            start = start.substring(0, 2) + ':' + start.substring(2);
        }
    }

    // Mapeo simple por hora de inicio
    if (start === "08:00") return 1;
    if (start === "09:30") return 2;
    if (start === "11:00") return 3;
    if (start === "12:30") return 4;
    if (start === "14:00") return 5;
    if (start === "15:30") return 6;
    if (start === "17:00") return 7;
    if (start === "18:30") return 8;

    return null;
}

/**
 * Muestra el horario escolar de un grupo en un modal.
 * 
 * @param {number} groupIndex - Índice del grupo en globalBuiltGroups
 * 
 * Estructura:
 * - Título con nombre del bloque y carrera
 * - Grilla 8x6 (módulos x días)
 * - Bloques coloreados por tipo
 * - Información de sala y docente (si disponible)
 */
function showGroupTimetable(groupIndex) {
    if (!globalBuiltGroups || !globalBuiltGroups[groupIndex]) return;

    const group = globalBuiltGroups[groupIndex];
    const blocks = group.blocks || [];
    const modal = document.getElementById('modal-group-timetable');
    const titleEl = document.getElementById('group-timetable-title');
    const subtitleEl = document.getElementById('group-timetable-subtitle');
    const gridBody = document.getElementById('group-timetable-grid');
    const careerSelector = document.getElementById('groups-career-selector');

    if (!modal || !gridBody) return;

    const careerName = careerSelector ? careerSelector.value : '';
    titleEl.textContent = `Horario ${group.name || `Bloque ${groupIndex + 1}`}`;
    subtitleEl.textContent = careerName ? `Carrera: ${careerName}` : '';

    // Debug: ver qué bloques tenemos
    console.log('Mostrando horario para bloque', groupIndex, 'con', blocks.length, 'bloques:');
    blocks.forEach(b => {
        console.log('  -', b.materia, '|', b.dia_norm, '|', b.horario_texto, '| NRC:', b.nrc);
    });

    // Definir módulos y días
    const times = [
        "08:00 - 09:20", "09:30 - 10:50", "11:00 - 12:20", "12:30 - 13:50",
        "14:00 - 15:20", "15:30 - 16:50", "17:00 - 18:20", "18:30 - 19:50"
    ];
    const days = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado"]; 

    // Limpiar grilla
    gridBody.innerHTML = '';

    // Construir filas
    for (let i = 1; i <= 8; i++) {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-200 hover:bg-slate-50 transition';

        const modTd = document.createElement('td');
        modTd.className = 'p-1 border-r border-slate-200 bg-slate-50 text-center w-20 h-12';
        modTd.innerHTML = `
            <span class="block font-bold text-[11px] text-blue-900">Módulo ${i}</span>
            <span class="text-[9px] text-slate-500 whitespace-nowrap">${times[i-1]}</span>
        `;
        tr.appendChild(modTd);

        days.forEach(day => {
            const td = document.createElement('td');
            td.className = 'p-1 border-r border-slate-200 align-top h-12 w-28 text-[10px]';

            const blocksHere = blocks.filter(b => {
                if (b.dia_norm !== day) return false;
                const mod = getModuleFromTimeRange((b.horario_texto || '').trim());
                return mod === i;
            });
            if (blocksHere.length > 0) {
                const b = blocksHere[0];

                let colorClass = 'bg-blue-100 border-blue-600 text-blue-900';
                const tipoUpper = (b.tipo || '').toString().toUpperCase();
                if (tipoUpper.includes('LAB')) colorClass = 'bg-orange-100 border-orange-600 text-orange-900';
                if (tipoUpper.includes('TAL')) colorClass = 'bg-green-100 border-green-600 text-green-900';
                if (tipoUpper.includes('SIM')) colorClass = 'bg-purple-100 border-purple-600 text-purple-900';

                td.innerHTML = `
                    <div class="${colorClass} border-l-4 p-1.5 rounded text-[10px] shadow-sm h-full overflow-hidden flex items-center justify-center text-center" title="${b.materia}">
                        <div class="font-bold leading-tight">
                            NRC ${b.nrc} – ${b.seccion || ''}
                        </div>
                    </div>
                `;
            }

            tr.appendChild(td);
        });

        gridBody.appendChild(tr);
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

/**
 * Cierra el modal del horario de grupo.
 */
function closeGroupTimetableModal() {
    const modal = document.getElementById('modal-group-timetable');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

/**
 * Guarda el nombre personalizado de un grupo.
 * Almacena en savedGroupNames por carrera y índice de grupo.
 * 
 * @param {number} groupIndex - Índice del grupo en globalBuiltGroups
 * @param {string} newName - Nuevo nombre ingresado por el usuario
 * 
 * Persistencia:
 * - Actualiza globalBuiltGroups[groupIndex].name
 * - Guarda en savedGroupNames[carrera][índice]
 * - Si el nombre está vacío, restaura el predeterminado
 */
function saveGroupName(groupIndex, newName) {
    if (!globalBuiltGroups || !globalBuiltGroups[groupIndex]) return;
    
    const careerSelector = document.getElementById('groups-career-selector');
    const career = careerSelector ? careerSelector.value : '';
    if (!career) return;
    
    const trimmedName = newName.trim();
    const finalName = trimmedName || `Bloque ${groupIndex + 1}`;
    
    // Guardar en el grupo actual
    globalBuiltGroups[groupIndex].name = finalName;
    
    // Persistir en el almacenamiento por carrera
    if (!savedGroupNames[career]) {
        savedGroupNames[career] = [];
    }
    savedGroupNames[career][groupIndex] = finalName;
    
    // Si el nombre está vacío, restaurar visualmente
    if (!trimmedName) {
        const nameEl = document.getElementById(`group-name-${groupIndex}`);
        if (nameEl) nameEl.innerText = finalName;
    }
}