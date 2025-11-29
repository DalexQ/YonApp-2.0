import os
from flask import Blueprint, request, jsonify, current_app
import pandas as pd


groups_bp = Blueprint("groups", __name__)


def normalize_groups_columns(df: pd.DataFrame) -> pd.DataFrame:
    df.columns = df.columns.str.strip().str.lower()
    mapping = {
        "nombre": "nombre_asignatura",
        "materia": "codigo_materia",
        "sala": "ubicacion",
        "carrera_reserva": "carrera",
        "carrera reserva": "carrera",
        "carrera": "carrera",
        "hr_inicio": "inicio",
        "hr_fin": "fin",
        "nrc": "nrc",
        "seccion": "seccion",
        "sección": "seccion",
        "n_curso": "n_curso",
        "componente": "componente",
        "fecha_ini": "fecha_ini",
        "fecha_term": "fecha_term",
        "nombre_": "prof_nombre",
        "apellido": "prof_apellido",
        "vacantes": "vacantes",
        "ni_an": "ni_an",
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
    """Convierte '800' a '08:00', '1230' a '12:30', etc."""
    time_str = time_str.strip().replace(".0", "")
    if not time_str:
        return ""
    
    # Si ya tiene formato correcto, devolverlo
    if ":" in time_str:
        return time_str
    
    # Intentar parsear formato sin dos puntos
    if len(time_str) == 3:  # Ej: "800" -> "08:00"
        return f"0{time_str[0]}:{time_str[1:3]}"
    elif len(time_str) == 4:  # Ej: "1230" -> "12:30"
        return f"{time_str[0:2]}:{time_str[2:4]}"
    
    return time_str


def get_module_from_time(time_str: str) -> int:
    """Mapea hora de inicio a número de módulo (1-8)"""
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

    inicio_raw = str(row.get("inicio", "")).strip().replace(".0", "")
    fin_raw = str(row.get("fin", "")).strip().replace(".0", "")
    inicio = normalize_time_format(inicio_raw)
    fin = normalize_time_format(fin_raw)
    horario_texto = f"{inicio} - {fin}" if inicio or fin else ""
    modulo = get_module_from_time(inicio)

    nombre_asignatura = str(row.get("nombre_asignatura", "Sin Nombre")).strip()
    codigo_materia = str(row.get("codigo_materia", "")).strip()
    ubicacion = str(row.get("ubicacion", "")).strip()
    nrc = str(row.get("nrc", "")).strip().replace(".0", "")
    seccion = str(row.get("seccion", "")).strip()
    carrera = str(row.get("carrera", "")).strip()
    n_curso = str(row.get("n_curso", "")).strip()
    componente = str(row.get("componente", "")).strip()

    try:
        vacantes = int(row.get("vacantes", 0))
    except Exception:
        vacantes = 0

    ni_an = str(row.get("ni_an", "")).strip().lower()

    for day in days:
        if day in row.index:
            val = str(row[day]).strip().lower()
            if val not in ("nan", "", "none"):
                entries.append(
                    {
                        "materia": nombre_asignatura,
                        "codigo_materia": codigo_materia,
                        "ubicacion": ubicacion,
                        "carrera": carrera,
                        "nrc": nrc,
                        "seccion": seccion,
                        "n_curso": n_curso,
                        "componente": componente,
                        "tipo": componente,
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

        if "carrera" not in df.columns or "ni_an" not in df.columns:
            return None, "El archivo no contiene columnas CARRERA_RESERVA / NI_AN."

        # Filtrar filas con carrera no vacía
        df["carrera"] = df["carrera"].astype(str)
        df = df[df["carrera"].str.strip() != ""]
        df = df[~df["carrera"].str.lower().isin(["nan", "none", "nat"])]

        # Normalizar NI_AN y filtrar solo NI
        df["ni_an"] = df["ni_an"].astype(str)
        df["ni_an_norm"] = df["ni_an"].str.strip().str.upper()
        df = df[df["ni_an_norm"] == "NI"]

        schedule_entries = []
        for _, row in df.iterrows():
            schedule_entries.extend(parse_groups_row(row))

        return {"schedule_ni": schedule_entries}, None
    except Exception as e:
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
