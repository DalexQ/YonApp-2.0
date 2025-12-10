# YonApp 2.0 🎓

**Sistema Integral de Gestión Académica**

YonApp 2.0 es una aplicación web desarrollada con Flask que permite a la USS gestionar de manera eficiente sus recursos académicos, incluyendo salas, horarios, carreras y asignaturas.

---

## 📋 Tabla de Contenidos

- [Características Principales](#-características-principales)
- [Limitaciones Actuales](#-limitaciones-actuales)
- [Requisitos del Sistema](#-requisitos-del-sistema)
- [Instalación](#-instalación)
- [Uso de la Aplicación](#-uso-de-la-aplicación)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Módulos y Funcionalidades](#-módulos-y-funcionalidades)
- [Formato de Archivos Excel](#-formato-de-archivos-excel)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Desarrollo Futuro](#-desarrollo-futuro)
- [Mantenimiento](#-mantenimiento)
- [Contribuciones](#-contribuciones)

---

## ✨ Características Principales

### 🏢 Gestión de Salas
- **Monitor de Ocupación**: Visualización en tiempo real del uso de las salas
- **Base de Datos de Salas**: Gestión completa de salas con capacidad y categoría
- **Buscador Inteligente**: Encuentra salas disponibles según día, módulo y categoría
- **Visualizador de Horarios**: Consulta el horario completo de cualquier sala
- **Reportes Especializados**:
  - NRCs sin sala asignada
  - Asignaturas sin docente
- **Asignación Manual**: Permite asignar asignaturas a salas directamente

### 🎓 Planificador Académico
- **Gestión de Carreras**: CRUD completo de carreras con múltiples mallas curriculares
- **Configuración de Períodos**: Alterna entre semestres pares e impares
- **Planificador de Horarios**: Interfaz tipo grilla para planificar horarios por carrera
- **Gestión de Bloques**: Añade, edita o elimina bloques de horario
- **Detección de Conflictos**: Previene choques de horario automáticamente
- **Buscador de Asignaturas**: Localiza rápidamente asignaturas y sus ocurrencias

> **⚠️ NOTA IMPORTANTE**: El módulo de Planificador Académico está actualmente en fase de desarrollo. Para ser completamente funcional requiere:
> - Sistema de autenticación con diferentes tipos de usuario (administrador, coordinador, docente)
> - Implementación de base de datos persistente (actualmente los datos se almacenan en memoria)
> - Arquitectura cliente-servidor para acceso simultáneo de múltiples usuarios
> - La aplicación actual funciona únicamente en un PC local sin capacidad de compartir información entre usuarios

### 📊 Generador de Bloques (Primer Año)
- **Análisis de Vacantes**: Procesa datos de nuevo ingreso
- **Algoritmo Inteligente**: Construye bloques optimizados sin conflictos
- **Visualización de Bloques**: Muestra la composición de cada bloque
- **Horarios Visuales**: Consulta el horario completo de cada bloque generado

> **⚠️ MÓDULO EXPERIMENTAL**: El Generador de Bloques para Primer Año **no funciona correctamente** en su estado actual. Requiere:
> - Múltiples iteraciones de mejora del algoritmo
> - Reuniones con Registro Académico para entender el proceso real de asignación
> - Validación de las reglas de negocio aplicadas
> - Ajustes para que los grupos generados cumplan con los criterios.
> - **No debe utilizarse en producción sin validación previa**

---

## ⚠️ Limitaciones Actuales

### Arquitectura Monousuario
La aplicación actual está diseñada para **uso local en un solo equipo**. Esto significa:

- **Sin persistencia de datos**: Todos los datos (carreras, planificaciones, asignaciones) se almacenan **en memoria** y se pierden al cerrar la aplicación
- **Sin acceso remoto**: No es posible acceder a la aplicación desde otros dispositivos en la red
- **Sin colaboración simultánea**: Múltiples usuarios no pueden trabajar al mismo tiempo en la planificación
- **Sin sincronización**: Los cambios no se comparten entre diferentes instancias de la aplicación

### Módulo de Planificador Académico (En Desarrollo)
El módulo de gestión de carreras y planificación académica está en **fase experimental** y requiere mejoras significativas:

#### Funcionalidades Pendientes
- **Sistema de Autenticación**:
  - Login con usuarios y contraseñas
  - Roles de usuario (Administrador, Coordinador Académico, Secretaria Académica, Docente)
  - Permisos diferenciados según el rol

- **Base de Datos Persistente**:
  - Migración de almacenamiento en memoria a base de datos (PostgreSQL/MySQL)
  - Respaldo automático de datos
  - Historial de cambios y versiones

- **Arquitectura Cliente-Servidor**:
  - Despliegue en servidor web
  - Acceso simultáneo de múltiples usuarios
  - Sistema de bloqueo para evitar conflictos de edición
  - Notificaciones en tiempo real

### Generador de Bloques 1° Año (Requiere Trabajo)
El algoritmo actual de generación de bloques para estudiantes de primer año presenta **inconsistencias** y no genera resultados confiables:

#### Problemas Identificados
- ❌ El algoritmo no refleja el proceso real de Registro Académico
- ❌ Las reglas de asignación de estudiantes a secciones necesitan validación
- ❌ Los criterios de optimización no están alineados con las políticas institucionales
- ❌ Falta validación de casos especiales y excepciones

#### Trabajo Requerido
1. **Levantamiento de Requerimientos**: Reuniones con Registro Académico para documentar el proceso real
2. **Rediseño del Algoritmo**: Ajustar la lógica según las reglas institucionales validadas
3. **Casos de Prueba**: Crear dataset de prueba con resultados esperados conocidos
4. **Validación Iterativa**: Múltiples ciclos de ajuste y validación con datos reales
5. **Documentación de Reglas**: Documentar todas las restricciones y criterios aplicados

> **⚠️ NO USAR EN PRODUCCIÓN**: Este módulo debe considerarse una prueba de concepto y no debe utilizarse para asignación real de estudiantes sin antes completar el proceso de validación.

#### Módulos Funcionales (Completamente Operativos)
✅ **Gestión de Salas**: Totalmente funcional para uso local  
✅ **Buscador de Salas**: Operativo con todas sus características  
✅ **Visualizador de Horarios**: Completamente funcional  
✅ **Reportes de NRCs y Docentes**: Operativos

---

## 💻 Requisitos del Sistema

### Software Necesario
- **Python**: 3.8 o superior
- **Navegador Web**: Chrome, Firefox, Edge (versiones recientes)
- **Sistema Operativo**: Windows, macOS o Linux

### Dependencias Python
```
Flask==3.0.0
pandas
openpyxl
```

---

## 🚀 Instalación

### 1. Clonar o Descargar el Repositorio

```powershell
git clone https://github.com/DalexQ/YonApp-2.0.git
cd YonApp-2.0
```

### 2. Crear un Entorno Virtual (Recomendado)

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 3. Instalar Dependencias

```powershell
pip install -r requirements.txt
```

### 4. Ejecutar la Aplicación

**Modo Desarrollo (con recarga automática):**
```powershell
python app.py
```

**Modo Usuario (abre automáticamente el navegador):**
```powershell
python run_yonapp.py
```

### 5. Acceder a la Aplicación

Abre tu navegador y navega a:
```
http://127.0.0.1:5000
```

---

## 📖 Uso de la Aplicación

### Inicio de Sesión
1. Ingresa tu nombre de usuario (cualquiera, es solo para registro)
2. Haz clic en "Iniciar Sesión"

### Importación de Datos

#### Módulo de Salas
1. Ve a **"Módulo de Salas"** → **"Importación de Datos"**
2. Selecciona tu archivo Excel con los horarios
3. Haz clic en **"Subir Archivo"**
4. Espera a que se procese el archivo
5. Automáticamente se abrirá el **"Monitor de Ocupación"**

#### Módulo de Bloques (Primer Año)
1. Ve a **"Planificador Académico"** → **"Generador de Bloques 1° Año"**
2. Selecciona el archivo Excel con datos de nuevo ingreso
3. Haz clic en **"Cargar"**
4. Selecciona la carrera a analizar
5. Haz clic en **"Generar Bloques"**

### Gestión de Carreras
1. Ve a **"Planificador Académico"** → **"Carreras"**
2. Haz clic en **"+ Añadir Carrera"**
3. Completa el formulario:
   - Código de la carrera (ej: ICIF)
   - Nombre completo
   - Número de semestres
   - Mallas curriculares activas
4. Guarda los cambios

### Planificación de Horarios
1. Ve a **"Planificador Académico"** → **"Planificador de Horarios"**
2. Selecciona la carrera, malla y semestre
3. Haz clic en **"+ Añadir Bloque"**
4. Completa la información:
   - Código de materia y número de curso
   - NRC y sección (con autocompletado)
   - Tipo de actividad (TEO, LAB, TAL, SIM)
   - Días y módulos
5. Guarda el bloque

---

## 📁 Estructura del Proyecto

```
YonApp-2.0/
│
├── app.py                      # Aplicación principal Flask
├── run_yonapp.py              # Script de ejecución con navegador
├── requirements.txt           # Dependencias del proyecto
├── README.md                  # Este archivo
├── BUILD_INSTRUCTIONS.md      # Instrucciones de construcción
│
├── blueprints/                # Módulos de la aplicación
│   ├── __init__.py
│   ├── rooms.py              # Lógica de salas y horarios
│   ├── careers.py            # Lógica de carreras y planificación
│   └── groups.py             # Lógica de bloques de primer año
│
├── static/                    # Archivos estáticos
│   ├── css/
│   │   └── styles.css        # Estilos principales
│   ├── images/               # Imágenes y recursos visuales
│   └── js/
│       ├── main.js           # Lógica global y navegación
│       ├── rooms.js          # Funciones del módulo de salas
│       ├── careers.js        # Funciones del módulo de carreras
│       ├── subjects.js       # Buscador de asignaturas
│       ├── groups.js         # Generador de bloques
│       └── rooms_reports.js  # Reportes especializados
│
├── templates/                 # Plantillas HTML
│   ├── index.html            # Plantilla principal
│   ├── components/           # Componentes reutilizables
│   │   ├── head.html
│   │   ├── header.html
│   │   ├── sidebar.html
│   │   └── scripts_include.html
│   └── views/                # Vistas de cada módulo
│       ├── dashboard.html
│       ├── upload.html
│       ├── timetable.html
│       ├── occupancy.html
│       ├── finder.html
│       ├── unassigned_nrcs.html
│       ├── no_teacher.html
│       ├── career_list.html
│       ├── career_schedule.html
│       ├── career_groups.html
│       └── subject_list.html
│
└── uploads/                   # Carpeta para archivos cargados
```

---

## 🛠 Módulos y Funcionalidades

### Módulo de Salas (`blueprints/rooms.py`)

#### Endpoints Principales
- `POST /upload` - Carga y procesa archivos Excel de horarios
- `POST /add_room` - Añade una nueva sala al sistema
- `POST /delete_room` - Elimina una sala
- `POST /assign_subject` - Asigna manualmente una asignatura a una sala
- `POST /delete_assignment` - Elimina una asignación
- `GET /unassigned_nrcs` - Obtiene NRCs sin sala
- `GET /rooms_without_teacher` - Obtiene asignaturas sin docente

#### Funciones Clave
- `process_schedule()` - Procesa y expande el horario desde Excel
- `get_affected_modules()` - Determina qué módulos ocupa una clase
- `calculate_occupancy_color()` - Calcula el estado de ocupación

### Módulo de Carreras (`blueprints/careers.py`)

#### Endpoints Principales
- `GET /get_careers` - Obtiene todas las carreras
- `POST /set_planning_period` - Configura el período (semestre par/impar)
- `POST /save_career` - Crea o actualiza una carrera
- `POST /delete_career` - Elimina una carrera
- `POST /add_block` - Añade un bloque de horario
- `POST /edit_block` - Edita un bloque existente
- `POST /delete_planning_block` - Elimina un bloque

#### Base de Datos de Carreras
La aplicación incluye 22 carreras preconfiguradas con sus respectivas mallas:
- Enfermería, Kinesiología, Medicina Veterinaria
- Ingenierías (Comercial, Civil Industrial, Civil Informática)
- Pedagogías (Educación Diferencial, Educación en Inglés)
- Ciencias de la Salud (Odontología, Fonoaudiología, Psicología, etc.)

### Módulo de Bloques (`blueprints/groups.py`)

#### Endpoint Principal
- `POST /groups/upload` - Procesa Excel de nuevo ingreso

#### Algoritmo de Generación
1. Filtra estudiantes de nuevo ingreso (NI)
2. Identifica todas las combinaciones materia-tipo
3. Encuentra secciones con vacantes disponibles
4. Detecta y evita conflictos de horario
5. Calcula el tamaño óptimo del bloque (mínimo de vacantes)
6. Genera múltiples bloques hasta agotar recursos

---

## 📊 Formato de Archivos Excel

### Excel de Horarios (Para Módulo de Salas)

**Columnas Requeridas:**
- `NOMBRE` o `nombre_asignatura` - Nombre de la asignatura
- `SALA` o `ubicacion` - Código de la sala
- `HR_INICIO` o `inicio` - Hora de inicio (ej: 08:00)
- `HR_FIN` o `fin` - Hora de término (ej: 09:20)
- `NRC` - Número de referencia del curso
- `SECCION` o `sección` - Sección del curso

**Columnas Opcionales:**
- `CARRERA` o `carrera_reserva` - Código de la carrera
- `MATERIA` o `codigo_materia` - Código de la materia
- `N_CURSO` - Número de curso
- `COMPONENTE` - Tipo (TEO, LAB, TAL, SIM)
- `NOMBRE_` o `prof_nombre` - Nombre del profesor
- `APELLIDO` o `prof_apellido` - Apellido del profesor
- `CUPO_DISP` o `vacantes` - Vacantes disponibles
- `FECHA_INI` - Fecha de inicio
- `FECHA_TERM` - Fecha de término

**Columnas de Días:**
- `LUNES`, `MARTES`, `MIERCOLES`, `JUEVES`, `VIERNES`, `SABADO`
- Valor: `X` o cualquier texto si la clase ocurre ese día

### Excel de Bloques (Para Generador de Primer Año)

**Columnas Adicionales Requeridas:**
- `NI_AN` - Debe contener "NI" para nuevo ingreso
- `VACANTES` o `CUPO_DISP` - Número de vacantes disponibles
- `TIPO` o `COMPONENTE` - Tipo de actividad (TEO, LAB, TAL, SIM)

---

## 🔧 Tecnologías Utilizadas

### Backend
- **Flask 3.0.0** - Framework web de Python
- **Pandas** - Procesamiento de datos
- **Openpyxl** - Lectura de archivos Excel

### Frontend
- **HTML5** - Estructura
- **Tailwind CSS** - Estilos y diseño responsivo
- **JavaScript (Vanilla)** - Lógica del cliente
- **Lucide Icons** - Iconografía
- **Chart.js** - Gráficos y visualizaciones

### Arquitectura
- **Patrón MVC** - Separación de responsabilidades
- **Blueprints de Flask** - Modularización del código
- **Sistema de Componentes** - Reutilización de templates

---

## 🔍 Mantenimiento

### Añadir una Nueva Sala

**Opción 1: Interfaz Web**
1. Ve a "Monitor de Ocupación"
2. Haz clic en "+ Añadir Sala"
3. Completa el formulario

**Opción 2: Código (permanente)**
Edita `blueprints/rooms.py` y añade a `ROOM_DATABASE`:
```python
"CODIGO": {"cap": 50, "cat": "Sala"}
```

### Actualizar Lista de Carreras

Edita `blueprints/careers.py` en la sección `CAREER_DATABASE`:
```python
"CODE": {
    "nombre": "Nombre de la Carrera",
    "semestres": 10,
    "mallas": ["2024", "2025"],
    "planificacion": []
}
```

### Añadir Código de Materia Válido

Edita `static/js/careers.js` en el array `VALID_SUBJECT_CODES`:
```javascript
const VALID_SUBJECT_CODES = [
    'OBMA', 'MEVE', 'TMED', // ... existentes
    'NUEVO' // Tu nuevo código
];
```

### Limpieza de Datos

Para limpiar todos los datos cargados:
1. Detén el servidor
2. Elimina el contenido de la carpeta `uploads/`
3. Reinicia el servidor

---

## 🚀 Desarrollo Futuro

### Roadmap de Mejoras

#### Fase 1: Base de Datos y Persistencia (Prioridad Alta)
- [ ] Implementar base de datos relacional (PostgreSQL)
- [ ] Migrar `ROOM_DATABASE` y `CAREER_DATABASE` a tablas SQL
- [ ] Sistema de migraciones de base de datos
- [ ] Respaldo automático y restauración de datos

#### Fase 2: Autenticación y Autorización (Prioridad Alta)
- [ ] Sistema de login con Flask-Login
- [ ] Gestión de usuarios con roles
  - **Administrador**: Acceso total al sistema
  - **Coordinador Académico**: Gestión de carreras y planificación
  - **Secretaria Académica**: Visualización y reportes
  - **Docente**: Consulta de horarios propios
- [ ] Permisos granulares por módulo
- [ ] Registro de auditoría de cambios

#### Fase 2.5: Corrección del Generador de Bloques (Prioridad Alta) 🔴
- [ ] **Reuniones con Registro Académico**
  - Documentar proceso actual de asignación de bloques
  - Identificar todas las reglas de negocio aplicadas
  - Validar criterios de priorización de estudiantes
- [ ] **Rediseño del Algoritmo**
  - Implementar reglas validadas por Registro Académico
  - Considerar casos especiales (becas, electivos, convalidaciones)
  - Optimización considerando restricciones reales
- [ ] **Testing Exhaustivo**
  - Crear casos de prueba con datos históricos
  - Validar resultados con expertos de Registro Académico
  - Comparar outputs con asignaciones reales previas
- [ ] **Documentación Completa**
  - Manual de usuario para operadores de Registro Académico
  - Documentación técnica del algoritmo implementado
  - Casos de uso y limitaciones conocidas

#### Fase 3: Arquitectura Multiusuario (Prioridad Media)
- [ ] Despliegue en servidor web (AWS/Heroku/DigitalOcean)
- [ ] WebSockets para actualizaciones en tiempo real
- [ ] Sistema de bloqueo optimista para edición concurrente
- [ ] Notificaciones push para cambios importantes
- [ ] Chat interno entre coordinadores

#### Fase 4: Funcionalidades Avanzadas (Prioridad Baja)
- [ ] Exportación de horarios a PDF/ICS (calendario)
- [ ] Integración con sistemas académicos externos (ERP)
- [ ] Dashboard analítico con métricas avanzadas
- [ ] App móvil (React Native)
- [ ] API REST pública para integraciones
- [ ] Sistema de reportería avanzada
- [ ] Notificaciones por correo electrónico
- [ ] Versión offline con sincronización
-

## 🤝 Contribuciones

### Cómo Contribuir
1. Haz un Fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/NuevaFuncionalidad`)
3. Commit tus cambios (`git commit -m 'Añade nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/NuevaFuncionalidad`)
5. Abre un Pull Request

---

## 📝 Notas Adicionales

### Módulos del Horario
La aplicación utiliza 8 módulos académicos:
- **M1**: 08:00 - 09:20
- **M2**: 09:30 - 10:50
- **M3**: 11:00 - 12:20
- **M4**: 12:30 - 13:50
- **M5**: 14:00 - 15:20
- **M6**: 15:30 - 16:50
- **M7**: 17:00 - 18:20
- **M8**: 18:30 - 19:50

### Tipos de Componentes
- **TEO**: Teórico (azul)
- **LAB**: Laboratorio (naranja)
- **TAL**: Taller (verde)
- **SIM**: Simulación (púrpura)

### Estados de Ocupación
- **Libre**: < 15 bloques ocupados (verde)
- **Normal**: 15-29 bloques ocupados (amarillo)
- **Saturada**: ≥ 30 bloques ocupados (rojo)

---

**Desarrollado con ❤️ para mejorar la gestión académica**
