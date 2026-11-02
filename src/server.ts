import { createServer } from 'node:http'
import { Server } from 'socket.io'
import { app } from './app.js'
import { env } from './config/env.js'
import { registrarEventos } from './socket/eventos.js'

// Express y Socket.IO comparten el mismo servidor HTTP y el mismo puerto.
// Render solo expone un puerto por servicio.
const httpServer = createServer(app)

const io = new Server(httpServer, {
  // cors solo aplica a las peticiones HTTP de Socket.IO (polling).
  cors: { origin: env.corsOrigins },
  // Los navegadores no aplican CORS a WebSocket, así que el origen se revisa aquí también.
  // Las conexiones sin Origin (scripts, pruebas desde Node) pasan: esto frena a otras
  // páginas web, no reemplaza la autenticación que llega con el inicio de sesión.
  allowRequest: (req, callback) => {
    const origen = req.headers.origin
    callback(null, origen === undefined || env.corsOrigins.includes(origen))
  },
})

registrarEventos(io)

httpServer.listen(env.port, () => {
  console.log(`Realtime escuchando en el puerto ${env.port}`)
})

// Render envía SIGTERM antes de reemplazar el contenedor en cada despliegue.
// Cerrar Socket.IO avisa a los clientes para que se reconecten a la versión nueva.
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando conexiones')
  io.close(() => process.exit(0))
})
