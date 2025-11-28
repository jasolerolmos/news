# News Aggregator - Next.js

Agregador de noticias de ABC.es y El País convertido a Next.js para deployment en Vercel.

## 🚀 Características

- ✅ Scraping de noticias de ABC.es y El País
- ✅ Filtrado por fuente (ABC, El País, Todas)
- ✅ Filtrado por categoría dinámica
- ✅ Búsqueda en tiempo real
- ✅ Diseño responsive y premium
- ✅ Páginas de artículos individuales

## 📋 Requisitos

- Node.js 18+ 
- npm o yarn

## 🛠️ Instalación

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Build para producción
npm run build
npm start
```

La aplicación estará disponible en `http://localhost:3000`

## 🌐 Deploy en Vercel

### Opción 1: Desde Vercel Dashboard

1. Ve a [vercel.com](https://vercel.com)
2. Crea una cuenta o inicia sesión
3. Click en "Add New Project"
4. Importa tu repositorio de GitHub
5. Vercel detectará automáticamente que es un proyecto Next.js
6. Click en "Deploy"

### Opción 2: Con Vercel CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel

# Deploy a producción
vercel --prod
```

## 📁 Estructura del Proyecto

```
/app
  /api
    /news
      /abc          # API para scraping de ABC
        route.ts
      /elpais       # API para scraping de El País
        route.ts
    /article        # API para artículos individuales
      route.ts
  /article          # Página de artículo
    page.tsx
  layout.tsx        # Layout principal
  page.tsx          # Homepage con grid de noticias
  globals.css       # Estilos globales
```

## 🎨 Tecnologías

- **Framework**: Next.js 14 (App Router)
- **Frontend**: React 18 con TypeScript
- **Web Scraping**: Cheerio + Axios
- **Estilos**: CSS vanilla (sin Tailwind para mantener diseño original)
- **Deployment**: Vercel

## 📝 Notas

- Los archivos PHP originales se mantienen en el repositorio para referencia
- El scraping se realiza server-side en las API routes
- No se requiere configuración adicional para Vercel
- Las funciones serverless tienen un timeout de 10s por defecto en Vercel

## ⚠️ Limitaciones

- El scraping puede fallar si los sitios web cambian su estructura HTML
- En el plan gratuito de Vercel, las funciones serverless tienen límites de ejecución
- Algunos sitios pueden bloquear requests automatizados

## 🔧 Configuración Avanzada

Si necesitas ajustar timeouts o configuraciones específicas de Vercel, crea un archivo `vercel.json`:

```json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

## 📄 Licencia

Este proyecto es de código abierto.
