import { describe, expect, it } from 'vitest'
import { cvTextOf, routeOfJob, slotForJob } from './cvSlots'

const row = { experiencia_industria: 'Cocina / Restaurantes', experiencia_industria_b: 'Hotelería / Limpieza' }

describe('CV por ruta', () => {
  it('una oferta de cocina es de la Ruta A y una de limpieza de la B', () => {
    expect(routeOfJob('Line Cook', row)).toBe('A')
    expect(routeOfJob('Housekeeper', row)).toBe('B')
    expect(routeOfJob('Truck Driver', row)).toBeNull()
  })
  it('postula con el CV de la B solo si la oferta es de la B', () => {
    expect(slotForJob('Housekeeper', row)).toBe('B')
    expect(slotForJob('Line Cook', row)).toBe('A')
    expect(slotForJob('Truck Driver', row)).toBe('A')
  })
  it('sin Ruta B todo va con el CV de la A', () => {
    expect(slotForJob('Housekeeper', { experiencia_industria: 'Cocina / Restaurantes' })).toBe('A')
  })
  it('lee el texto del CV de cada ruta', () => {
    const p = { base_cv_text: 'cv de cocina', cv_b: { base_cv_text: 'cv de limpieza' } }
    expect(cvTextOf(p, 'A')).toBe('cv de cocina')
    expect(cvTextOf(p, 'B')).toBe('cv de limpieza')
    expect(cvTextOf({ base_cv_text: 'x' }, 'B')).toBe('')
  })
})
