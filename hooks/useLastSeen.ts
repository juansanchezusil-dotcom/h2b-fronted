'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const ONE_HOUR_MS = 60 * 60 * 1000;

// Marca en profiles.last_seen_at la última vez que la persona abrió la app, como máximo una vez por
// hora (el momento exacto no importa: sirve para saber cuántos días lleva sin entrar). Si falla, la
// app sigue igual: es un dato de seguimiento, no algo que la persona necesite.
export function useLastSeen(userId: string) {
  useEffect(() => {
    if (!userId) return;
    const key = `jta:last-seen:${userId}`;
    try {
      const last = Number(window.localStorage.getItem(key) || 0);
      if (Date.now() - last < ONE_HOUR_MS) return;
    } catch {
      // Sin localStorage (modo privado): se actualiza igual, solo que sin el límite de una vez por hora
    }
    // update y no upsert: si todavía no existe su perfil, no se crea una fila vacía
    supabase
      .from('profiles')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', userId)
      .then((r: { error: { message: string } | null }) => {
        if (r.error) {
          console.error('No se pudo registrar la última visita:', r.error.message);
          return;
        }
        try {
          window.localStorage.setItem(key, String(Date.now()));
        } catch {
          // ignorar
        }
      });
  }, [userId]);
}
