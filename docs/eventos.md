# Eventos de Socket.IO

Contrato de los eventos en tiempo real entre el frontend y `backend-realtime`. Cualquier evento nuevo se documenta aquí antes de implementarlo.

## Conexión

| Qué | Valor |
|---|---|
| URL en producción | `https://pi1-salon-estudio-realtime.onrender.com` |
| URL en local | `http://localhost:4000` |
| Autenticación | Todavía no. Se agrega cuando exista el inicio de sesión |

## Eventos

### `base:ping` (TS-00)

Comprueba que el frontend llega al servidor de tiempo real.

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
