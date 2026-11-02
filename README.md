# backend-realtime

Servidor de tiempo real del Salón de Estudio Colaborativo (Mini-proyecto 2 de Proyecto Integrador I, Universidad del Valle).

Maneja las conexiones de Socket.IO entre los participantes de una sala. Más adelante también va a reenviar la señalización de WebRTC para audio, video y pantalla compartida. Los datos que se guardan (usuarios, salas, mensajes) los maneja [`backend-api`](https://github.com/pi1-salon-estudio/backend-api).

## Enlaces

| Qué | URL |
|---|---|
| Servidor en producción | https://pi1-salon-estudio-realtime.onrender.com |
| Estado del servicio | https://pi1-salon-estudio-realtime.onrender.com/health |
| Contrato de eventos | [`docs/eventos.md`](docs/eventos.md) |

El servidor está en el plan gratuito de Render. Si pasa un rato sin conexiones, Render lo apaga, y la primera conexión después de eso puede tardar cerca de un minuto.

## Tecnologías

Node.js 24, TypeScript, Socket.IO 4, Express 5 (solo para `/health`) y Docker.

## Eventos

El contrato de cada evento (nombre, datos y respuesta) está en [`docs/eventos.md`](docs/eventos.md). Un evento nuevo se documenta ahí antes de implementarlo.

Hoy existe `base:ping`, que sirve para comprobar que el frontend llega a este servidor.

## Variables de entorno

| Variable | Para qué sirve | En local | En Render |
|---|---|---|---|
| `PORT` | Puerto donde escucha el servidor | `4000` | No se define, Render la asigna |
| `CORS_ORIGINS` | Orígenes que pueden conectarse, separados por coma | `http://localhost:5173,http://localhost:8080` | `https://pi1-salon-estudio.vercel.app` |

`CORS_ORIGINS` se revisa en las dos formas de conexión de Socket.IO. En HTTP lo hace la opción `cors`. En WebSocket lo hace `allowRequest`, porque los navegadores no aplican CORS a WebSocket. Las conexiones que no envían origen, como un script de Node, pasan. Esto evita que otra página web se conecte, pero no reemplaza la autenticación, que llega con el inicio de sesión.

## Ejecutar en local

Requisitos: Node.js 24 y npm.

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

El servidor queda en http://localhost:4000. Para comprobar que responde:

```powershell
npm run probar:ping
```

Tiene que mostrar `Respuesta de base:ping: { estado: 'ok', ... }`. Para probar el servidor publicado:

```powershell
npm run probar:ping -- https://pi1-salon-estudio-realtime.onrender.com
```

| Script | Qué hace |
|---|---|
| `npm run dev` | Arranca el servidor con recarga automática al guardar |
| `npm run typecheck` | Revisa los tipos sin generar archivos |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Ejecuta la versión compilada |
| `npm run probar:ping` | Se conecta, envía `base:ping` y muestra la respuesta |

## Ejecutar con Docker

```powershell
docker build -t pi1-backend-realtime .
docker run --rm -p 4000:4000 --env-file .env pi1-backend-realtime
```

Este servicio no necesita la llave de Firebase.

La imagen tiene dos etapas: la primera compila TypeScript y la segunda solo lleva el código compilado y las dependencias de producción. El proceso corre con el usuario `node`, no como root.

Para levantar todos los servicios juntos usa el `docker-compose.yml` del repositorio [`infra`](https://github.com/pi1-salon-estudio/infra).

## Estructura

```
src/
  server.ts        servidor HTTP compartido por Express y Socket.IO, cierre ordenado con SIGTERM
  app.ts           Express: /health y 404
  config/          variables de entorno
  socket/          registro de eventos de Socket.IO
scripts/
  probar-ping.mjs  prueba manual de conexión
docs/
  eventos.md       contrato de eventos
```

## Despliegue

Render construye la imagen con el `Dockerfile` de este repositorio y la despliega cada vez que se fusiona un PR a `main`. Antes de enviarle tráfico a la versión nueva revisa `/health`. El servicio está en la región Virginia, junto a `backend-api`.

En cada despliegue Render envía `SIGTERM` al contenedor anterior. El servidor cierra las conexiones de Socket.IO para que los clientes se reconecten a la versión nueva.

La configuración que vive en Render y no en el repositorio es la variable `CORS_ORIGINS` y el Health Check Path `/health`.

## Cómo contribuir

- `main` está protegida: los cambios entran por PR.
- Una rama por historia o tarea, por ejemplo `feature/TS-00-base-tecnica-realtime`.
- Commits con [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/) (`feat:`, `fix:`, `docs:`, `build:`, `chore:`).
- Cada PR explica qué cambia, cómo se probó y la historia de Jira relacionada.
