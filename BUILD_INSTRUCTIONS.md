# YonApp - Instrucciones de Compilación

## 📦 Crear Ejecutable

### Método 1: Usando el archivo spec (Recomendado)

```bash
python -m PyInstaller YonApp.spec --clean
```

### Método 2: Comando directo

```bash
python -m PyInstaller run_yonapp.py --name YonApp --onefile --add-data "templates;templates" --add-data "static;static" --hidden-import flask --hidden-import pandas --hidden-import openpyxl
```

## 📂 Ubicación del Ejecutable

Después de compilar, el ejecutable estará en:
```
dist/YonApp.exe
```

## 🚀 Ejecutar la Aplicación

### Modo Desarrollo:
```bash
python run_yonapp.py
```

### Modo Producción (Ejecutable):
1. Navega a la carpeta `dist/`
2. Haz doble clic en `YonApp.exe`
3. Se abrirá automáticamente el navegador en http://127.0.0.1:5000

## 📝 Notas Importantes

### Carpeta `uploads`
- El ejecutable creará automáticamente la carpeta `uploads` en el mismo directorio donde se ejecute
- Esta carpeta almacena los archivos Excel subidos temporalmente

### Console Window
- Por defecto, se muestra una ventana de consola para ver logs
- Para ocultarla, edita `YonApp.spec` y cambia `console=True` a `console=False`

### Icono Personalizado
- Para agregar un icono, coloca un archivo `.ico` en el proyecto
- Edita `YonApp.spec` y cambia `icon=None` a `icon='tu_icono.ico'`

## 🔧 Personalización Avanzada

### Editar YonApp.spec

El archivo `YonApp.spec` contiene la configuración de compilación:

- **`datas`**: Archivos/carpetas a incluir (templates, static)
- **`hiddenimports`**: Módulos que PyInstaller podría no detectar automáticamente
- **`console`**: `True` = mostrar consola, `False` = ocultar
- **`upx`**: Compresión del ejecutable (True = más pequeño)
- **`icon`**: Ruta al archivo de icono `.ico`

### Reducir Tamaño del Ejecutable

Si el `.exe` es muy grande, puedes:

1. **Excluir módulos innecesarios** en `YonApp.spec`:
```python
excludes=['tkinter', 'matplotlib', 'test', 'unittest'],
```

2. **Usar UPX** (ya está habilitado por defecto):
```python
upx=True,
```

3. **Crear un instalador** con NSIS o Inno Setup

## 🐛 Solución de Problemas

### Error: "Failed to execute script"
- Ejecuta en modo consola (`console=True`) para ver el error
- Verifica que todas las dependencias estén en `requirements.txt`

### Error: "Template not found"
- Asegúrate de que `templates` y `static` estén en `datas` del `.spec`
- Verifica que las rutas usen `;` en Windows y `:` en Linux/Mac

### El ejecutable es muy lento al iniciar
- Es normal, PyInstaller descomprime archivos en el primer inicio
- Considera usar `--onedir` en lugar de `--onefile` para startups más rápidos

## 📊 Distribución

Para distribuir tu aplicación:

1. **Opción Simple**: Comparte el archivo `YonApp.exe` de la carpeta `dist/`
   - Los usuarios solo necesitan ejecutar el `.exe`
   - No necesitan Python instalado

2. **Opción Completa**: Crea un instalador con:
   - [Inno Setup](https://jrsoftware.org/isinfo.php) (Windows)
   - [NSIS](https://nsis.sourceforge.io/) (Windows)
   - [pynsist](https://pynsist.readthedocs.io/) (Cross-platform)

## 🔒 Seguridad

⚠️ **Nota**: PyInstaller no ofusca el código, solo empaqueta. Para mayor seguridad:
- Usa [PyArmor](https://pyarmor.dashingsoft.com/) para ofuscar código
- No incluyas credenciales o API keys en el código
- Usa variables de entorno para información sensible

## 📦 Tamaño del Ejecutable

El ejecutable incluye:
- Python runtime completo (~30-50 MB)
- Flask y todas sus dependencias
- Pandas, openpyxl, xlrd
- Templates y archivos estáticos

Tamaño esperado: **~150-200 MB** (varía según dependencias)
