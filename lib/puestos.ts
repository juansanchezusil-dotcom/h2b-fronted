// Rutas por PUESTO (no por industria): dentro de hotelería también hay cocina, mesero, etc.
// El "value" es lo que se guarda en profiles.experiencia_industria (Ruta A) y experiencia_industria_b (Ruta B).
// Los textos de los cinco primeros son los de siempre, para que los perfiles ya llenos y las coincidencias de
// ofertas (que buscan "limpieza", "cocina", "constru", "jardin", "mantenimiento") sigan igual.
// "role" es el puesto en inglés que se sugiere al armar el CV.
export type Puesto = { value: string; label: string; role: string }

export const PUESTOS: { group: string; options: Puesto[] }[] = [
  {
    group: 'Hotelería',
    options: [
      { value: 'Hotelería / Limpieza', label: 'Housekeeping / Limpieza de hotel', role: 'Housekeeper' },
      { value: 'Recepción / Front desk', label: 'Recepción / Front desk', role: 'Front Desk Agent' },
      { value: 'Botones / Bellhop', label: 'Botones / Bellhop', role: 'Bellhop' },
    ],
  },
  {
    group: 'Cocina y restaurante',
    options: [
      { value: 'Cocina / Restaurantes', label: 'Cocinero / Cook (Line Cook)', role: 'Line Cook' },
      { value: 'Cocina / Lavaplatos (Dishwasher)', label: 'Lavaplatos / Dishwasher', role: 'Dishwasher' },
      { value: 'Mesero / Server', label: 'Mesero / Server', role: 'Server' },
      { value: 'Bartender / Barman', label: 'Bartender / Barman', role: 'Bartender' },
      { value: 'Procesador de alimentos / Planta / Empaque', label: 'Procesador de alimentos / Planta / Empaque', role: 'Food Processing Worker' },
    ],
  },
  {
    group: 'Exteriores, construcción y mantenimiento',
    options: [
      { value: 'Paisajismo / Jardinería', label: 'Paisajismo / Jardinería (Landscaping)', role: 'Landscaper' },
      { value: 'Construcción', label: 'Construcción (Laborer)', role: 'Construction Laborer' },
      { value: 'Carpintero / Carpenter', label: 'Carpintero / Carpenter', role: 'Carpenter' },
      { value: 'Electricista / Electrician', label: 'Electricista / Electrician', role: 'Electrician' },
      { value: 'Mantenimiento / General', label: 'Mantenimiento general (Maintenance)', role: 'Maintenance Worker' },
    ],
  },
  {
    group: 'Otros',
    options: [{ value: 'Conductor / Driver', label: 'Conductor / Driver', role: 'Driver' }],
  },
]

export function puestoOf(value: string | null | undefined): Puesto | null {
  if (!value) return null
  for (const g of PUESTOS) for (const o of g.options) if (o.value === value) return o
  return null
}
