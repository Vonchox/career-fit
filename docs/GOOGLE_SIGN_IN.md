# Activar «Continuar con Google»

La integración ya está implementada. Falta crear tu ID de cliente OAuth de **Aplicación web**. No necesitas compartir contraseñas ni un secreto de cliente.

1. Abre [Google Cloud Console](https://console.cloud.google.com/) y selecciona o crea un proyecto.
2. En Google Auth Platform, configura la información básica y la audiencia de la aplicación. Si está en modo de prueba, agrega los usuarios de prueba que la utilizarán.
3. Crea un cliente OAuth de tipo **Aplicación web**.
4. En **Orígenes autorizados de JavaScript**, agrega el origen exacto del frontend. Para la vista previa actual: `http://127.0.0.1:5174` y, si lo usas, `http://localhost:5174`. Para el puerto habitual de Vite agrega también sus variantes con `5173`. Los orígenes no incluyen rutas ni barra final.
5. Copia el ID que termina en `.apps.googleusercontent.com` en el `.env` de la API:

```dotenv
GOOGLE_CLIENT_ID=tu-id.apps.googleusercontent.com
```

6. Reinicia la API y vuelve a abrir «Iniciar sesión». El botón oficial se carga únicamente cuando existe configuración.
7. Al publicar, agrega el origen HTTPS de tu web al mismo cliente (o crea otro para producción) y revisa la audiencia y los requisitos de publicación de Google.

El flujo usa una ventana emergente de Google Identity Services con callback JavaScript. No requiere configurar una URL de redirección para este modo ni poner claves secretas en Vite. El ID público se obtiene desde `/api/auth/config`, así que el servidor y el navegador usan la misma configuración.

El servidor verifica firma, audiencia, emisor y vigencia con la biblioteca oficial, y comprueba correo verificado y nonce ligado a un desafío firmado de cinco minutos. Identifica a cada persona por `sub`, no solo por el correo.

Si ya existe una cuenta de Career-Fit con ese correo, primero entra con tu contraseña. En **Mi cuenta**, usa Google para vincularla explícitamente. Se exige el mismo correo y una sesión autenticada; no se fusionan cuentas automáticamente por coincidencia de email.

Sin configuración, Google permanece desactivado con un mensaje claro. La revisión sin cuenta y el acceso por correo siguen disponibles.

Referencia: [configuración de Google Identity Services](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid), [verificación en el servidor](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token).
