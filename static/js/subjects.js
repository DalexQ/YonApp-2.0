/**
 * subjects.js - Módulo de Buscador de Asignaturas
 * ====================================================
 * 
 * Estado: FUNCIONAL ✅
 * 
 * Funcionalidades:
 * - Búsqueda de asignaturas por NRC o sección
 * - Vista de todas las programaciones de una asignatura
 * - Navegación directa a horarios en el planificador
 * - Agrupación por carrera, malla y semestre
 * 
 * Dependencias:
 * - careerDatabase: Objeto global con datos de carreras (careers.js)
 * - switchTab(): Función de navegación (main.js)
 * - selectCareer(): Selección de carrera (careers.js)
 * - renderCareerGrid(): Renderizado de grilla (careers.js)
 * - Lucide Icons: Iconografía
 * 
 * Variables globales:
 * - allSubjects: Array con todas las asignaturas únicas (NRC-Sección)
 * - currentSelectedSubjectKey: Clave de asignatura seleccionada (para mantener selección)
 */

// ===================================
// VARIABLES GLOBALES DEL MÓDULO
// ===================================
let allSubjects = [];  // Array plano de todas las asignaturas encontradas
let currentSelectedSubjectKey = null;  // Para rastrear la selección actual (NRC-SEC)

/**
 * Carga todas las asignaturas desde la base de datos de carreras.
 * Llamada automáticamente cuando se modifica la planificación de carreras.
 * 
 * Proceso:
 * 1. Recorre careerDatabase completo
 * 2. Extrae bloques únicos por NRC-Sección
 * 3. Agrupa todas las ocurrencias de cada asignatura
 * 4. Renderiza lista actualizada
 * 5. Mantiene vista de detalles si había selección previa
 * 
 * Estructura de asignatura:
 * {
 *   nrc: string,
 *   seccion: string,
 *   tipo: string (TEO/LAB/TAL/SIM),
 *   occurrences: Array<{career, careerName, mesh, semester, day, module, type}>
 * }
 */
function loadSubjectsFromDatabase() {
    // Recorrer careerDatabase y extraer todas las asignaturas únicas
    const subjectsMap = new Map(); // Key: NRC-SEC

    Object.keys(careerDatabase).forEach(careerCode => {
        const career = careerDatabase[careerCode];
        const plan = career.planificacion || [];

        plan.forEach(block => {
            const key = `${block.nrc}-${block.seccion}`;
            
            if (!subjectsMap.has(key)) {
                subjectsMap.set(key, {
                    nrc: block.nrc,
                    seccion: block.seccion,
                    tipo: block.tipo, // TEO, LAB, etc. (tomamos el primero que encontremos)
                    occurrences: []
                });
            }

            const subject = subjectsMap.get(key);
            
            subject.occurrences.push({
                career: careerCode,
                careerName: career.nombre,
                mesh: block.malla,
                semester: block.semestre,
                day: block.dia,
                module: block.modulo,
                type: block.tipo
            });
        });
    });

    allSubjects = Array.from(subjectsMap.values());
    renderSubjectList(allSubjects);

    // Actualizar vista de detalles si hay algo seleccionado
    if (currentSelectedSubjectKey) {
        const found = allSubjects.find(s => `${s.nrc}-${s.seccion}` === currentSelectedSubjectKey);
        if (found) {
            showSubjectDetails(found);
        } else {
            clearSubjectDetails();
        }
    }
}

/**
 * Limpia la vista de detalles de asignatura.
 * Muestra el estado vacío ("Selecciona una asignatura...").
 */
function clearSubjectDetails() {
    currentSelectedSubjectKey = null;
    const emptyState = document.getElementById('subject-detail-empty');
    const contentState = document.getElementById('subject-detail-content');
    
    if(emptyState) emptyState.classList.remove('hidden');
    if(contentState) contentState.classList.add('hidden');
}

/**
 * Renderiza la lista de asignaturas en el panel izquierdo.
 * 
 * @param {Array} subjects - Array de objetos de asignaturas a mostrar
 * 
 * Muestra:
 * - NRC y sección en formato distintivo
 * - Contador de bloques programados
 * - Efecto hover para selección
 * 
 * Estado vacío: Mensaje cuando no hay asignaturas
 */
function renderSubjectList(subjects) {
    const container = document.getElementById('subject-list-container');
    if (!container) return;
    
    container.innerHTML = '';

    if (subjects.length === 0) {
        container.innerHTML = '<div class="text-center text-slate-400 text-sm py-4">No se encontraron asignaturas.</div>';
        return;
    }

    subjects.forEach(sub => {
        const div = document.createElement('div');
        div.className = "p-3 bg-white border border-slate-200 rounded-lg hover:border-purple-400 hover:shadow-sm cursor-pointer transition group";
        div.onclick = () => showSubjectDetails(sub);
        
        div.innerHTML = `
            <div class="flex justify-between items-center">
                <div class="font-mono font-bold text-slate-700 text-sm">NRC ${sub.nrc}</div>
                <div class="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">${sub.seccion}</div>
            </div>
            <div class="text-xs text-slate-500 mt-1 truncate">
                ${sub.occurrences.length} bloques programados
            </div>
        `;
        container.appendChild(div);
    });
}

/**
 * Filtra las asignaturas según el texto de búsqueda.
 * 
 * Búsqueda:
 * - Insensible a mayúsculas/minúsculas
 * - Busca en NRC y sección
 * - Resultados en tiempo real (keyup event)
 */
function filterSubjects() {
    const query = document.getElementById('subject-search-input').value.toUpperCase();
    const filtered = allSubjects.filter(s => 
        s.nrc.toString().includes(query) || 
        s.seccion.toUpperCase().includes(query)
    );
    renderSubjectList(filtered);
}

/**
 * Muestra los detalles de una asignatura en el panel derecho.
 * 
 * @param {Object} subject - Objeto de asignatura con sus ocurrencias
 * 
 * Vista:
 * 1. Encabezado con NRC y Sección
 * 2. Cards agrupadas por contexto (Carrera + Malla + Semestre)
 * 3. Cada card muestra:
 *    - Nombre de carrera
 *    - Malla y semestre
 *    - Bloques ordenados por día y módulo
 *    - Botón de navegación al planificador
 * 
 * Interacción:
 * - Clic en card: navega al horario en el planificador
 */
function showSubjectDetails(subject) {
    currentSelectedSubjectKey = `${subject.nrc}-${subject.seccion}`;

    document.getElementById('subject-detail-empty').classList.add('hidden');
    document.getElementById('subject-detail-content').classList.remove('hidden');

    document.getElementById('detail-nrc').innerText = `NRC ${subject.nrc}`;
    document.getElementById('detail-sec').innerText = `Sección ${subject.seccion}`;

    // Renderizar ocurrencias agrupadas por Carrera/Malla/Semestre
    const container = document.getElementById('detail-occurrences');
    container.innerHTML = '';

    // Agrupar ocurrencias por contexto único (Carrera + Malla + Semestre)
    const contexts = {};
    
    subject.occurrences.forEach(occ => {
        const key = `${occ.career}-${occ.mesh}-${occ.semester}`;
        if (!contexts[key]) {
            contexts[key] = {
                career: occ.career,
                careerName: occ.careerName,
                mesh: occ.mesh,
                semester: occ.semester,
                blocks: []
            };
        }
        contexts[key].blocks.push(occ);
    });

    Object.values(contexts).forEach(ctx => {
        const card = document.createElement('div');
        card.className = "bg-slate-50 border border-slate-200 rounded-lg p-4 hover:border-purple-300 transition cursor-pointer";
        card.onclick = () => navigateToSchedule(ctx.career, ctx.mesh, ctx.semester);

        // Ordenar bloques por día y módulo
        const daysOrder = { "lunes": 1, "martes": 2, "miercoles": 3, "jueves": 4, "viernes": 5, "sabado": 6 };
        ctx.blocks.sort((a, b) => {
            if (daysOrder[a.day] !== daysOrder[b.day]) return daysOrder[a.day] - daysOrder[b.day];
            return a.module - b.module;
        });

        const blocksHtml = ctx.blocks.map(b => 
            `<span class="inline-block bg-white border border-slate-200 text-slate-600 text-xs px-2 py-1 rounded mr-1 mb-1">
                ${capitalize(b.day)} M${b.module} (${b.type})
            </span>`
        ).join('');

        card.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <div>
                    <div class="font-bold text-slate-700 text-sm">${ctx.careerName}</div>
                    <div class="text-xs text-slate-500">Malla ${ctx.mesh} • Semestre ${ctx.semester}</div>
                </div>
                <i data-lucide="arrow-right-circle" class="w-5 h-5 text-purple-400"></i>
            </div>
            <div class="flex flex-wrap">
                ${blocksHtml}
            </div>
        `;
        container.appendChild(card);
    });
    
    lucide.createIcons();
}

/**
 * Navega al planificador de horarios con la carrera, malla y semestre especificados.
 * 
 * @param {string} careerCode - Código de la carrera
 * @param {string} mesh - Año de la malla curricular
 * @param {number} semester - Número de semestre
 * 
 * Flujo:
 * 1. Cambia a pestaña 'career-schedule'
 * 2. Selecciona la carrera
 * 3. Espera a que se actualicen los selectores (100ms)
 * 4. Selecciona malla y semestre
 * 5. Renderiza la grilla de horarios
 * 
 * Permite: Ver contexto completo de la asignatura en su horario
 */
function navigateToSchedule(careerCode, mesh, semester) {
    // 1. Cambiar a la pestaña del planificador
    switchTab('career-schedule');
    
    // 2. Seleccionar la carrera (usando la función existente en careers.js)
    selectCareer(careerCode);

    // 3. Esperar un poco a que se actualicen los selectores y luego seleccionar malla y semestre
    setTimeout(() => {
        const mallaSel = document.getElementById('schedule-malla-selector');
        const semSel = document.getElementById('schedule-sem-selector');
        
        if (mallaSel) mallaSel.value = mesh;
        if (semSel) semSel.value = semester;
        
        // 4. Renderizar la grilla
        renderCareerGrid();
    }, 100);
}

/**
 * Convierte la primera letra de un string a mayúscula.
 * 
 * @param {string} str - Texto a capitalizar
 * @returns {string} - Texto con primera letra mayúscula
 * 
 * Ejemplo: "lunes" → "Lunes"
 */
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}