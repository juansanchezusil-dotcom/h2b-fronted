// Texto de un error para mostrarlo a la persona. Lo que llega a un catch puede ser cualquier cosa
// (un Error, un texto, un objeto de Supabase); si no trae mensaje, se usa el texto de respaldo.
export function errorMessage(err: unknown, fallback = 'Algo salió mal. Intenta de nuevo.'): string {
  if (err instanceof Error && err.message) return err.message
  if (typeof err === 'string' && err) return err
  if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string' && err.message) return err.message
  return fallback
}
