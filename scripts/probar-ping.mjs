// Prueba manual del servidor de tiempo real: se conecta, envía base:ping y muestra la respuesta.
// Uso: npm run probar:ping -- <URL> [token]
//   Sin token:        npm run probar:ping -- https://pi1-salon-estudio-realtime.onrender.com
//   Token inválido:   npm run probar:ping -- https://pi1-salon-estudio-realtime.onrender.com abc
//   Token válido:     npm run probar:ping -- https://pi1-salon-estudio-realtime.onrender.com <ID token>
// Si no se pasa URL, usa http://localhost:4000. El token no se imprime.
import { io } from 'socket.io-client'

const url = process.argv[2] ?? 'http://localhost:4000'
const token = process.argv[3]
const caso = token ? 'con token' : 'sin token'
const socket = io(url, {
  transports: ['websocket'],
  timeout: 60000,
  reconnection: false,
  auth: token ? { token } : {},
})

const limite = setTimeout(() => {
  console.error(`[${caso}] Sin respuesta de ${url} después de 60 s`)
  process.exit(1)
}, 60000)

socket.on('connect', () => {
  console.log(`[${caso}] Conectado a ${url} con id ${socket.id}`)
  socket.emit('base:ping', (respuesta) => {
    console.log(`[${caso}] Respuesta de base:ping:`, respuesta)
    clearTimeout(limite)
    socket.close()
  })
})

socket.on('connect_error', (error) => {
  console.error(`[${caso}] Conexión rechazada por ${url}: ${error.message}`)
  clearTimeout(limite)
  process.exit(2)
})
