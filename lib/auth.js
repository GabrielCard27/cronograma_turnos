import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Devuelve el perfil del usuario con sesión iniciada (o null si no hay sesión o está inactivo).
export async function getPerfil() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('perfiles').select('*').eq('id', user.id).maybeSingle()
  return data && data.activo ? data : null
}

// Para páginas (Server Components): redirige si no hay perfil.
export async function requirePerfil() {
  const perfil = await getPerfil()
  if (!perfil) redirect('/login?error=sin-perfil')
  return perfil
}

// Para Server Actions: lanza un error (no redirige) si no es administrador.
export async function requireAdmin() {
  const perfil = await getPerfil()
  if (!perfil || perfil.rol !== 'admin') throw new Error('No tenés permiso para hacer esto.')
  return perfil
}
