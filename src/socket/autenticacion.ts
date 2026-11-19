import type { Server } from 'socket.io'
import { auth } from '../config/firebase.js'

// Corre una vez por conexión, antes de aceptarla. El navegador no deja poner encabezados
// propios en un WebSocket, por eso el ID token llega en handshake.auth y no en Authorization.
// verifyIdToken(token, true) también rechaza tokens revocados, que es lo que hace el cierre
// de sesión de la API. El token nunca se escribe en los logs.
export function exigirSesion(io: Server): void {
  io.use(async (socket, next) => {
    const token = typeof socket.handshake.auth?.token === 'string' ? socket.handshake.auth.token : ''
    if (!token) {
      console.log(`Conexión rechazada ${socket.id}: sin token`)
      next(new Error('NO_AUTORIZADO'))
      return
    }
    try {
      const decodificado = await auth.verifyIdToken(token, true)
      socket.data.uid = decodificado.uid
      next()
    } catch {
      console.log(`Conexión rechazada ${socket.id}: token inválido o revocado`)
      next(new Error('NO_AUTORIZADO'))
    }
  })
}
