import { Timestamp } from 'firebase-admin/firestore'
import { db } from '../config/firebase.js'

const LARGO_MAXIMO = 500

export interface Mensaje {
  id: string
  salaId: string
  texto: string
  autorUid: string
  nombreUsuario: string
  creadoEn: string
}

export type Resultado =
  | { ok: true; mensaje: Mensaje }
  | { ok: false; codigo: string; mensaje: string }

function idValido(id: string): boolean {
  return id.length > 0 && id.length <= 1500 && !id.includes('/') && id !== '.' && id !== '..'
}

export function leerEnvio(entrada: unknown): { salaId: string; texto: string } | { error: string } {
  if (typeof entrada !== 'object' || entrada === null) return { error: 'El mensaje no tiene el formato esperado.' }
  const salaId = 'salaId' in entrada && typeof entrada.salaId === 'string' ? entrada.salaId.trim() : ''
  const texto = 'texto' in entrada && typeof entrada.texto === 'string' ? entrada.texto.trim() : ''
  if (!idValido(salaId)) return { error: 'No encontramos una sala con ese ID.' }
  if (!texto) return { error: 'Escribe un mensaje.' }
  if (texto.length > LARGO_MAXIMO) return { error: `El mensaje puede tener hasta ${LARGO_MAXIMO} caracteres.` }
  return { salaId, texto }
}

export function leerSala(entrada: unknown): string | null {
  if (typeof entrada !== 'object' || entrada === null || !('salaId' in entrada) || typeof entrada.salaId !== 'string') {
    return null
  }
  const salaId = entrada.salaId.trim()
  return idValido(salaId) ? salaId : null
}

export async function salaExiste(salaId: string): Promise<boolean> {
  const sala = await db.collection('salas').doc(salaId).get()
  return sala.exists
}

export async function anfitrionDe(salaId: string): Promise<string | null> {
  const sala = await db.collection('salas').doc(salaId).get()
  if (!sala.exists) return null
  return String(sala.data()?.anfitrionUid ?? '')
}

export async function borrarSala(salaId: string): Promise<void> {
  await db.recursiveDelete(db.collection('salas').doc(salaId))
}

export async function guardarMensaje(salaId: string, texto: string, autorUid: string): Promise<Resultado> {
  const perfil = await db.collection('usuarios').doc(autorUid).get()
  const nombreUsuario = perfil.exists ? String(perfil.data()?.nombreUsuario ?? '').trim() : ''
  if (!nombreUsuario) {
    return { ok: false, codigo: 'PERFIL_INCOMPLETO', mensaje: 'Elige un nombre de usuario para continuar.' }
  }
  if (!(await salaExiste(salaId))) {
    return { ok: false, codigo: 'SALA_NO_ENCONTRADA', mensaje: 'No encontramos una sala con ese ID.' }
  }
  const ref = db.collection('salas').doc(salaId).collection('mensajes').doc()
  const creadoEn = Timestamp.now()
  await ref.set({ texto, autorUid, nombreUsuario, creadoEn })
  return {
    ok: true,
    mensaje: { id: ref.id, salaId, texto, autorUid, nombreUsuario, creadoEn: creadoEn.toDate().toISOString() },
  }
}
