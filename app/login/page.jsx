import { redirect } from 'next/navigation'
import { getPerfil } from '@/lib/auth'
import FormAction, { Enviar } from '@/components/FormAction'
import { login, logout } from './actions'

export const metadata = { title: 'Ingresar' }

// Las tres franjas del día: es lo que organiza todo el trabajo de esta aplicación.
function FranjaDelDia() {
  const franjas = [
    ['Noche', 'hasta 07', 'bg-[#D5DBF7] text-[#1E2A5E]', 'w-[29%]'],
    ['Mañana', '07 a 15', 'bg-[#FFF0B8] text-[#4A3B00]', 'w-[33%]'],
    ['Tarde', '15 a 23', 'bg-[#FFD9C2] text-[#5A2A0A]', 'w-[33%]'],
    ['Noche', '', 'bg-[#D5DBF7] text-[#1E2A5E]', 'w-[5%]'],
  ]
  return (
    <div aria-hidden="true" className="mt-10 flex h-14 w-full overflow-hidden rounded-md border border-white/20">
      {franjas.map(([nombre, horas, clase, ancho], i) => (
        <div key={i} className={`${clase} ${ancho} flex flex-col justify-center px-2 text-[11px] font-semibold leading-tight`}>
          {nombre}
          <span className="font-normal opacity-80">{horas}</span>
        </div>
      ))}
    </div>
  )
}

export default async function LoginPage({ searchParams }) {
  const perfil = await getPerfil()
  if (perfil) redirect('/')
  const sinPerfil = searchParams?.error === 'sin-perfil'

  return (
    <main className="grid min-h-dvh md:grid-cols-2">
      <section className="flex flex-col justify-center bg-tinta px-6 py-10 text-white md:px-14">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Turnos</h1>
        <p className="mt-3 max-w-sm text-base text-white/80">
          Consultá tus turnos del mes, pedí cambios y mirá las nuevas asignaciones.
        </p>
        <div className="hidden md:block">
          <FranjaDelDia />
        </div>
      </section>

      <section className="flex flex-col justify-center px-6 py-10 md:px-14">
        <div className="mx-auto w-full max-w-sm">
          <h2 className="text-2xl font-bold">Ingresar</h2>
          {sinPerfil ? (
            <div className="mt-4 rounded-md border border-alerta bg-rose-50 p-3 text-sm text-alerta">
              Tu cuenta no tiene un perfil activo. Pedile al administrador que la revise.
              <form action={logout} className="mt-2">
                <button className="font-semibold underline">Cerrar sesión</button>
              </form>
            </div>
          ) : null}
          <FormAction action={login} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="etiqueta">Correo electrónico</label>
              <input id="email" name="email" type="email" autoComplete="username" required className="campo" />
            </div>
            <div>
              <label htmlFor="password" className="etiqueta">Contraseña</label>
              <input id="password" name="password" type="password" autoComplete="current-password" required className="campo" />
            </div>
            <Enviar className="btn w-full">Ingresar</Enviar>
          </FormAction>
          <p className="mt-6 text-sm text-suave">
            Si olvidaste tu contraseña o no tenés usuario, pedíselo al administrador.
          </p>
        </div>
      </section>
    </main>
  )
}
