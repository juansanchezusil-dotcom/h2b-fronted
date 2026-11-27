import { describe, expect, it } from 'vitest'
import { pendingImports, readImportedIds, readMasterclassOffers } from '@/lib/masterclassImport'

describe('masterclassImport', () => {
  it('lee las ofertas del dashboard y tolera datos rotos', () => {
    expect(readMasterclassOffers(null)).toEqual([])
    expect(readMasterclassOffers('{no es json')).toEqual([])
    expect(readMasterclassOffers(JSON.stringify({ offers: [{ id: 'o1' }, null, { puesto: 'sin id' }] }))).toEqual([{ id: 'o1' }])
    expect([...readImportedIds('["a", 3, "b"]')]).toEqual(['a', 'b'])
  })

  it('pasa solo lo nuevo, con el estado del CRM', () => {
    const offers = [
      { id: 'o1', puesto: 'Housekeeper', empresa: 'Smith Farms', estado: 'postulada', url: 'https://smith.com' },
      { id: 'o2', puesto: 'Cook', empresa: 'Ya En CRM', estado: 'guardada' },
      { id: 'o3', puesto: 'Laborer', empresa: 'Descartada SA', estado: 'descartada' },
      { id: 'o4', puesto: 'Laborer', empresa: 'Ya pasada', estado: 'entrevista' },
      { id: 'o5', puesto: '', empresa: 'Sin puesto', url: 'javascript:alert(1)' },
      { id: 'o6', puesto: 'Cook', empresa: '' },
    ]
    const rows = pendingImports(offers, new Set(['o4']), [{ company: 'ya en crm ', role: 'COOK' }])
    expect(rows).toEqual([
      { sourceId: 'o1', company_name: 'Smith Farms', job_title: 'Housekeeper', status: 'postulado', notes: 'Desde la masterclass. https://smith.com' },
      { sourceId: 'o5', company_name: 'Sin puesto', job_title: 'Vacante H2B', status: 'guardadas', notes: 'Desde la masterclass.' },
    ])
  })

  it('no repite la misma empresa y puesto dos veces', () => {
    const offers = [
      { id: 'a', puesto: 'Cook', empresa: 'Rancho' },
      { id: 'b', puesto: 'cook', empresa: 'RANCHO' },
    ]
    expect(pendingImports(offers, new Set(), [])).toHaveLength(1)
  })
})
