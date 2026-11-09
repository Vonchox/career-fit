# Career-Fit

Un espacio de orientación para estudiantes de la **Universidad Central del Ecuador (UCE)**, la **Escuela Politécnica Nacional (EPN)** y la **Universidad de las Fuerzas Armadas ESPE**. Se entra directamente al panel, sin registro ni una portada intermedia.

## Demo para el portafolio

[Abrir Career-Fit en GitHub Pages](https://vonchox.github.io/career-fit/). La demo funciona sin cuenta: permite explorar convocatorias, comprobar criterios, revisar requisitos y consultar el asistente de orientación. Los resultados se guardan en el navegador. El inicio de sesión, la sincronización y Gemini requieren la versión con API.

GitHub Actions compila y publica la demo desde `main` cuando cambian el cliente, el catálogo o las reglas compartidas. Para habilitar el flujo por primera vez, elige **GitHub Actions** en **Settings → Pages → Source**. Para probar la misma compilación en local, desde `web/web` ejecuta `npm run build -- --mode pages --base /career-fit/` y luego `npm run preview -- --base /career-fit/`.

## Sin cuenta y con cuenta

- **Sin cuenta:** catálogo por universidad, recursos institucionales, revisión documental en dos pasos, impresión, historial local y asistente de orientación. No se pide nombre, correo, promedio ni archivos; las revisiones no se guardan en la base del servidor.
- **Con cuenta:** historial privado en el servidor y asistente Gemini contextual. Después de iniciar sesión puedes guardar explícitamente una revisión que hiciste como visitante.
- **Google:** integración con Google Identity Services y verificación oficial en el servidor, preparada para activar con un ID de cliente OAuth web. También se conserva el acceso por correo y contraseña, ambos opcionales.

Las guías revisan **preparación documental**, no son listas exhaustivas de elegibilidad ni convocatorias abiertas. No se transfieren reglas de otra universidad a UCE/EPN/ESPE. El catálogo anterior se conserva únicamente para los registros históricos existentes.

## Ejecutar

Node.js compatible con Vite 8; verificado con Node 24.

En una terminal:

```powershell
cd api
npm ci
# Solo si no existe un .env; nunca sobrescribas uno existente.
Copy-Item .env.example .env
npm run db:generate
npm run db:push
npm run db:institutions
npm run dev
```

En otra terminal, desde la raíz:

```powershell
cd web/web
npm ci
npm run dev
```

Abre la URL que muestra Vite. El proxy `/api` conecta con la API en el puerto 3000. Para usar un teléfono en la misma red, abre la URL de red que imprime Vite y permite el puerto en el sistema.

`db:institutions` agrega las guías UCE/EPN/ESPE sin borrar evaluaciones, usuarios ni reglas existentes. La actualización de esquema permite cuentas de Google sin contraseña y revisiones sin datos académicos personales. Se guardó una copia local previa en `.db-backups/`, directorio ignorado por Git. Haz una copia propia antes de aplicar el esquema en otro entorno.

## Acceso con Google

Falta un ID de cliente web para activarlo. [Instrucciones paso a paso](docs/GOOGLE_SIGN_IN.md).

Sin configuración, la interfaz informa que Google aún no está disponible y permite seguir con correo o sin cuenta. No simula un inicio de sesión exitoso. No se limita el acceso a correos institucionales.

## Fuentes y alcance

Las referencias documentales están separadas por universidad en `shared/catalog.json`:

- [UCE: documentos de movilidad estudiantil](https://aka-cdn.uce.edu.ec/ares/w/direcs/dri/Documentos/Movilidad%20Estudiantil%20Requisitos.pdf), referencia publicada por la Dirección de Relaciones Internacionales. Verifica los formatos y condiciones de la convocatoria vigente con la UCE.
- [EPN: movilidad e internacionalización](https://www.epn.edu.ec/movilidad-e-internacionalizacion/), para orientar la preparación inicial de respaldos de actividades académicas. No se garantiza disponibilidad de apoyos.

Career-Fit es un proyecto independiente de portafolio. No representa oficialmente a estas universidades, no valida certificados y no garantiza una beca, plaza o ayuda económica.

- [ESPE: becas de movilidad académica estudiantil](https://www.espe.edu.ec/becas-movilidad-academica-estudiantil/), para preparar los respaldos iniciales y consultar las condiciones oficiales.

## Gemini y configuración

En `api/.env`:

```dotenv
JWT_SECRET=un-secreto-largo-y-aleatorio
GEMINI_API_KEY=tu-clave
GEMINI_MODEL=gemini-3.1-flash-lite
GOOGLE_CLIENT_ID=
```

Google y Gemini son configuraciones distintas. `GOOGLE_CLIENT_ID` es un identificador público de OAuth; `GEMINI_API_KEY` es una clave privada y permanece exclusivamente en la API. No se necesita un secreto de cliente para el flujo de Google Identity Services implementado.

```powershell
cd api
npm run check:ai
npm run check:ai -- --list-models
```

Los visitantes usan una guía contextual basada en los datos del catálogo, sin consumir Gemini. Para cuentas autenticadas se usa Gemini cuando está disponible, con una guía de respaldo ante errores o falta de clave. El chat admite 30 consultas por usuario o IP de visitante cada 15 minutos por proceso.

## Arquitectura

React + Vite, CSS propio, Lucide, React Markdown; Express + Zod, Prisma/SQLite, JWT y `google-auth-library`.

- `shared/catalog.json`: instituciones, fuentes y guías documentales.
- `web/web/src/App.jsx`: entrada pública, selector universitario e historial.
- `web/web/src/components/PreparationForm.jsx`: revisión sin datos personales.
- `web/web/src/components/GoogleSignIn.jsx`: botón oficial de Google, nonce y callback.
- `api/src/routes/google.js`: verificación de identidad y vinculación explícita.
- `api/src/evaluation.js`: motor determinista, independiente de Gemini.
- `api/src/assistant.js`: contexto institucional, Gemini y guía de respaldo.

El historial de visitante y las marcas de documentos se guardan en este navegador; no se sincronizan entre dispositivos. Las cuentas usan historial privado en SQLite. La sesión se almacena en `localStorage`.

## Comprobaciones

```powershell
cd api
npm test
# Desde web/web:
npm run build
npm run format
```

Las pruebas cubren reglas, aislamiento por usuario, consultas anónimas sin escrituras, respuestas sin cuenta, errores de IA, configuración ausente de Google, validación de identidad/nonce y vinculación segura. Google se prueba con un verificador simulado; el acceso real requiere configurar el cliente y completar el consentimiento en el navegador.

## Despliegue

Publica la API con Node y SQLite persistente, genera Prisma y aplica el esquema y `db:institutions`. Usa `NODE_ENV=production` y un `JWT_SECRET` fuerte. `DATABASE_URL` puede cambiar la ubicación de SQLite con una URL Prisma `file:`. Define `CORS_ORIGIN` con los dominios del frontend cuando corresponda.

Para el frontend, define `VITE_API_URL=https://tu-api.example/api` antes de `npm run build` y publica `web/web/dist`. El proxy de Vite solo opera en desarrollo. Registra el dominio público en el cliente de Google.

Móvil y escritorio comparten la misma aplicación web responsive.
