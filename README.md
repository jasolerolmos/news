# Noticias

Agregador web de titulares de ABC, El País, Ideal, Granada Hoy y Xataka, con FAZ y Süddeutsche como fuentes experimentales. Interfaz compacta, sin cabecera promocional, con selección de medios, búsqueda y lectura de artículos.

## Uso de la portada

1. Marca los medios que te interesan y pulsa **Cargar**. En una primera visita no se consultan fuentes automáticamente; ABC y El País aparecen preseleccionados, pero no se descargan hasta pulsar el botón.
2. Solo se consultan los medios seleccionados, en paralelo. Los datos de un medio cargado hace menos de 30 minutos se reutilizan; si añades otro, solo se descarga el nuevo o cualquier seleccionado cuya caché haya caducado.
3. Buscar, filtrar por categoría o filtrar por medio cargado no realiza peticiones. Cambiar las casillas tampoco descarga nada: pulsa **Cargar** para aplicar la selección.
4. **Actualizar cargados** fuerza la descarga de los medios que se están mostrando, incluso si la caché es reciente. No aplica cambios pendientes en las casillas. **Reintentar** también fuerza una actualización de esos medios.
5. Al volver desde una noticia, se recuperan titulares, filtros, selección y posición de desplazamiento. Los titulares anteriores se muestran mientras se actualizan las fuentes caducadas.

### Caché por pestaña

La portada guarda los titulares y su fecha de carga **por medio** en `sessionStorage`, junto con los medios seleccionados y mostrados, búsqueda, categoría y desplazamiento. Los artículos completos no se guardan.

- Cada medio caduca a los **30 minutos desde su última descarga correcta**. La caducidad se comprueba al cargar, regresar a la portada o recuperar el foco de la pestaña; no hay sondeo periódico mientras lees.
- Una recarga de la página recupera la sesión de la pestaña. No se comparte caché entre navegadores o dispositivos. Su duración depende de la sesión y de las opciones de restauración del navegador.
- Si una actualización falla o devuelve inesperadamente cero resultados después de haber obtenido titulares, se conservan los datos anteriores y su fecha, y se informa. El resto de fuentes sigue disponible.
- Si el navegador bloquea el almacenamiento o se supera la cuota, se usa memoria y se muestra una advertencia: una recarga podría perder esos datos.
- Las peticiones simultáneas a un mismo medio se agrupan para evitar duplicados, incluido el modo de desarrollo de React. No se precargan las páginas de artículo desde los enlaces de la portada.

**Estado de los medios** muestra las horas de carga. Esta es una caché del cliente; no sustituye una caché compartida o un limitador de peticiones del servidor.

## Fuentes y rutas

- ABC, Ideal y Granada Hoy analizan HTML; El País y Xataka usan RSS.
- FAZ y Süddeutsche figuran como **experimentales** y no están seleccionados por defecto. Su funcionamiento depende de la disponibilidad de sus sitios y feeds.
- `/article?url=...` solicita a `/api/article` el texto disponible y ofrece un enlace a la publicación original. El resultado puede ser parcial; no se proporciona acceso a contenido de pago.
- Las páginas anteriores `/<fuente>` y `/category/<id>` se conservan. La selección y la caché descritas aquí pertenecen a la **portada**; esas rutas independientes mantienen su carga propia. Las categorías por sección consultan ABC, El País e Ideal.

## Docker Compose

El servicio de desarrollo `news-dev` expone la aplicación en `http://localhost:3010`:

```bash
docker compose up -d --build news-dev
```

Para incorporar cambios de código en una copia existente:

```bash
git pull
docker compose up -d news-dev
```

Compose monta el código local en `/app`; el modo de desarrollo recarga los cambios. Si cambian las dependencias, actualízalas dentro del contenedor (el volumen de `node_modules` puede conservar las anteriores):

```bash
docker compose exec news-dev npm install
docker compose restart news-dev
```

Estos cambios de selección y caché no requieren servicios nuevos, base de datos ni cambios en Compose.

El Dockerfile de producción es independiente y declara el puerto 3000. Antes de usarlo, revisa su construcción: depende de `package-lock.json` para `npm ci` y copia `public/`, que pueden no existir en el repositorio. El servicio de producción de Compose está comentado por defecto.

## Ejecución sin Docker

Node.js 18.17 o posterior y npm:

```bash
npm install
npm run dev
```

Para compilar e iniciar en producción:

```bash
npm run build
npm start
```

Los scripts de inicio usan el puerto 3010. El proyecto utiliza Next.js 14, React 18, TypeScript, Axios y jsdom. Los archivos PHP y Python son anteriores o experimentales, no parte de la aplicación Next.js.

## Pruebas

Pruebas de caché, caducidad, peticiones selectivas, recuperación de sesión, fallos y deduplicación, con reloj y red simulados:

```bash
docker compose exec news-dev node --test tests/news-session.test.cjs
```

Sin Docker, después de instalar dependencias:

```bash
node --test tests/news-session.test.cjs
```

Estas pruebas no sustituyen una compilación completa ni la comprobación en navegador contra los sitios reales.

## Estructura

```text
app/
  api/article/route.ts          Descarga y extracción del artículo
  api/news/<fuente>/route.ts    Obtención de titulares por fuente
  article/page.tsx             Vista de lectura
  category/[id]/page.tsx        Vista anterior de categoría
  [source]/page.tsx             Vista anterior de fuente
  news-session.ts              Caché por medio y persistencia de la portada
  page.tsx                     Selectores, carga bajo demanda y filtros
  layout.tsx                   Estilos y acceso de vuelta
  globals.css, editorial.css, compact.css

tests/news-session.test.cjs    Pruebas automatizadas de la sesión
```

## Seguridad y limitaciones

- El lector solo admite HTTPS, sin credenciales ni puertos alternativos, en una lista explícita de dominios de medios. Conserva la query string y elimina el fragmento.
- Valida la dirección IPv4 utilizada y rechaza rangos no públicos. No usa proxy ni sigue redirecciones automáticas. Esto reduce el riesgo de SSRF, pero puede impedir la lectura de sitios con redirecciones o IPv6. No sustituye restricciones de salida ni una revisión de seguridad.
- Los archivos PHP anteriores no han recibido el mismo endurecimiento: **no los expongas a Internet** sin auditarlos.
- Los sitios pueden cambiar de estructura o bloquear peticiones. La extracción genérica de artículos no garantiza el texto completo.
- No se implementa una caché compartida ni un limitador del servidor. En producción, configura límites y monitorización; aísla el servicio de infraestructura sensible.
- Revisa las condiciones de uso y los derechos de los medios antes de redistribuir contenido.

No se especifica aquí una licencia: comprueba si existe un archivo de licencia antes de reutilizar o redistribuir el código.
