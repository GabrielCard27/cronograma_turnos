import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requirePerfil } from '@/lib/auth'
import { hoy } from '@/lib/turnos'
import FormAction, { Enviar } from '@/components/FormAction'
import TarjetaCambio from '@/components/TarjetaCambio'
import SolicitudForm from './SolicitudForm'
import { responderCambio, retirarSolicitud } from './actions'

export const metadata = { title: 'Cambios de turno' }

export default async function Cambios() {
  const perfil = await requirePerfil()
  if (perfil.rol === 'admin') redirect('/admin/cambios')
  const supabase = createClient()

  const [{ data: cambios }, { data: proximos }, { data: companeros }, { data: codigos }, { data: hoteles }] = await Promise.all([
    supabase.from('v_cambios').select('*').order('creado', { ascending: false }).limit(60),
    supabase.from('v_turnos').select('hotel_id,fecha,codigo').eq('empleado_id', perfil.id).gte('fecha', hoy()).not('codigo', 'is', null).order('fecha').limit(60),
    supabase.from('v_companeros').select('*').order('apellido_nombre'),
    supabase.from('codigos_turno').select('*'),
    supabase.from('hoteles').select('*').order('id'),
  ])

  const paraResponder = (cambios || []).filter(
    (c) => c.reemplazante_id === perfil.id && c.modo === 'con_reemplazante' && c.estado === 'solicitada' && c.reemplazante_acepta === null
  )
  const mios = (cambios || []).filter((c) => c.solicitante_id === perfil.id)
  const comoReemplazante = (cambios || []).filter(
    (c) => c.reemplazante_id === perfil.id && !paraResponder.includes(c)
  )

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold">Cambios de turno</h1>

      {paraResponder.length ? (
        <section aria-labelledby="responder">
          <h2 id="responder" className="mb-3 text-xl font-bold">Compañeros que te piden cubrirlos</h2>
          <ul className="space-y-3">
            {paraResponder.map((c) => (
              <TarjetaCambio key={c.id} c={c} mostrarSolicitante>
                <FormAction action={responderCambio} className="mt-3 flex flex-wrap gap-2">
                  <input type="hidden" name="id" value={c.id} />
                  <Enviar name="respuesta" value="si">Aceptar</Enviar>
                  <Enviar name="respuesta" value="no" className="btn-peligro">Rechazar</Enviar>
                </FormAction>
              </TarjetaCambio>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="nuevo">
        <h2 id="nuevo" className="mb-3 text-xl font-bold">Pedir un cambio</h2>
        {proximos?.length ? (
          <SolicitudForm turnos={proximos} companeros={companeros || []} codigos={codigos || []} hoteles={hoteles || []} grupo={perfil.grupo} />
        ) : (
          <p className="text-sm text-suave">No tenés turnos próximos cargados para cambiar.</p>
        )}
      </section>

      <section aria-labelledby="mis">
        <h2 id="mis" className="mb-3 text-xl font-bold">Mis solicitudes</h2>
        {mios.length ? (
          <ul className="space-y-3">
            {mios.map((c) => (
              <TarjetaCambio key={c.id} c={c}>
                {c.estado === 'solicitada' ? (
                  <FormAction action={retirarSolicitud} className="mt-3">
                    <input type="hidden" name="id" value={c.id} />
                    <Enviar className="btn-sec">Retirar solicitud</Enviar>
                  </FormAction>
                ) : null}
              </TarjetaCambio>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-suave">Todavía no pediste cambios.</p>
        )}
      </section>

      {comoReemplazante.length ? (
        <section aria-labelledby="cubro">
          <h2 id="cubro" className="mb-3 text-xl font-bold">Cambios en los que sos reemplazante</h2>
          <ul className="space-y-3">
            {comoReemplazante.map((c) => (
              <TarjetaCambio key={c.id} c={c} mostrarSolicitante />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
