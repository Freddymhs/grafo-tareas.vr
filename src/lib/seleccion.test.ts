import { describe, expect, it } from 'vitest'
import { EstadoNodo, Pbi, TipoConexion, TipoNodo, type Nodo } from './dominio'
import { avisoDePbi, quienesEsperan, resumenDeEspera, resumenDeQuienEspera } from './seleccion'

describe('resumenDeEspera — qué dice la selección sobre lo que la frena (FASE 15)', () => {
  it('una sola cosa: su nombre, que sí sirve leer', () => {
    expect(resumenDeEspera(['¿qué preguntas?'])).toBe('Espera a: ¿qué preguntas?')
  })

  it('varias: solo cuántas, porque se iluminan alrededor (la lista larga tapaba la vista)', () => {
    const diecisiete = Array.from(
      { length: 17 },
      (_, i) => `[2593${i}] FASE ${i} · falta URL commit`,
    )
    expect(resumenDeEspera(diecisiete)).toBe('Espera a 17 — se iluminan alrededor')
  })

  it('nada: libre', () => {
    expect(resumenDeEspera([])).toBe('Libre: nada lo frena')
  })
})

describe('quienesEsperan — a una persona la esperan; no la frena nada (Freddy, 2026-10-18)', () => {
  const nodo = (id: string, tipo: TipoNodo, estado: EstadoNodo = EstadoNodo.ABIERTO): Nodo => ({
    id,
    tipo,
    titulo: id,
    estado,
  })
  const espera = (origenId: string) => ({
    id: `${origenId}->carabantes`,
    origenId,
    destinoId: 'carabantes',
    tipo: TipoConexion.ESPERA_RESPUESTA_DE,
  })
  const grafo = {
    nodos: [
      nodo('carabantes', TipoNodo.PERSONA),
      nodo('¿En Validación es estado de qué?', TipoNodo.DUDA),
      nodo('¿5 días hábiles o corridos?', TipoNodo.DUDA),
      nodo('BLOQUEO A2, ya contestado', TipoNodo.TAREA, EstadoNodo.CERRADO),
    ],
    conexiones: [
      espera('¿En Validación es estado de qué?'),
      espera('¿5 días hábiles o corridos?'),
      espera('BLOQUEO A2, ya contestado'),
    ],
  }

  it('cuenta solo lo abierto, y lo dice al revés que a una tarea', () => {
    const esperan = quienesEsperan('carabantes', grafo)
    expect(esperan).toHaveLength(2)
    expect(resumenDeQuienEspera(esperan)).toBe('La esperan 2 — se iluminan alrededor')
    expect(resumenDeQuienEspera(['¿5 días?'])).toBe('La espera: ¿5 días?')
    expect(resumenDeQuienEspera([])).toBe('Nadie la espera')
  })
})

describe('avisoDePbi — qué mitad le falta a un PBI a medias', () => {
  it('la tarjeta sin FASE, la FASE sin task; un PBI entero no avisa', () => {
    expect(avisoDePbi({ tipo: TipoNodo.TAREA, pbi: Pbi.A_MEDIAS })).toBe('PBI a medias: sin FASE')
    expect(avisoDePbi({ tipo: TipoNodo.FASE, pbi: Pbi.A_MEDIAS })).toBe(
      'PBI a medias: FASE sin task',
    )
    expect(avisoDePbi({ tipo: TipoNodo.FASE, pbi: Pbi.ENTERO })).toBeNull()
    expect(avisoDePbi({ tipo: TipoNodo.TAREA })).toBeNull()
  })
})
