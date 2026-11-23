import { requirePerfil } from '@/lib/auth'
import Nav from '@/components/Nav'

export default async function AppLayout({ children }) {
  const perfil = await requirePerfil()
  return (
    <div className="min-h-dvh md:pl-56">
      <Nav rol={perfil.rol} nombre={perfil.alias || perfil.apellido_nombre} />
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 md:px-8 md:pb-12">{children}</main>
    </div>
  )
}
