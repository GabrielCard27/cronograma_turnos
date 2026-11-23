'use server'
import { createClient } from '@/lib/supabase/server'

export async function cambiarPassword(prev, fd) {
  const nueva = String(fd.get('nueva') || '')
  const repetir = String(fd.get('repetir') || '')
  if (nueva.length < 8) return { ok: false, mensaje: 'La contraseña debe tener al menos 8 caracteres.' }
  if (nueva !== repetir) return { ok: false, mensaje: 'Las contraseñas no coinciden.' }
  const supabase = createClient()
  const { error } = await supabase.auth.updateUser({ password: nueva })
  if (error) return { ok: false, mensaje: 'No se pudo cambiar la contraseña. Intentá de nuevo.' }
  return { ok: true, mensaje: 'Contraseña actualizada.' }
}
