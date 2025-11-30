
// --- FUNCIONES PARA NRCs SIN SALA ---
async function loadUnassignedNRCs() {
    const tbody = document.getElementById('unassigned-nrcs-list');
    const countSpan = document.getElementById('unassigned-count');

    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="7" class="p-8 text-center text-slate-500">
                <i data-lucide="loader" class="w-8 h-8 mx-auto mb-2 animate-spin"></i>
                Cargando datos...
            </td>
        </tr>
    `;

    try {
        const response = await fetch('/unassigned_nrcs');
        const result = await response.json();

        if (result.success && result.data) {
            const data = result.data;
            countSpan.textContent = data.length;

            if (data.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="p-8 text-center text-slate-500">
                            <i data-lucide="check-circle" class="w-8 h-8 mx-auto mb-2 text-green-500"></i>
                            No hay NRCs sin sala asignada
                        </td>
                    </tr>
                `;
            } else {
                tbody.innerHTML = data.map(item => `
                    <tr class="hover:bg-slate-50 transition">
                        <td class="p-3 font-mono text-blue-600">${item.nrc}</td>
                        <td class="p-3">${item.seccion || '-'}</td>
                        <td class="p-3 font-mono">${item.codigo_materia || '-'}</td>
                        <td class="p-3">${item.n_curso || '-'}</td>
                        <td class="p-3">${item.materia}</td>
                        <td class="p-3">
                            <span class="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                ${item.componente || 'N/A'}
                            </span>
                        </td>
                        <td class="p-3 text-xs text-slate-500">${item.carrera || '-'}</td>
                    </tr>
                `).join('');
            }

            lucide.createIcons();
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="p-8 text-center text-red-500">
                        <i data-lucide="alert-triangle" class="w-8 h-8 mx-auto mb-2"></i>
                        Error: ${result.error || 'No se pudieron cargar los datos'}
                    </td>
                </tr>
            `;
            lucide.createIcons();
        }
    } catch (error) {
        console.error("Error cargando NRCs sin sala:", error);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="p-8 text-center text-red-500">
                    <i data-lucide="wifi-off" class="w-8 h-8 mx-auto mb-2"></i>
                    Error de conexión
                </td>
            </tr>
        `;
        lucide.createIcons();
    }
}

// --- FUNCIONES PARA SALAS SIN DOCENTE ---
async function loadRoomsWithoutTeacher() {
    const tbody = document.getElementById('no-teacher-list');
    const countSpan = document.getElementById('no-teacher-count');

    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="10" class="p-8 text-center text-slate-500">
                <i data-lucide="loader" class="w-8 h-8 mx-auto mb-2 animate-spin"></i>
                Cargando datos...
            </td>
        </tr>
    `;

    try {
        const response = await fetch('/rooms_without_teacher');
        const result = await response.json();

        if (result.success && result.data) {
            const data = result.data;
            countSpan.textContent = data.length;

            if (data.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="10" class="p-8 text-center text-slate-500">
                            <i data-lucide="check-circle" class="w-8 h-8 mx-auto mb-2 text-green-500"></i>
                            Todas las asignaturas tienen docente asignado
                        </td>
                    </tr>
                `;
            } else {
                tbody.innerHTML = data.map(item => `
                    <tr class="hover:bg-slate-50 transition">
                        <td class="p-3 font-mono text-blue-600">${item.nrc}</td>
                        <td class="p-3">${item.seccion || '-'}</td>
                        <td class="p-3 font-mono">${item.codigo_materia || '-'}</td>
                        <td class="p-3">${item.n_curso || '-'}</td>
                        <td class="p-3">${item.materia}</td>
                        <td class="p-3">
                            <span class="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                ${item.componente || 'N/A'}
                            </span>
                        </td>
                        <td class="p-3 text-xs text-slate-500">${item.carrera || '-'}</td>
                        <td class="p-3 font-medium">${item.ubicacion}</td>
                        <td class="p-3 text-xs">${item.horario || '-'}</td>
                        <td class="p-3 text-xs">${item.dias || '-'}</td>
                    </tr>
                `).join('');
            }

            lucide.createIcons();
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="p-8 text-center text-red-500">
                        <i data-lucide="alert-triangle" class="w-8 h-8 mx-auto mb-2"></i>
                        Error: ${result.error || 'No se pudieron cargar los datos'}
                    </td>
                </tr>
            `;
            lucide.createIcons();
        }
    } catch (error) {
        console.error("Error cargando salas sin docente:", error);
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="p-8 text-center text-red-500">
                    <i data-lucide="wifi-off" class="w-8 h-8 mx-auto mb-2"></i>
                    Error de conexión
                </td>
            </tr>
        `;
        lucide.createIcons();
    }
}
