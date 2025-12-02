import os
from threading import Timer
import webbrowser

from app import app  # importa la app Flask desde app.py


def open_browser():
    # Abre automáticamente el navegador en la ruta principal
    webbrowser.open_new("http://127.0.0.1:5000")


if __name__ == "__main__":
    # Asegurarse de que exista la carpeta uploads
    os.makedirs("uploads", exist_ok=True)

    # Abrir navegador 1 segundo después de levantar el servidor
    Timer(1, open_browser).start()

    # Ejecutar Flask en modo producción simple (debug desactivado)
    app.run(host="127.0.0.1", port=5000, debug=False)
