import type { Server, Socket } from 'socket.io'
import { db } from '../config/firebase.js'

// Lista de participantes de una sala (US-10, S3-C04). Participante = quien está
// conectado ahora (decisión 3 del UX Lead): vive en memoria, no en Firestore.

export interface Participante {
  uid: string
  nombreUsuario: string
  avatar: string
  esAnfitrion: boolean
}

interface PerfilEnSocket {
  nombreUsuario: string
  avatar: string
}

interface DatosDeSocket {
  uid?: unknown
  perfil?: PerfilEnSocket
}

// El perfil se lee una vez por conexión y queda en socket.data, que Socket.IO
// también recupera si la red vuelve antes de dos minutos.
export async function cargarPerfil(socket: Socket): Promise<void> {
  if (socket.data.perfil) return
  const documento = await db.collection('usuarios').doc(String(socket.data.uid)).get()
  const datos = documento.data() ?? {}
  socket.data.perfil = {
    nombreUsuario: String(datos.nombreUsuario ?? '').trim() || 'Sin nombre de usuario',
    avatar: String(datos.avatar ?? 'pino'),
  } satisfies PerfilEnSocket
}

// Una persona con dos pestañas cuenta una vez. El anfitrión va primero y el resto por nombre.
export function armarParticipantes(conexiones: DatosDeSocket[], anfitrionUid: string): Participante[] {
  const porUid = new Map<string, Participante>()
  for (const datos of conexiones) {
    const uid = String(datos.uid ?? '')
    if (!uid || porUid.has(uid)) continue
    porUid.set(uid, {
      uid,
      nombreUsuario: datos.perfil?.nombreUsuario ?? 'Sin nombre de usuario',
      avatar: datos.perfil?.avatar ?? 'pino',
      esAnfitrion: uid === anfitrionUid,
    })
  }
  return [...porUid.values()].sort((a, b) =>
    a.esAnfitrion === b.esAnfitrion ? a.nombreUsuario.localeCompare(b.nombreUsuario, 'es') : a.esAnfitrion ? -1 : 1,
  )
}

// Emite la lista a toda la sala y la devuelve para usarla en el ack de sala:entrar.
// Quien entra o sale lo deduce el cliente comparando con la lista anterior.
export async function avisarParticipantes(io: Server, salaId: string, anfitrionUid: string): Promise<Participante[]> {
  const conexiones = await io.in(`sala:${salaId}`).fetchSockets()
  const participantes = armarParticipantes(
    conexiones.map((s) => s.data as DatosDeSocket),
    anfitrionUid,
  )
  io.to(`sala:${salaId}`).emit('sala:participantes', { salaId, participantes })
  return participantes
}
