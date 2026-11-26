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

El token se revisa al conectar, no en cada evento. Entrar a una sala y enviar un mensaje usan el uid guardado en `socket.data.uid`.

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

### `sala:entrar` (US-10, US-11)

Mete la conexión en la sala. Sin este paso, `chat:enviar` no guarda nada. La sala tiene que existir.

| Dirección | Datos que envía | Respuesta (ack) |
|---|---|---|
| Cliente → servidor | `{ "salaId": "7Qk2mXrB9tLwN4pZs1Ha" }` | `{ "ok": true, "salaId": "7Qk2mXrB9tLwN4pZs1Ha", "participantes": [Participante] }` |

Si el ID no existe o no sirve: `{ "ok": false, "codigo": "SALA_NO_ENCONTRADA", "mensaje": "No encontramos una sala con ese ID." }`.

Al entrar, el servidor también emite `sala:participantes` a toda la sala. Entrar dos veces (por ejemplo, al reconectar) no duplica a nadie.

### `sala:salir`

Saca la conexión de la sala. Al desconectarse, Socket.IO también la saca.

| Dirección | Datos que envía | Respuesta (ack) |
|---|---|---|
| Cliente → servidor | `{ "salaId": "7Qk2mXrB9tLwN4pZs1Ha" }` | `{ "ok": true, "salaId": "7Qk2mXrB9tLwN4pZs1Ha" }` |

### `sala:participantes` (US-10)

Lista de quienes están conectados a la sala. Lo emite el servidor a toda la sala cuando alguien entra, sale o se desconecta. Quién entró o salió lo deduce el cliente comparando con la lista anterior.

| Dirección | Datos |
|---|---|
| Servidor → cliente | `{ "salaId": "7Qk2mXrB9tLwN4pZs1Ha", "participantes": [Participante] }` |

`Participante` = `{ "uid", "nombreUsuario", "avatar", "esAnfitrion" }`. Una persona con dos pestañas aparece una vez. El anfitrión va primero y el resto por nombre de usuario. Participante es quien está conectado en ese momento: la lista vive en memoria del servidor, no en Firestore.

### `sala:eliminar` (US-07)

Solo el anfitrión. Avisa a quienes están en la sala y después borra la sala con sus mensajes. Quien no la creó recibe `SIN_PERMISO` y no se borra nada.

| Dirección | Datos que envía | Respuesta (ack) |
|---|---|---|
| Cliente → servidor | `{ "salaId": "7Qk2mXrB9tLwN4pZs1Ha" }` | `{ "ok": true, "salaId": "7Qk2mXrB9tLwN4pZs1Ha" }` |

### `sala:eliminada` (US-07)

Lo emite el servidor a la sala, incluido el anfitrión, antes de borrarla.

| Dirección | Datos |
|---|---|
| Servidor → cliente | `{ "salaId": "7Qk2mXrB9tLwN4pZs1Ha" }` |

La misma operación sin el aviso en vivo está en `DELETE /api/v1/salas/{id}`.

### `chat:enviar` (US-10)

Guarda el mensaje en `salas/{salaId}/mensajes` y lo emite a las demás personas de esa sala. El texto se recorta: vacío o de más de 500 caracteres no se guarda. Hay que haber entrado antes a esa sala. Un mensaje de una sala no llega a otra.

| Dirección | Datos que envía | Respuesta (ack) |
|---|---|---|
| Cliente → servidor | `{ "salaId": "7Qk2mXrB9tLwN4pZs1Ha", "texto": "Nos vemos a las 4." }` | `{ "ok": true, "mensaje": { "id", "salaId", "texto", "autorUid", "nombreUsuario", "creadoEn" } }` |

Errores: `MENSAJE_INVALIDO`, `NO_ESTAS_EN_LA_SALA`, `SALA_NO_ENCONTRADA`, `PERFIL_INCOMPLETO`.

### `chat:mensaje` (US-10)

Lo emite el servidor a quienes están en la sala, menos a quien lo envió. Quien lo envió usa la respuesta de `chat:enviar`.

| Dirección | Datos |
|---|---|
| Servidor → cliente | `{ "id", "salaId", "texto", "autorUid", "nombreUsuario", "creadoEn" }` |

El historial no viaja por aquí. Se lee con `GET /api/v1/salas/{id}/mensajes` en la API.

## Reconexión

Si la red vuelve en menos de dos minutos, Socket.IO recupera las salas y entrega los `chat:mensaje` que faltaron. La sesión se comprueba otra vez. Si pasó más tiempo, el cliente vuelve a emitir `sala:entrar` y carga el historial con la API.
