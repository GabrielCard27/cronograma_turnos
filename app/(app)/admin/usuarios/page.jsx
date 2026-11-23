import { createClient } from '@/lib/supabase/server'
import { requirePerfil } from '@/lib/auth'
import FormAction, { Enviar } from '@/components/FormAction'
import { PALETA, contraste } from '@/lib/turnos'
import UsuarioCampos from './UsuarioCampos'
import { actualizarUsuario, crearUsuario } from './actions'

export const metadata = { title: 'Usuarios' }

export default async function Usuarios() {
  const yo = await requirePerfil()
  const supabase = createClient()
  const { data: usuarios } = await supabase
    .from('perfiles').select('*').order('rol').order('grupo').order('legajo')
  const sugerido = PALETA[(usuarios?.length || 0) % PALETA.length]

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Usuarios y permisos</h1>

      <details className="panel p-4" open={!usuarios?.length}>
        <summary className="cursor-pointer font-semibold">Alta de usuario</summary>
        <FormAction action={crearUsuario} limpiar className="mt-4 grid gap-4 sm:grid-cols-2">
          <UsuarioCampos color={sugerido} prefijo="nuevo" />
          <div>
            <label htmlFor="nuevo-pass" className="etiqueta">Contraseña inicial</label>
            <input id="nuevo-pass" name="password" type="password" minLength={8} required autoComplete="new-password" className="campo" />
          </div>
          <div className="sm:col-span-2">
            <Enviar>Crear usuario</Enviar>
          </div>
        </FormAction>
      </details>

      <section aria-labelledby="lista">
        <h2 id="lista" className="mb-3 text-xl font-bold">Usuarios ({usuarios?.length || 0})</h2>
        <ul className="space-y-2">
          {(usuarios || []).map((u) => (
            <li key={u.id} className="panel">
              <details>
                <summary className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 p-3">
                  <span
                    style={{ background: u.color, color: contraste(u.color) }}
                    className="inline-flex min-w-[2rem] justify-center rounded-full px-2 py-0.5 text-xs font-semibold"
                  >
                    {u.legajo || '–'}
                  </span>
                  <span className="font-semibold">{u.apellido_nombre}</span>
                  <span className="text-sm text-suave">
                    {u.rol === 'admin' ? 'Administrador' : u.grupo} · {u.email}
                  </span>
                  {!u.activo ? <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-900">Inactivo</span> : null}
                </summary>
                <FormAction action={actualizarUsuario} className="grid gap-4 border-t border-linea p-4 sm:grid-cols-2">
                  <input type="hidden" name="id" value={u.id} />
                  <UsuarioCampos u={u} color={sugerido} prefijo={`u${u.id.slice(0, 8)}`} />
                  <div>
                    <label htmlFor={`p${u.id}`} className="etiqueta">Contraseña nueva (dejar vacío para no cambiarla)</label>
                    <input id={`p${u.id}`} name="password" type="password" minLength={8} autoComplete="new-password" className="campo" />
                  </div>
                  <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium">
                    <input type="checkbox" name="activo" defaultChecked={u.activo} className="h-5 w-5" disabled={u.id === yo.id} />
                    Usuario activo
                    {u.id === yo.id ? <input type="hidden" name="activo" value="on" /> : null}
                  </label>
                  <div className="sm:col-span-2">
                    <Enviar>Guardar cambios</Enviar>
                  </div>
                </FormAction>
              </details>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
