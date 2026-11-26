import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { armarParticipantes } from './presencia.js'

const ana = { uid: 'a', perfil: { nombreUsuario: 'ana_r', avatar: 'pino' } }
const luis = { uid: 'l', perfil: { nombreUsuario: 'luis_p', avatar: 'exito' } }
const marta = { uid: 'm', perfil: { nombreUsuario: 'marta_g', avatar: 'piedra' } }

describe('armarParticipantes', () => {
  it('cuenta una vez a quien tiene dos pestañas', () => {
    assert.equal(armarParticipantes([luis, luis, ana], 'a').length, 2)
  })

  it('pone primero al anfitrión y el resto por nombre', () => {
    const lista = armarParticipantes([marta, luis, ana], 'a').map((p) => p.nombreUsuario)
    assert.deepEqual(lista, ['ana_r', 'luis_p', 'marta_g'])
  })

  it('marca solo al anfitrión', () => {
    const lista = armarParticipantes([ana, luis], 'a')
    assert.deepEqual(
      lista.map((p) => p.esAnfitrion),
      [true, false],
    )
  })

  it('ignora una conexión sin uid', () => {
    assert.equal(armarParticipantes([{}, luis], 'a').length, 1)
  })
})
