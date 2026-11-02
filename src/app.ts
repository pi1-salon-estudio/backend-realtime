import express from 'express'

// Express solo atiende HTTP: el health check de Render y un 404 con el mismo
// formato de error de la API. Los eventos en tiempo real los maneja Socket.IO.
export const app = express()

app.disable('x-powered-by')

app.get('/health', (_req, res) => {
  res.json({ estado: 'ok' })
})

app.use((_req, res) => {
  res.status(404).json({
    error: { codigo: 'RUTA_NO_ENCONTRADA', mensaje: 'La dirección que buscas no existe.' },
  })
})
