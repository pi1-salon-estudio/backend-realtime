import type { Server } from 'socket.io'

export interface RespuestaPing {
  estado: 'ok'
  recibidoEn: string
}

// Un archivo por grupo de eventos. En S0 solo existe base:ping, que sirve
// para comprobar de punta a punta que el frontend llega a este servidor.
export function registrarEventos(io: Server): void {
  io.on('connection', (socket) => {
    console.log(`Conexión ${socket.id}. Conectados: ${io.of('/').sockets.size}`)

    socket.on('base:ping', (ack: unknown) => {
      // El cliente decide si espera respuesta. Si no manda función, no se responde
      // y el servidor no se cae por intentar llamar algo que no es función.
      if (typeof ack !== 'function') return
      const respuesta: RespuestaPing = { estado: 'ok', recibidoEn: new Date().toISOString() }
      ack(respuesta)
    })

    socket.on('disconnect', (motivo) => {
      console.log(`Desconexión ${socket.id} (${motivo}). Conectados: ${io.of('/').sockets.size}`)
    })
  })
}
