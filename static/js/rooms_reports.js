/**
 * rooms_reports.js - Módulo de Reportes de Salas
 * ================================================
 * 
 * Estado: FUNCIONAL ✅
 * 
 * Funcionalidades:
 * - Reporte de NRCs sin sala asignada
 * - Reporte de salas sin docente asignado
 * - Visualización en tablas con contador
 * - Estados de carga y error
 * 
 * Dependencias:
 * - Backend endpoints: /unassigned_nrcs, /rooms_without_teacher
 * - Lucide Icons: Iconografía
 * 
 * Uso:
 * - Se invoca desde rooms.js al navegar a las vistas de reportes
 * - Carga automática al mostrar cada vista
 */

// ===================================
// REPORTE: NRCs SIN SALA ASIGNADA
// ===================================

/**
 * Carga y muestra los NRCs que no tienen sala asignada.
 * 
 * Flujo:
 * 1. Muestra estado de carga (spinner)
 * 2. Llama a /unassigned_nrcs
 * 3. Renderiza tabla con resultados
 * 4. Actualiza contador en el título
 * 
 * Estados:
 * - Carga: Spinner animado
 * - Vacío: Ícono verde "✓ No hay NRCs sin sala"
 * - Con datos: Tabla con NRC, sección, código, materia, componente, carrera
 * - Error: Mensaje de error con ícono
 */
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

// ===================================
// REPORTE: SALAS SIN DOCENTE ASIGNADO
// ===================================

/**
 * Carga y muestra las salas que no tienen docente asignado.
 * 
 * Flujo:
 * 1. Muestra estado de carga (spinner)
 * 2. Llama a /rooms_without_teacher
 * 3. Renderiza tabla con resultados
 * 4. Actualiza contador en el título
 * 
 * Estados:
 * - Carga: Spinner animado
 * - Vacío: Ícono verde "✓ No hay salas sin docente"
 * - Con datos: Tabla con día, módulo, sala, carrera, NRC, sección, código, materia, componente, capacidad
 * - Error: Mensaje de error con ícono
 * 
 * Información adicional:
 * - Útil para identificar bloques de clase sin profesor asignado
 * - Permite detectar inconsistencias en la asignación docente
 */
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
