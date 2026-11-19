# Eventos de Socket.IO

Contrato de los eventos en tiempo real entre el frontend y `backend-realtime`. Cualquier evento nuevo se documenta aquí antes de implementarlo.

## Conexión

| Qué | Valor |
|---|---|
| URL en producción | `https://pi1-salon-estudio-realtime.onrender.com` |
| URL en local | `http://localhost:4000` |
| Autenticación | Obligatoria. El cliente envía el ID token de Firebase en `auth.token` al conectarse |

## Autenticación (TS-02)

El servidor solo acepta conexiones con sesión. El cliente manda el ID token de Firebase en el handshake:

```ts
const socket = io(URL, {
  auth: (cb) => usuario.getIdToken().then((token) => cb({ token })),
})
```

Se pasa `auth` como función para que cada reconexión pida un token vigente. Un ID token dura una hora.

| Caso | Resultado en el cliente |
|---|---|
| Sin token | `connect_error` con `message: "NO_AUTORIZADO"` |
| Token inválido, vencido o revocado (por ejemplo, después de cerrar sesión) | `connect_error` con `message: "NO_AUTORIZADO"` |
| Token válido | `connect`. El servidor guarda el uid en `socket.data.uid` |

Cuando el servidor rechaza la conexión, el cliente no reintenta solo. El frontend decide si vuelve a conectar, por ejemplo después de refrescar el token.

El token se revisa al conectar, no en cada evento. Los eventos que necesiten permisos (unirse a una sala, enviar mensajes, Sprint 3) los revisan con `socket.data.uid`.

## Eventos

### `base:ping` (TS-00)

Comprueba que el frontend llega al servidor de tiempo real. Desde el Sprint 2 solo funciona con sesión.

| Dirección | Datos que envía | Respuesta (ack) |
|---|---|---|
| Cliente → servidor | Ninguno | `{ "estado": "ok", "recibidoEn": "2026-11-02T22:00:00.000Z" }` |

Ejemplo desde el cliente:

```ts
socket.emit('base:ping', (respuesta) => {
  console.log(respuesta.estado) // "ok"
})
```

Si el cliente no manda función de respuesta, el servidor ignora el evento.
