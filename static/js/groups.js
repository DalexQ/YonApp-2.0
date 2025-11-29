// groups.js - Lógica para Generador de Grupos (1° Año)

let globalGroupsData = null;

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
    console.log("--- Iniciando Vista de Grupos (1° Año) ---");

    const selector = document.getElementById('groups-career-selector');
    if (!selector) return;

    // Si ya tenemos datos cargados anteriormente, solo regenerar el selector
    if (globalGroupsData && Array.isArray(globalGroupsData.schedule_ni)) {
        populateCareerSelector(globalGroupsData.schedule_ni);
        return;
    }

    // Solicitar Excel específico para grupos 1° año
    // Se asume que el usuario ya subió un Excel a través de un formulario
    // con id="groups-upload-form" y un input type="file" con name="file".
    const form = document.getElementById('groups-upload-form');
    if (!form) {
        console.warn('No se encontró el formulario de subida para grupos (groups-upload-form).');
        selector.innerHTML = '<option value="">-- Configurar subida de Excel para Grupos --</option>';
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
            console.error('Error al procesar Excel de grupos:', json.error);
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
        console.error('Error de red al subir Excel de grupos:', err);
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
        return;
    }

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
    // 2. Construir grupos de alumnos basados en vacantes y choques de horario
    const builtGroups = buildGroupsForCareer(rawBlocks);

    if (builtGroups.length === 0) {
        container.innerHTML = `<div class="p-8 text-slate-500">No fue posible construir grupos para ${career}.</div>`;
        return;
    }

    // 3. Renderizar grupos construidos
    builtGroups.forEach((group, idx) => {
        const groupBlocks = group.blocks;
        const groupSize = group.size;

        const dayOrder = {"lunes":1, "martes":2, "miercoles":3, "jueves":4, "viernes":5, "sabado":6};
        groupBlocks.sort((a, b) => {
            if(dayOrder[a.dia_norm] !== dayOrder[b.dia_norm]) return dayOrder[a.dia_norm] - dayOrder[b.dia_norm];
            return a.modulo - b.modulo;
        });

        const colDiv = document.createElement('div');
        colDiv.className = "w-80 flex-shrink-0 flex flex-col bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden";

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
                        <span>Sala: ${b.ubicacion}</span>
                    </div>
                </div>
            `;
        });

        colDiv.innerHTML = `
            <div class="bg-slate-800 text-white p-4 border-b border-slate-700">
                <div class="flex justify-between items-center">
                    <h3 class="font-bold text-lg">Grupo ${idx + 1}</h3>
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

// Construye grupos para una carrera usando la regla:
// tamaño de grupo = mínimo de vacantes entre sus asignaturas en ese ciclo.
// Permite múltiples bloques de la misma asignatura siempre que no topen en tiempo.
// Cuando hay varios bloques en la MISMA franja de una asignatura (espejos),
// todos son equivalentes: el algoritmo elegirá uno distinto por grupo para repartir.
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

        groups.push({ size: groupSize, blocks: groupBlocks });
    }

    return groups;
}