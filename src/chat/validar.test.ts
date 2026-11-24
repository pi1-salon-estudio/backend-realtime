import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { leerEnvio, leerSala } from './mensajes.js'

describe('leerEnvio', () => {
  it('recorta el texto y la sala', () => {
    assert.deepEqual(leerEnvio({ salaId: ' sala1 ', texto: '  hola  ' }), { salaId: 'sala1', texto: 'hola' })
  })

  it('rechaza un mensaje vacío o de solo espacios', () => {
    assert.deepEqual(leerEnvio({ salaId: 'sala1', texto: '   ' }), { error: 'Escribe un mensaje.' })
  })

  it('rechaza un mensaje de más de 500 caracteres', () => {
    const resultado = leerEnvio({ salaId: 'sala1', texto: 'a'.repeat(501) })
    assert.equal('error' in resultado, true)
  })

  it('rechaza una sala que no puede ser un ID', () => {
    assert.deepEqual(leerEnvio({ salaId: 'a/b', texto: 'hola' }), { error: 'No encontramos una sala con ese ID.' })
  })
})

describe('leerSala', () => {
  it('devuelve null si falta el ID', () => {
    assert.equal(leerSala({}), null)
    assert.equal(leerSala(null), null)
  })
})
