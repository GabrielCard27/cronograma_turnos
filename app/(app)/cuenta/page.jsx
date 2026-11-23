import { requirePerfil } from '@/lib/auth'
import FormAction, { Enviar } from '@/components/FormAction'
import { logout } from '@/app/login/actions'
import { cambiarPassword } from './actions'

export const metadata = { title: 'Cuenta' }

export default async function Cuenta() {
  const perfil = await requirePerfil()
  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-2xl font-bold">Mi cuenta</h1>
      <div className="panel p-4 text-sm">
        <p className="font-semibold">{perfil.apellido_nombre}</p>
        <p className="text-suave">{perfil.email}</p>
        <p className="mt-2 text-suave">
          {perfil.rol === 'admin' ? 'Administrador' : `${perfil.grupo || 'Empleado'}${perfil.legajo ? ` · ID ${perfil.legajo}` : ''}`}
        </p>
      </div>

      <section className="panel p-4">
        <h2 className="mb-3 font-semibold">Cambiar contraseña</h2>
        <FormAction action={cambiarPassword} limpiar className="space-y-3">
          <div>
            <label htmlFor="nueva" className="etiqueta">Contraseña nueva</label>
            <input id="nueva" name="nueva" type="password" autoComplete="new-password" minLength={8} required className="campo" />
          </div>
          <div>
            <label htmlFor="repetir" className="etiqueta">Repetir contraseña</label>
            <input id="repetir" name="repetir" type="password" autoComplete="new-password" minLength={8} required className="campo" />
          </div>
          <Enviar>Guardar contraseña</Enviar>
        </FormAction>
      </section>

      <form action={logout}>
        <button className="btn-sec">Cerrar sesión</button>
      </form>
    </div>
  )
}
