# Noticias

Agregador web de titulares de ABC, El País, Ideal, Granada Hoy y Xataka. La portada reúne las fuentes activas, permite buscar por palabras y filtrar por medio o categoría, y ofrece una vista de lectura con enlace al artículo original.

## Funcionamiento

- **Portada:** consulta las cinco API en paralelo. Si una fuente falla o no devuelve titulares, se informa y se muestran las demás.
- **Fuentes:** ABC, Ideal y Granada Hoy se obtienen analizando HTML; El País y Xataka emplean RSS. Las páginas individuales de cada fuente están en `/<fuente>`.
- **Categorías:** las rutas `/category/<id>` consultan secciones de ABC, El País e Ideal; las categorías dependen de lo que publique cada medio.
- **Lectura:** `/article?url=...` solicita a `/api/article` el texto HTML disponible, que puede ser parcial. No se requiere ni se proporciona acceso a contenido de pago.
- **Fuentes experimentales:** existen rutas para FAZ y Süddeutsche Zeitung, pero están desactivadas en la portada y en la navegación principal.

## Requisitos y ejecución

Node.js 18.17 o posterior y npm. En la raíz del proyecto:

```bash
npm install
npm run dev
```

Abre `http://localhost:3010`. Para compilar e iniciar en modo producción:

```bash
npm run build
npm start
```

Ambos comandos de inicio de `package.json` usan el puerto 3010. Para desarrollo con Docker Compose, el servicio `news-dev` expone el puerto 3010:

```bash
docker compose up --build news-dev
```

El Dockerfile de producción es independiente y declara el puerto 3000. Antes de usarlo, revisa su construcción: depende de `package-lock.json` para `npm ci` y copia `public/`, que pueden no existir en el repositorio. El servicio de producción de Compose está comentado por defecto.

## Estructura

```text
app/
  api/article/route.ts          Descarga y extracción del artículo
  api/news/<fuente>/route.ts    Obtención de titulares por fuente
  article/page.tsx              Vista de lectura
  category/[id]/page.tsx        Vista de una categoría
  [source]/page.tsx             Vista de una fuente
  page.tsx                      Portada y filtros
  layout.tsx                    Navegación común
  globals.css, editorial.css   Estilos
```

La aplicación activa utiliza Next.js 14, React 18, TypeScript, Axios y jsdom. Los archivos PHP y Python son material anterior o experimental, no forman parte de la aplicación Next.js.

## Seguridad y limitaciones

- El lector de artículos solo admite HTTPS, sin credenciales ni puertos alternativos, en una lista explícita de dominios de los medios incluidos. Conserva la query string y elimina el fragmento.
- La conexión de artículos valida la dirección IPv4 utilizada y rechaza rangos no públicos. No utiliza proxy ni sigue redirecciones automáticas. Esto reduce el riesgo de SSRF, pero puede impedir la lectura de sitios que necesiten redirección o IPv6. No sustituye la restricción de salida de red ni la revisión de seguridad antes de publicar el servicio.
- Los archivos PHP anteriores no han recibido el mismo endurecimiento; **no los expongas a Internet** sin auditarlos.
- El scraping depende de la estructura de cada sitio; los resultados pueden desaparecer o estar incompletos, y los medios pueden bloquear peticiones. La extracción del artículo usa selectores genéricos y no garantiza el texto completo.
- La aplicación no implementa una caché compartida ni un limitador de peticiones. En producción, configura caché, límites y monitorización adecuados a tu despliegue.
- Antes de redistribuir contenido, revisa las condiciones de uso y los derechos de los medios.

## Despliegue

Next.js puede desplegarse en Vercel importando el repositorio, o ejecutarse en un servidor Node. Revisa los límites de ejecución, los recursos y las políticas de red de tu entorno; no hay garantía de que todos los medios permitan el acceso desde una plataforma determinada. Si se despliega en infraestructura compartida o sensible, aísla el servicio y limita el tráfico de salida.

No se especifica una licencia en este README: revisa si existe un archivo de licencia antes de reutilizar o redistribuir el código.
