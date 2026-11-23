import { redirect } from 'next/navigation'
import { requirePerfil } from '@/lib/auth'

export default async function AdminLayout({ children }) {
  const perfil = await requirePerfil()
  if (perfil.rol !== 'admin') redirect('/mis-turnos')
  return children
}
