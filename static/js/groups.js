// groups.js - Lógica para Generador de Bloques (1° Año)

let globalGroupsData = null;
let globalBuiltGroups = [];
let savedGroupNames = {}; // Almacena nombres por carrera: { "Carrera": ["Nombre1", "Nombre2", ...] }

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
                <div class="mb-2 p-2 border-l-4 ${colorClass} rounded text-xs relative group">
                    <div class="flex justify-between font-bold mb-1">
                        <span>NRC: ${b.nrc} &nbsp; Sección: ${b.seccion || ''}</span>
                        <span class="bg-white/50 px-1 rounded">${b.tipo}</span>
                    </div>
                    <div class="font-bold text-sm leading-tight">${b.materia}</div>
                    <div class="mt-1 flex justify-between opacity-70 text-[10px]">
                        <span>${b.dia_norm.toUpperCase().substring(0,3)} ${b.horario_texto}</span>
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

// Construye bloques para una carrera usando la regla:
// tamaño de bloque = mínimo de vacantes entre sus asignaturas en ese ciclo.
// Permite múltiples bloques de la misma asignatura siempre que no topen en tiempo.
// Cuando hay varios bloques en la MISMA franja de una asignatura (espejos),
// todos son equivalentes: el algoritmo elegirá uno distinto por bloque para repartir.
function buildGroupsForCareer(blocks) {
    if (!blocks || blocks.length === 0) return [];

    // Copia mutable de vacantes por bloque (NRC/sección)
    const remaining = blocks.map(b => ({ ref: b, vac: b.vacantes || 0 }));

    // Índice rápido por (materia, dia, horario) -> lista de entradas remaining
    function getRemainingBySubjectAndSlot(materia, dia, horario) {
        return remaining.filter(r =>
            r.vac > 0 &&
            r.ref.materia === materia &&
            r.ref.dia_norm === dia &&
            r.ref.horario_texto === horario
        );
    }

    // Grupo de "plantilla": lista de todas las combinaciones únicas materia/dia/horario
    const templateSlots = [];
    const seenTemplateKeys = new Set();
    blocks.forEach(b => {
        const key = `${b.materia}__${b.dia_norm}__${b.horario_texto}`;
        if (!seenTemplateKeys.has(key)) {
            seenTemplateKeys.add(key);
            templateSlots.push({
                materia: b.materia,
                dia_norm: b.dia_norm,
                horario_texto: b.horario_texto
            });
        }
    });

    const groups = [];

    while (true) {
        const groupBlocks = [];
        const groupSizeCandidates = [];

        for (const slot of templateSlots) {
            // Todas las secciones posibles para esta materia en esta franja
            const candidates = getRemainingBySubjectAndSlot(
                slot.materia,
                slot.dia_norm,
                slot.horario_texto
            );

            if (candidates.length === 0) {
                // No hay más cupos para esta asignatura/franja;
                // no podemos construir otro grupo completo
                groupBlocks.length = 0;
                break;
            }

            // Elegimos la sección con MÁS vacantes para ir equilibrando
            candidates.sort((a, b) => b.vac - a.vac);
            const chosen = candidates[0];

            groupBlocks.push(chosen.ref);
            groupSizeCandidates.push(chosen.vac);
        }

        if (groupBlocks.length === 0 || groupSizeCandidates.length === 0) {
            break;
        }

        const groupSize = Math.min(...groupSizeCandidates);
        if (groupSize <= 0) break;

        // Descontar vacantes usadas
        for (const gb of groupBlocks) {
            const entry = remaining.find(r => r.ref === gb);
            if (entry) entry.vac -= groupSize;
        }

        groups.push({ size: groupSize, blocks: groupBlocks, name: `Bloque ${groups.length + 1}` });
    }

    return groups;
}
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

// Muestra el horario escolar de un grupo en un modal propio
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

function closeGroupTimetableModal() {
    const modal = document.getElementById('modal-group-timetable');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

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