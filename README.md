# Matriz de Criticidad CRM WhatsApp

Aplicación interactiva y ejecutiva para reuniones de priorización y gestión de pendientes críticos de CRM WhatsApp.

## Características Principales

- **Físicas Tridimensionales (3D Three.js):**
  - Visualización espacial con esferas proporcionales a la criticidad y riesgo.
  - Arrastre interactivo de globos en los ejes X, Y y Z.
  - Magnetismo por afinidad semántica y agrupación temática.
- **Gestión Ejecutiva de Tareas:**
  - Alta de nuevos pendientes y tickets con cálculo automático de criticidad.
  - Edición en caliente de prioridades, responsables, acciones acordadas y evidencias.
  - Modos de visualización: Órbita 3D y Tabla de Matriz Ejecutiva.
- **Sincronización Dual con Google Sheets:**
  - **Sincronización de Documentos Públicos:** Proxy backend dedicado (`/api/sheets/public-read`) para leer e importar hojas compartidas ("Cualquiera con el enlace") sin requerir login.
  - **Pestaña "Pegar / Subir CSV":** Importación inmediata copiando celdas (Ctrl+C / Ctrl+V) o subiendo archivos `.csv`.
  - **Exportación & Actualización Bidireccional:** Creación de nuevas hojas en Google Drive y actualización de estados.

---

## Requisitos y Configuración

- Node.js 18+ o superior
- npm o bun

### Instalación de Dependencias

```bash
npm install
```

### Ejecución en Desarrollo

Inicia el servidor backend de Express con middleware de Vite:

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

### Compilación para Producción

Compila tanto el frontend (Vite) como el servidor backend (esbuild CommonJS autocontenido):

```bash
npm run build
```

### Iniciar en Producción

```bash
npm start
```

---

## Despliegue en Producción

El proyecto está preparado para desplegarse como un contenedor completo o aplicación Node.js en:
- **Cloud Run / Google Cloud**
- **GitHub / GitHub Pages** (frontend estático en `dist/`)
- **Render / Railway / Fly.io / Heroku**
