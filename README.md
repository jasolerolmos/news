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
- `/article?url=...` solicita a `/api/article` el texto disponible y ofrece un enlace a la publicación original. Para El País, la API captura el HTML de la respuesta con Chromium headless; para los demás medios mantiene la descarga HTTP anterior. El resultado depende de lo que el servidor entregue y puede ser parcial o bloqueado.
- Las páginas anteriores `/<fuente>` y `/category/<id>` se conservan. La selección y la caché descritas aquí pertenecen a la **portada**; esas rutas independientes mantienen su carga propia. Las categorías por sección consultan ABC, El País e Ideal.

## Docker Compose

El servicio de desarrollo `news-dev` expone la aplicación en `http://localhost:3010`:

```bash
docker compose up -d --build news-dev
```

Para incorporar cambios de código en una copia existente:

```bash
git pull
docker compose up -d --build news-dev
```

La imagen incluye Python, Playwright y Chromium para El País; la primera construcción descarga dependencias y puede tardar. Compose monta el código local en `/app`; el modo de desarrollo recarga los cambios. Si cambian las dependencias, actualízalas dentro del contenedor (el volumen de `node_modules` puede conservar las anteriores):

```bash
docker compose exec news-dev npm install
docker compose restart news-dev
```

El lector no requiere servicios nuevos ni una base de datos. El volumen de dependencias de Node puede conservar paquetes de una imagen anterior; si hay errores tras actualizar Node, reinstala las dependencias dentro del contenedor y reinicia el servicio.

El Dockerfile de producción es independiente y declara el puerto 3000. Depende de `package-lock.json` e instala Chromium para el lector de El País. El servicio de producción de Compose está comentado por defecto.

## Ejecución sin Docker

Node.js 20 o posterior, npm, Python 3 con `venv` y las dependencias de sistema de Chromium. Fuera de Docker instala Playwright y Beautiful Soup en un entorno virtual, instala Chromium con Playwright y configura `ELPAIS_PYTHON` con la ruta al intérprete de ese entorno. Sin estas dependencias, El País mostrará un error; el resto de los medios no necesita Chromium.

Instalación de la aplicación:

```bash
npm install
npm run dev
```

Para compilar e iniciar en producción:

```bash
npm run build
npm start
```

Los scripts de inicio usan el puerto 3010. El proyecto utiliza Next.js 14, React 18, TypeScript, Axios y jsdom. Los archivos PHP y los scripts Python de la raíz son anteriores o experimentales; `scripts/elpais_capture.py` sí forma parte del lector de El País.

## Pruebas

Pruebas de caché, caducidad, peticiones selectivas, recuperación de sesión, fallos y deduplicación, con reloj y red simulados:

```bash
docker compose exec news-dev node --test tests/news-session.test.cjs
```

Sin Docker, después de instalar dependencias:

```bash
node --test tests/news-session.test.cjs
```

Para comprobar el lector de El País con red y navegador simulados:

```bash
node --test tests/article-api.test.cjs
python3 -m unittest discover -s tests -p "*_test.py"
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

scripts/elpais_capture.py     Captura headless y proxy de salida
tests/article-api.test.cjs    Pruebas simuladas de la API de artículos
tests/elpais_capture_test.py  Pruebas simuladas de validación y red
tests/news-session.test.cjs    Pruebas automatizadas de la sesión
```

## Seguridad y limitaciones

- El lector solo admite HTTPS, sin credenciales ni puertos alternativos, en una lista explícita de dominios de medios. Conserva la query string y elimina el fragmento.
- Para medios distintos de El País, valida la dirección IPv4 utilizada y rechaza rangos no públicos; no usa proxy ni sigue redirecciones automáticas. Para El País, Chromium usa un proxy local HTTPS que valida y fija una IPv4 pública en cada conexión, limita los puertos y restringe la navegación principal a los dominios autorizados. La verificación y recursos externos pueden fallar si el sitio cambia. Estas medidas no sustituyen aislamiento del navegador, restricciones de salida de red a nivel de infraestructura ni una revisión de seguridad.
- Solo se ejecuta una captura de El País a la vez por proceso Node; las peticiones simultáneas al mismo artículo comparten la captura. Hay límites de tiempo y tamaño, pero no son globales entre réplicas. Configura un limitador externo si se expone la web.
- Los archivos PHP anteriores no han recibido el mismo endurecimiento: **no los expongas a Internet** sin auditarlos.
- Los sitios pueden cambiar de estructura o bloquear peticiones. La extracción genérica de artículos no garantiza el texto completo.
- No se implementa una caché compartida ni un limitador del servidor. En producción, configura límites y monitorización; aísla el servicio de infraestructura sensible.
- Revisa las condiciones de uso y los derechos de los medios antes de redistribuir contenido.

No se especifica aquí una licencia: comprueba si existe un archivo de licencia antes de reutilizar o redistribuir el código.
