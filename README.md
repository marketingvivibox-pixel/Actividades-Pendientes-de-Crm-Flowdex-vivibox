# vivibox - check azul 🔷

Plataforma unificada de gestión de informes de contenido y manuales operativos de Flowdex para **Vivibox**, alineada con el diseño y arquitectura visual de [vivibox-analisis.firebaseapp.com](https://vivibox-analisis.firebaseapp.com/).

---

## 📌 Enfoque y Propósito del Proyecto

Este repositorio alberga la plataforma web de **vivibox - check azul**, diseñada para supervisar el rendimiento del contenido publicitario y orgánico, y centralizar las políticas operativas de atención al cliente y ventas:

1. **Informes de Contenido**:
   - **Informes Interactivos Oficiales (Firebase)**: Integración y visualizador de los informes de desempeño creativo de **Meta Ads** y **TikTok Ads** (score ajustado por evidencia, gráficos de dispersión y hallazgos temporales).
   - **Contenido Orgánico**: Métricas de alcance, visualizaciones, engagement rate (ER), guardados y comentarios de formatos orgánicos (Reels, TikToks, Carruseles y Posts).
   - **Contenido Publicitario**: Supervisión de campañas de pago en Meta Ads (Facebook/Instagram) y TikTok Ads con indicadores clave (CPL, ROAS, leads generados, CTR, inversión y creativos con mejor conversión).
   - Exportación de informes en formato CSV para reportería interna.

2. **Flowdex**:
   - **Política Integral de Flowdex**: SLA, niveles de prioridad (P1 Crítica, P2 Alta, P3 Normal, P4 Baja) y modelo de asignación ponderada (60% Round Robin / 40% Desempeño).
   - **Simulador Interactivo de SLA**: Cálculo instantáneo de tiempos máximos de respuesta y alertas preventivas.
   - **Soporte Multi-Documento**: Capacidad de visualizar, editar en vivo y agregar nuevos documentos HTML de políticas o manuales de atención.

---

## 🎨 Sistema de Diseño (Estilo vivibox-analisis)

El diseño visual está sincronizado con la identidad de marca de Vivibox:
- **Color de Marca Primario**: Rojo Vivibox `#ed1c24` (`--brand`).
- **Tinta y Lienzo**: Fondo off-white `#f7f7f8` con gradiente radial suave (`#fff1f1`), texto principal en ink `#18181b`.
- **Acentos de Plataforma**: Meta Ads `#1877f2` y TikTok Ads `#ff3b78`.
- **Tipografía y Jerarquía**: Display bold con tracking ajustado, acentos eyebrow con barra horizontal roja (`.eyebrow-accent`).
- **Tarjetas de Informe**: Radios generosos de 24px (`rounded-3xl`), sombras profundas (`0 16px 48px rgba(24, 24, 27, 0.08)`) y botones primarios oscuros con animación suave en hover.

---

## 🛠️ Tecnologías Utilizadas

- **React 19** + **TypeScript**
- **Vite 6** (Bundler ultrarrápido)
- **Tailwind CSS v4**
- **Lucide React** (Iconografía limpia y consistente)
- **Motion** (Transiciones fluidas)

---

## 🚀 Instalación y Puesta en Marcha

Para clonar y ejecutar el proyecto localmente:

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/vivibox-check-azul.git

# 2. Ingresar a la carpeta del proyecto
cd vivibox-check-azul

# 3. Instalar dependencias
npm install

# 4. Iniciar el entorno de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

---

## 📁 Estructura del Proyecto

```
/
├── public/
│   ├── vivibox-logo.jpg     # Logo oficial de Vivibox
│   ├── meta.html            # Informe interactivo Meta Ads
│   └── tiktok.html          # Informe interactivo TikTok Ads
├── src/
│   ├── components/
│   │   ├── ContentReports/  # Hub de informes, vistas orgánicas, paid y visor modal
│   │   ├── Flowdex/         # Visor de políticas, simulador SLA e importador
│   │   └── Header.tsx       # Barra de navegación con identidad de marca
│   ├── data/
│   │   ├── flowdexDocs.ts   # Documento oficial de Flowdex y manuales HTML
│   │   └── mockReports.ts   # Datos estructurados de informes orgánicos y paid
│   ├── types.ts             # Definiciones e interfaces TypeScript
│   ├── App.tsx              # Componente raíz de la aplicación
│   ├── index.css            # Tokens de diseño y estilos de vivibox-analisis
│   └── main.tsx             # Punto de entrada de la app
├── index.html               # Plantilla HTML principal
├── metadata.json            # Metadatos del applet
└── package.json             # Dependencias y scripts de construcción
```

---

## 📄 Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo local.
- `npm run build`: Compila los assets de producción optimizados en la carpeta `dist/`.
- `npm run lint`: Valida tipos de TypeScript y sintaxis.

---

## ⚖️ Licencia

Uso interno para **Vivibox** · 2026. Todos los derechos reservados.

