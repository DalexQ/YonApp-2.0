"""
YonApp 2.0 - Sistema Integral de Gestión Académica
===================================================

Aplicación principal Flask que coordina todos los módulos del sistema.

Módulos disponibles:
- Gestión de Salas: Administración y visualización de salas y horarios
- Planificador Académico: Gestión de carreras y planificación (EN DESARROLLO)
- Generador de Bloques: Creación de bloques para primer año (EXPERIMENTAL)

Autor: DalexQ
Versión: 2.0
"""

import os
from flask import Flask, render_template
from blueprints.rooms import rooms_bp
from blueprints.careers import careers_bp
from blueprints.groups import groups_bp

# Inicializar la aplicación Flask
app = Flask(__name__)

# ===================================
# CONFIGURACIÓN GLOBAL DE LA APLICACIÓN
# ===================================
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# ===================================
# REGISTRO DE BLUEPRINTS (MÓDULOS)
# ===================================
# Cada blueprint maneja un módulo específico de la aplicación
app.register_blueprint(rooms_bp)  # Módulo de Salas - Rutas: /upload, /add_room, etc.
app.register_blueprint(careers_bp)  # Módulo de Carreras - Rutas: /get_careers, /save_career, etc.
app.register_blueprint(groups_bp, url_prefix="/groups")  # Módulo de Bloques - Rutas: /groups/upload


# ===================================
# RUTA PRINCIPAL
# ===================================
@app.route("/")
def index():
    """
    Renderiza la página principal de la aplicación.
    
    Returns:
        template: Plantilla HTML principal con todos los módulos integrados
    """
    return render_template("index.html")


# ===================================
# PUNTO DE ENTRADA DE LA APLICACIÓN
# ===================================
if __name__ == "__main__":
    # Ejecutar en modo desarrollo con recarga automática
    # Para producción, usar run_yonapp.py
    app.run(debug=True, port=5000)
