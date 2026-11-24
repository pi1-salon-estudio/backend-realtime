import type { Server, Socket } from 'socket.io'
import { anfitrionDe, borrarSala, guardarMensaje, leerEnvio, leerSala, salaExiste } from '../chat/mensajes.js'

export interface RespuestaPing {
  estado: 'ok'
  recibidoEn: string
}

type Ack = (respuesta: unknown) => void

function salasDe(socket: Socket): Set<string> {
  if (!(socket.data.salas instanceof Set)) socket.data.salas = new Set<string>()
  return socket.data.salas as Set<string>
}

function responder(ack: unknown, respuesta: unknown): void {
  if (typeof ack === 'function') (ack as Ack)(respuesta)
}

// Un archivo por grupo de eventos. base:ping comprueba la conexión.
// sala:entrar, sala:salir y chat:enviar son el chat del sprint 3.
// Para llegar aquí el socket ya pasó por exigirSesion: socket.data.uid existe.
export function registrarEventos(io: Server): void {
  io.on('connection', (socket) => {
    console.log(`Conexión ${socket.id} de ${socket.data.uid}. Conectados: ${io.of('/').sockets.size}`)

    socket.on('base:ping', (ack: unknown) => {
      if (typeof ack !== 'function') return
      const respuesta: RespuestaPing = { estado: 'ok', recibidoEn: new Date().toISOString() }
      ack(respuesta)
    })

    socket.on('sala:entrar', async (entrada: unknown, ack: unknown) => {
      const salaId = leerSala(entrada)
      if (!salaId) {
        responder(ack, { ok: false, codigo: 'SALA_NO_ENCONTRADA', mensaje: 'No encontramos una sala con ese ID.' })
        return
      }
      if (!(await salaExiste(salaId))) {
        responder(ack, { ok: false, codigo: 'SALA_NO_ENCONTRADA', mensaje: 'No encontramos una sala con ese ID.' })
        return
      }
      await socket.join(nombreSala(salaId))
      salasDe(socket).add(salaId)
      responder(ack, { ok: true, salaId })
    })

    socket.on('sala:salir', async (entrada: unknown, ack: unknown) => {
      const salaId = leerSala(entrada)
      if (!salaId) {
        responder(ack, { ok: false, codigo: 'SALA_NO_ENCONTRADA', mensaje: 'No encontramos una sala con ese ID.' })
        return
      }
      await socket.leave(nombreSala(salaId))
      salasDe(socket).delete(salaId)
      responder(ack, { ok: true, salaId })
    })

    socket.on('sala:eliminar', async (entrada: unknown, ack: unknown) => {
      const salaId = leerSala(entrada)
      if (!salaId) {
        responder(ack, { ok: false, codigo: 'SALA_NO_ENCONTRADA', mensaje: 'No encontramos una sala con ese ID.' })
        return
      }
      const anfitrion = await anfitrionDe(salaId)
      if (anfitrion === null) {
        responder(ack, { ok: false, codigo: 'SALA_NO_ENCONTRADA', mensaje: 'No encontramos una sala con ese ID.' })
        return
      }
      if (anfitrion !== socket.data.uid) {
        responder(ack, { ok: false, codigo: 'SIN_PERMISO', mensaje: 'Solo quien creó la sala puede cambiarla.' })
        return
      }
      io.to(nombreSala(salaId)).emit('sala:eliminada', { salaId })
      await borrarSala(salaId)
      salasDe(socket).delete(salaId)
      responder(ack, { ok: true, salaId })
    })

    socket.on('chat:enviar', async (entrada: unknown, ack: unknown) => {
      const datos = leerEnvio(entrada)
      if ('error' in datos) {
        const codigo = datos.error.startsWith('Escribe') || datos.error.startsWith('El mensaje puede') ? 'MENSAJE_INVALIDO' : 'SALA_NO_ENCONTRADA'
        responder(ack, { ok: false, codigo, mensaje: datos.error })
        return
      }
      if (!salasDe(socket).has(datos.salaId)) {
        responder(ack, { ok: false, codigo: 'NO_ESTAS_EN_LA_SALA', mensaje: 'Entra a la sala antes de escribir.' })
        return
      }
      const guardado = await guardarMensaje(datos.salaId, datos.texto, String(socket.data.uid))
      if (!guardado.ok) {
        responder(ack, guardado)
        return
      }
      // socket.to no incluye a quien envió. Quien envió usa la respuesta; los demás, el evento.
      socket.to(nombreSala(datos.salaId)).emit('chat:mensaje', guardado.mensaje)
      responder(ack, guardado)
    })

    socket.on('disconnect', (motivo) => {
      console.log(`Desconexión ${socket.id} (${motivo}). Conectados: ${io.of('/').sockets.size}`)
    })
  })
}

function nombreSala(salaId: string): string {
  return `sala:${salaId}`
}
