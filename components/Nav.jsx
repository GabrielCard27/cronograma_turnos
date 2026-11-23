'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/login/actions'

const ADMIN = [
  ['/admin/resumen', 'Resumen'],
  ['/admin/turnos', 'Turnos'],
  ['/admin/cambios', 'Cambios'],
  ['/admin/usuarios', 'Usuarios'],
  ['/cuenta', 'Cuenta'],
]
const EMPLEADO = [
  ['/mis-turnos', 'Mis turnos'],
  ['/cambios', 'Cambios'],
  ['/cuenta', 'Cuenta'],
]

export default function Nav({ rol, nombre }) {
  const ruta = usePathname()
  const items = rol === 'admin' ? ADMIN : EMPLEADO
  const activo = (href) => ruta === href || ruta.startsWith(href + '/')

  return (
    <>
      {/* Computadora: barra lateral */}
      <aside className="fixed inset-y-0 left-0 hidden w-56 flex-col border-r border-linea bg-white px-4 py-6 md:flex">
        <p className="text-xl font-bold tracking-tight">Turnos</p>
        <p className="mt-1 truncate text-sm text-suave">{nombre}</p>
        <nav className="mt-8 flex flex-1 flex-col gap-1" aria-label="Principal">
          {items.map(([href, texto]) => (
            <Link
              key={href}
              href={href}
              aria-current={activo(href) ? 'page' : undefined}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                activo(href) ? 'bg-tinta text-white' : 'text-tinta hover:bg-papel'
              }`}
            >
              {texto}
            </Link>
          ))}
        </nav>
        <form action={logout}>
          <button className="w-full rounded-md px-3 py-2 text-left text-sm text-suave hover:bg-papel">Cerrar sesión</button>
        </form>
      </aside>

      {/* Celular: barra inferior */}
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-linea bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {items.map(([href, texto]) => (
          <Link
            key={href}
            href={href}
            aria-current={activo(href) ? 'page' : undefined}
            className={`flex-1 py-3 text-center text-xs font-semibold ${
              activo(href) ? 'border-t-2 border-acento text-acento' : 'border-t-2 border-transparent text-suave'
            }`}
          >
            {texto}
          </Link>
        ))}
      </nav>
    </>
  )
}
