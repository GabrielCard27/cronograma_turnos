import { redirect } from 'next/navigation'
import { getPerfil } from '@/lib/auth'

export default async function Inicio() {
  const perfil = await getPerfil()
  if (!perfil) redirect('/login')
  redirect(perfil.rol === 'admin' ? '/admin/resumen' : '/mis-turnos')
}
