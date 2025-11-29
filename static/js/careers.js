// careers.js - Lógica del Módulo de Carreras
let careerDatabase = {}; 
let careerPendingDelete = null;
let currentPlanningPeriod = 1; // 1 = Impares, 2 = Pares

document.addEventListener('DOMContentLoaded', () => {
    loadCareers();
});

// --- API CLIENTE ---
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

// --- CONFIGURACIÓN DE PERIODO ---
function openPeriodConfigModal() {
    document.getElementById('modal-period-config').classList.remove('hidden');
    updatePeriodUI();
}

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

// --- VISTA 1: LISTADO (Sin cambios en esta parte) ---
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

// --- CRUD Carreras (Funciones ya existentes, mantenerlas) ---
function openCareerConfigModal() {
    document.getElementById('modal-career-config').classList.remove('hidden');
    document.getElementById('cfg-code').value = '';
    document.getElementById('cfg-code').disabled = false;
    document.getElementById('cfg-name').value = '';
    document.getElementById('cfg-semesters').value = 10;
    renderMeshCheckboxes('cfg-meshes-container', []);
}

function openEditCareerModal(code) {
    const career = careerDatabase[code];
    if (!career) return;
    
    document.getElementById('modal-edit-career').classList.remove('hidden');
    document.getElementById('edit-code').value = code;
    document.getElementById('edit-name').value = career.nombre;
    document.getElementById('edit-semesters').value = career.semestres;
    renderMeshCheckboxes('edit-meshes-container', career.mallas || []);
}

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

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

function promptDeleteCareer(code) {
    careerPendingDelete = code;
    document.getElementById('del-career-name').innerText = careerDatabase[code].nombre;
    document.getElementById('modal-delete-career').classList.remove('hidden');
}

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

// --- VISTA 2: PLANIFICADOR (Horarios) ---

function goToSchedule(code) {
    if(window.switchTab) {
        switchTab('career-schedule');
        selectCareer(code);
    }
}

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

// --- FUNCIONES DEL BUSCADOR DE CARRERAS ---
function showCareerOptions() {
    document.getElementById('schedule-career-options').classList.remove('hidden');
}

function hideCareerOptionsDelayed() {
    setTimeout(() => {
        document.getElementById('schedule-career-options').classList.add('hidden');
    }, 200);
}

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

function selectCareer(code) {
    const selector = document.getElementById('schedule-career-selector');
    const searchInput = document.getElementById('schedule-career-search');
    
    if(selector && searchInput && careerDatabase[code]) {
        selector.value = code;
        searchInput.value = code; // Mostrar solo el código como se solicitó
        updateScheduleFilters();
    }
}

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

// --- FUNCIONES NUEVAS: AÑADIR BLOQUE ---

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

function removeDayModuleRow(btn) {
    const row = btn.closest('.day-module-row');
    const container = document.getElementById('day-module-container');
    
    // No permitir eliminar si solo hay una fila
    if (container.querySelectorAll('.day-module-row').length > 1) {
        row.remove();
        updateRemoveButtons();
    }
}

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

// --- EDITAR / ELIMINAR BLOQUES DESDE EL HORARIO ---

let currentEditBlock = null;

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

// --- AUTOCOMPLETE DE NRC EN MODAL (FILTRADO POR MATERIA Y CURSO) ---

// Lista de códigos de materia válidos
const VALID_SUBJECT_CODES = [
    'OBMA', 'MEVE', 'TMED', 'ADPU', 'ICOM', 'ARQT', 'FIAD', 'DERE', 'EDUC', 'PEDI', 
    'ENFE', 'DBIO', 'PSIC', 'QYFA', 'PEEI', 'FORI', 'LCEN', 'CFIN', 'BCSA', 'MEDI', 
    'DMOR', 'FAEG', 'DQUI', 'DSPU', 'DGEE', 'DCEX', 'CIVU', 'FONA', 'TEOC', 'FAOR', 
    'DAEC', 'DAED', 'KINE', 'INGE', 'ICIF', 'ICID', 'FACU', 'NYGA', 'ODON', 'DMAE', 
    'PTAP', 'IGEE', 'ESAP', 'PEMI'
];

function showSubjectCodes() {
    const container = document.getElementById('subject-code-options');
    if (container) {
        buildSubjectCodeOptions();
        container.classList.remove('hidden');
    }
}

function hideSubjectCodesDelayed() {
    setTimeout(() => {
        const container = document.getElementById('subject-code-options');
        if (container) container.classList.add('hidden');
    }, 200);
}

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

function handleNrcInput() {
    // Esta función se llama cuando el usuario escribe en el campo NRC libre
    // No hace nada especial, solo permite escritura libre
}

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

// --- ELIMINACIÓN DE BLOQUES (CARRERAS) ---

let blockIndexToDelete = null;
let blockCareerForDeletion = null;

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

function handleScheduleSelectorChange() {
    updateAddButtonState();
    renderCareerGrid();
}

// --- FUNCIONES PARA MANEJO DE MALLAS ---
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

function getSelectedMeshes(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return [];
    
    const checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value).sort((a, b) => b - a);
}

let currentMeshContainer = null; // Variable para saber a qué contenedor agregar la malla

function addNewMesh() {
    currentMeshContainer = 'cfg-meshes-container';
    document.getElementById('modal-add-mesh').classList.remove('hidden');
    document.getElementById('new-mesh-year').value = '';
    document.getElementById('new-mesh-year').focus();
}

function addNewMeshToEdit() {
    currentMeshContainer = 'edit-meshes-container';
    document.getElementById('modal-add-mesh').classList.remove('hidden');
    document.getElementById('new-mesh-year').value = '';
    document.getElementById('new-mesh-year').focus();
}

function closeMeshModal() {
    document.getElementById('modal-add-mesh').classList.add('hidden');
    currentMeshContainer = null;
}

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