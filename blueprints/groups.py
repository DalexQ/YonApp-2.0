"""
Módulo Generador de Bloques para Estudiantes de Primer Año
============================================================

Este módulo procesa archivos Excel con datos de nuevo ingreso y genera
bloques de estudiantes optimizando la asignación a secciones.

Funcionalidad:
- Procesa Excel con datos de asignaturas y vacantes
- Filtra estudiantes de nuevo ingreso (NI)
- Genera bloques considerando:
  * Vacantes disponibles por sección
  * Conflictos de horario
  * Distribución equitativa de estudiantes

Estado: EXPERIMENTAL - NO FUNCIONAL 🔴

⚠️ ADVERTENCIA CRÍTICA:
Este módulo NO funciona correctamente y NO debe usarse en producción.

Problemas identificados:
- El algoritmo no refleja el proceso real de Registro Académico
- Las reglas de asignación necesitan validación institucional
- Los criterios de optimización no están alineados con políticas reales
- Falta validación de casos especiales

Trabajo requerido:
1. Reuniones con Registro Académico para documentar proceso real
2. Rediseño completo del algoritmo de asignación
3. Validación iterativa con datos históricos
4. Testing exhaustivo antes de uso real

Ver README.md sección "Limitaciones Actuales" para detalles completos.

Endpoint:
- POST /groups/upload: Procesa archivo Excel de nuevo ingreso
"""

import os
from flask import Blueprint, request, jsonify, current_app
import pandas as pd
import math

# ===================================
# INICIALIZACIÓN DEL BLUEPRINT
# ===================================
groups_bp = Blueprint("groups", __name__)


# ===================================
# FUNCIONES DE NORMALIZACIÓN DE DATOS
# ===================================

def normalize_groups_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Normaliza las columnas del DataFrame de Excel para generación de bloques.
    
    Este proceso es crítico para asegurar que el algoritmo pueda leer
    correctamente los datos independientemente del formato del Excel.
    
    Proceso:
    1. Convierte nombres a minúsculas y elimina espacios
    2. Maneja columnas conflictivas (vacantes, carrera)
    3. Mapea nombres del Excel a nombres internos estándar
    
    Args:
        df (DataFrame): DataFrame de pandas con datos del Excel
        
    Returns:
        DataFrame: DataFrame con columnas normalizadas
        
    Columnas requeridas en Excel:
        - NOMBRE: Nombre de la asignatura
        - NRC: Número de referencia del curso
        - SECCION: Sección del curso
        - N_CURSO: Número de curso
        - COMPONENTE/TIPO: Tipo de actividad (TEO, LAB, TAL, SIM)
        - SALA: Código de la sala
        - HR_INICIO/HR_FIN: Horas de inicio y término
        - CARRERA_RESERVA: Código de la carrera
        - NI_AN: Indicador de nuevo ingreso (debe ser "NI")
        - CUPO_DISP/VACANTES: Vacantes disponibles
        - Días de la semana: LUNES, MARTES, MIERCOLES, etc.
    """
    # 1. Limpieza inicial: minúsculas y quitar espacios
    df.columns = df.columns.str.strip().str.lower()

    # 2. Renombrar columnas conflictivas si existen
    # Esto previene problemas cuando hay múltiples columnas con nombres similares
    if "vacantes" in df.columns:
        # Si existe una columna llamada explícitamente 'vacantes' que NO es la que queremos, la apartamos
        df.rename(columns={"vacantes": "vacantes_original"}, inplace=True)

    if "carrera" in df.columns and "carrera_reserva" in df.columns:
        df.rename(columns={"carrera": "carrera_original"}, inplace=True)

    # 3. Mapeo Oficial de columnas
    # Este diccionario traduce los nombres del Excel a nombres internos consistentes
    mapping = {
        # --- ASIGNATURA ---
        "nombre": "nombre_asignatura",
        "materia": "codigo_materia",
        "nrc": "nrc",
        "seccion": "seccion",
        "sección": "seccion",
        "n_curso": "n_curso",
        # --- TIPO DE ASIGNATURA ---
        # CRÍTICO: COMPONENTE debe mapearse a TIPO para que el algoritmo funcione
        "componente": "tipo",  # MAPEO CLAVE: COMPONENTE -> TIPO
        "tipo": "tipo",
        "tip": "tipo",
        # --- UBICACIÓN Y TIEMPO ---
        "sala": "ubicacion",
        "hr_inicio": "inicio",
        "hr_fin": "fin",
        "fecha_ini": "fecha_ini",
        "fecha_term": "fecha_term",
        # --- FILTROS ---
        "carrera_reserva": "carrera",
        "carrera": "carrera",
        "ni_an": "ni_an",
        # --- VACANTES (Prioridad: Cupo Disp) ---
        "cupo_disp": "vacantes",
        # --- DOCENTE ---
        "nombre_": "prof_nombre",
        "apellido": "prof_apellido",
        # --- DÍAS ---
        "lunes": "lunes",
        "martes": "martes",
        "miercoles": "miercoles",
        "miércoles": "miercoles",
        "jueves": "jueves",
        "viernes": "viernes",
        "sabado": "sabado",
        "sábado": "sabado",
    }
    df.rename(columns=mapping, inplace=True)
    return df


def normalize_time_format(time_str: str) -> str:
    """
    Normaliza el formato de hora a HH:MM.
    
    Maneja diferentes formatos comunes del Excel:
    - "800" o "8:00" -> "08:00"
    - "1430" -> "14:30"
    - "9:30" -> "09:30"
    
    Args:
        time_str (str): Cadena con la hora en cualquier formato
        
    Returns:
        str: Hora en formato HH:MM o cadena vacía si inválido
    """
    time_str = str(time_str).strip().replace(".0", "")
    if not time_str or time_str.lower() == "nan":
        return ""
    if ":" in time_str:
        return time_str
    if len(time_str) == 3:
        return f"0{time_str[0]}:{time_str[1:3]}"
    elif len(time_str) == 4:
        return f"{time_str[0:2]}:{time_str[2:4]}"
    return time_str


def get_module_from_time(time_str: str) -> int:
    """
    Determina el número de módulo académico según la hora de inicio.
    
    Módulos académicos:
    - M1: 08:00
    - M2: 09:30
    - M3: 11:00
    - M4: 12:30
    - M5: 14:00
    - M6: 15:30
    - M7: 17:00
    - M8: 18:30
    
    Args:
        time_str (str): Hora de inicio (ej: "08:00")
        
    Returns:
        int: Número de módulo (1-8) o 0 si no coincide con ningún módulo
    """
    time_str = normalize_time_format(time_str)
    if time_str.startswith("08:00") or time_str.startswith("8:00"):
        return 1
    elif time_str.startswith("09:30") or time_str.startswith("9:30"):
        return 2
    elif time_str.startswith("11:00"):
        return 3
    elif time_str.startswith("12:30"):
        return 4
    elif time_str.startswith("14:00"):
        return 5
    elif time_str.startswith("15:30"):
        return 6
    elif time_str.startswith("17:00"):
        return 7
    elif time_str.startswith("18:30"):
        return 8
    else:
        return 0


def parse_groups_row(row: pd.Series):
    entries = []
    days = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado"]

    # Validar NRC
    nrc_raw = row.get("nrc", "")
    if pd.isna(nrc_raw) or str(nrc_raw).strip() in ("", "nan", "NaT", "None"):
        return entries

    # Helper para limpiar strings
    def clean(key):
        return str(row.get(key, "")).strip()

    # Horarios
    inicio_raw = clean("inicio").replace(".0", "")
    fin_raw = clean("fin").replace(".0", "")
    inicio = normalize_time_format(inicio_raw)
    fin = normalize_time_format(fin_raw)
    horario_texto = f"{inicio} - {fin}" if inicio or fin else ""
    modulo = get_module_from_time(inicio)

    # Datos Generales
    nombre_asignatura = str(row.get("nombre_asignatura", "Sin Nombre")).strip()
    ubicacion = clean("ubicacion")
    nrc = clean("nrc").replace(".0", "")
    seccion = clean("seccion")
    carrera = clean("carrera")
    n_curso = clean("n_curso")
    codigo_materia = clean("codigo_materia")

    # TIPO DE ASIGNATURA (CORREGIDO)
    # Leemos la columna 'tipo' (que mapeamos desde COMPONENTE)
    # Si está vacía, asumimos "TEO" por defecto, pero intentamos leer el valor real.
    tipo_raw = clean("tipo")
    tipo = tipo_raw.upper() if tipo_raw else "TEO"

    # Filtro NI
    ni_an = clean("ni_an").upper()
    if ni_an == "NAN":
        ni_an = ""

    # --- EXTRACCIÓN DE VACANTES (VERSIÓN SIMPLIFICADA Y DEPURADA) ---
    vacantes = 0

    # 1. Obtener valor crudo
    v_raw = row.get("vacantes", 0)

    # 2. Depuración: Ver qué llega exactamente
    # print(f"DEBUG VACANTES NRC {nrc}: Valor crudo = '{v_raw}' Tipo = {type(v_raw)}")

    try:
        # Si es una Serie de Pandas (pasa a veces con columnas duplicadas), tomar el primer valor
        if hasattr(v_raw, "iloc"):
            v_raw = v_raw.iloc[0]

        # Convertir a string, limpiar espacios y convertir
        v_str = str(v_raw).strip()

        if v_str and v_str.lower() != "nan":
            # Convertir a float primero para manejar "15.0" y luego a int
            vacantes = int(float(v_str))

    except Exception as e:
        print(f"ERROR leyendo vacantes NRC {nrc}: {e}")
        vacantes = 0

    # ---------------------------------------------------------------

    for day in days:
        if day in row.index:
            val = str(row[day]).strip().lower()
            if val and val not in ("nan", "none", ""):
                entries.append(
                    {
                        "materia": nombre_asignatura,
                        "codigo_materia": codigo_materia,
                        "ubicacion": ubicacion,
                        "carrera": carrera,
                        "nrc": nrc,
                        "seccion": seccion,
                        "n_curso": n_curso,
                        "componente": tipo_raw,  # Guardamos el original también
                        "tipo": tipo,  # Este es el que usa el JS (TEO, LAB, etc)
                        "dia_norm": day,
                        "horario_texto": horario_texto,
                        "modulo": modulo,
                        "vacantes": vacantes,
                        "ni_an": ni_an,
                    }
                )

    return entries


def process_groups_file(file_path: str):
    try:
        df = pd.read_excel(file_path)
        df = normalize_groups_columns(df)

        if "nrc" in df.columns:
            df = df.dropna(subset=["nrc"])

        schedule_entries = []
        for _, row in df.iterrows():
            schedule_entries.extend(parse_groups_row(row))

        return {"schedule_ni": schedule_entries}, None
    except Exception as e:
        print(f"Error Fatal procesando grupos: {e}")
        return None, str(e)


@groups_bp.route("/upload", methods=["POST"])
def groups_upload():
    if "file" not in request.files:
        return jsonify({"error": "No file"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file"}), 400

    try:
        upload_folder = current_app.config.get("UPLOAD_FOLDER", "uploads")
        os.makedirs(upload_folder, exist_ok=True)
        filepath = os.path.join(upload_folder, file.filename)
        file.save(filepath)

        data, error = process_groups_file(filepath)
        if error:
            return jsonify({"error": error}), 500
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
