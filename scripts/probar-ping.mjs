// Prueba manual del servidor de tiempo real: se conecta, envía base:ping y muestra la respuesta.
// Uso: npm run probar:ping                (local, http://localhost:4000)
//      npm run probar:ping -- <URL>       (por ejemplo, la URL de Render)
import { io } from 'socket.io-client'

const url = process.argv[2] ?? 'http://localhost:4000'
const socket = io(url, { transports: ['websocket'], timeout: 60000 })

const limite = setTimeout(() => {
  console.error(`Sin respuesta de ${url} después de 60 s`)
  process.exit(1)
}, 60000)

socket.on('connect', () => {
  console.log(`Conectado a ${url} con id ${socket.id}`)
  socket.emit('base:ping', (respuesta) => {
    console.log('Respuesta de base:ping:', respuesta)
    clearTimeout(limite)
    socket.close()
  })
})

socket.on('connect_error', (error) => {
  console.error(`No se pudo conectar a ${url}: ${error.message}`)
})
