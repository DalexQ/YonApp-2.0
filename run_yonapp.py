"""
YonApp 2.0 - Script de Ejecución para Usuario Final
====================================================

Este script inicia la aplicación Flask y automáticamente abre el navegador web.
Diseñado para facilitar el uso a usuarios no técnicos.

Características:
- Abre automáticamente el navegador después de 1 segundo
- Ejecuta Flask en modo sin debug (más estable)
- Crea la carpeta de uploads si no existe

Uso:
    python run_yonapp.py

Nota: Para desarrollo, usar app.py directamente con modo debug activado
"""

import os
from threading import Timer
import webbrowser

from app import app  # Importa la instancia de Flask desde app.py


def open_browser():
    """
    Abre automáticamente el navegador web en la dirección de la aplicación.
    
    Se ejecuta después de un pequeño delay para asegurar que el servidor
    Flask esté completamente iniciado antes de abrir el navegador.
    """
    webbrowser.open_new("http://127.0.0.1:5000")


if __name__ == "__main__":
    # ===================================
    # PREPARACIÓN DEL ENTORNO
    # ===================================
    # Asegurar que exista la carpeta para archivos subidos
    os.makedirs("uploads", exist_ok=True)

    # ===================================
    # INICIAR NAVEGADOR AUTOMÁTICAMENTE
    # ===================================
    # Timer ejecuta open_browser() después de 1 segundo
    # Esto da tiempo al servidor Flask para iniciarse completamente
    Timer(1, open_browser).start()

    # ===================================
    # EJECUTAR SERVIDOR FLASK
    # ===================================
    # host="127.0.0.1": Solo accesible desde este PC (localhost)
    # port=5000: Puerto estándar de Flask
    # debug=False: Modo producción (sin recarga automática ni mensajes de debug)
    app.run(host="127.0.0.1", port=5000, debug=False)
