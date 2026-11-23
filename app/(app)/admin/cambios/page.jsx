import { createClient } from '@/lib/supabase/server'
import FormAction, { Enviar } from '@/components/FormAction'
import TarjetaCambio from '@/components/TarjetaCambio'
import { TIPOS } from '@/lib/cambios'
import { resolverCambio, crearCambioDirecto } from './actions'

export const metadata = { title: 'Cambios de turno' }

export default async function AdminCambios() {
  const supabase = createClient()
  const [{ data: cambios }, { data: empleados }, { data: codigos }, { data: hoteles }] = await Promise.all([
    supabase.from('v_cambios').select('*').order('creado', { ascending: false }).limit(150),
    supabase.from('perfiles').select('id,legajo,apellido_nombre,grupo').eq('rol', 'empleado').eq('activo', true).order('apellido_nombre'),
    supabase.from('codigos_turno').select('*').order('codigo'),
    supabase.from('hoteles').select('*').order('id'),
  ])

  const pendientes = (cambios || []).filter((c) => c.estado === 'solicitada')
  const historial = (cambios || []).filter((c) => c.estado !== 'solicitada').slice(0, 40)
  const etiqueta = (e) => `${e.legajo ? `${e.legajo} · ` : ''}${e.apellido_nombre}`

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold">Cambios de turno</h1>

      <section aria-labelledby="pend">
        <h2 id="pend" className="mb-3 text-xl font-bold">Pendientes ({pendientes.length})</h2>
        {pendientes.length ? (
          <ul className="space-y-3">
            {pendientes.map((c) => {
              const mismoGrupo = (empleados || []).filter((e) => e.grupo === c.grupo && e.id !== c.solicitante_id)
              const delHotel = (codigos || []).filter((x) => x.hotel_id === c.hotel_id && (x.grupo === 'Ambos' || x.grupo === c.grupo))
              return (
                <TarjetaCambio key={c.id} c={c} mostrarSolicitante>
                  <FormAction action={resolverCambio} className="mt-3 grid gap-3 sm:grid-cols-3">
                    <input type="hidden" name="id" value={c.id} />
                    <div>
                      <label htmlFor={`r${c.id}`} className="etiqueta">Reemplazante</label>
                      <select id={`r${c.id}`} name="reemplazante" defaultValue={c.reemplazante_id || ''} className="campo">
                        <option value="">Sin definir</option>
                        {mismoGrupo.map((e) => <option key={e.id} value={e.id}>{etiqueta(e)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor={`f${c.id}`} className="etiqueta">Fecha del turno cambiado</label>
                      <input id={`f${c.id}`} name="fecha_cambiado" type="date" defaultValue={c.fecha_cambiado || ''} className="campo" />
                    </div>
                    <div>
                      <label htmlFor={`t${c.id}`} className="etiqueta">Turno cambiado</label>
                      <select id={`t${c.id}`} name="turno_cambiado" defaultValue={c.turno_cambiado || ''} className="campo">
                        <option value="">Sin definir</option>
                        {delHotel.map((x) => <option key={x.codigo} value={x.codigo}>{x.codigo} · {x.descripcion}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:col-span-3">
                      <Enviar name="estado" value="aceptada">Aceptar</Enviar>
                      <Enviar name="estado" value="rechazada" className="btn-peligro">Rechazar</Enviar>
                    </div>
                  </FormAction>
                </TarjetaCambio>
              )
            })}
          </ul>
        ) : (
          <p className="text-sm text-suave">No hay solicitudes pendientes.</p>
        )}
      </section>

      <section aria-labelledby="directo">
        <h2 id="directo" className="mb-3 text-xl font-bold">Cargar un cambio</h2>
        <FormAction action={crearCambioDirecto} limpiar className="panel grid gap-4 p-4 sm:grid-cols-2">
          <div>
            <label htmlFor="d-hotel" className="etiqueta">Hotel</label>
            <select id="d-hotel" name="hotel_id" required className="campo">
              {(hoteles || []).map((h) => <option key={h.id} value={h.id}>{h.nombre}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="d-tipo" className="etiqueta">Tipo de cambio</label>
            <select id="d-tipo" name="tipo" required className="campo">
              {Object.entries(TIPOS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="d-sol" className="etiqueta">Solicitante</label>
            <select id="d-sol" name="solicitante" required defaultValue="" className="campo">
              <option value="" disabled>Elegí una persona</option>
              {(empleados || []).map((e) => <option key={e.id} value={e.id}>{etiqueta(e)} ({e.grupo})</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="d-fo" className="etiqueta">Fecha del turno original</label>
            <input id="d-fo" name="fecha_origen" type="date" required className="campo" />
          </div>
          <div>
            <label htmlFor="d-rem" className="etiqueta">Reemplazante</label>
            <select id="d-rem" name="reemplazante" required defaultValue="" className="campo">
              <option value="" disabled>Elegí una persona</option>
              {(empleados || []).map((e) => <option key={e.id} value={e.id}>{etiqueta(e)} ({e.grupo})</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="d-fc" className="etiqueta">Fecha del turno cambiado</label>
            <input id="d-fc" name="fecha_cambiado" type="date" required className="campo" />
          </div>
          <div>
            <label htmlFor="d-tc" className="etiqueta">Turno cambiado (opcional)</label>
            <select id="d-tc" name="turno_cambiado" defaultValue="" className="campo">
              <option value="">Sin definir</option>
              {(hoteles || []).map((h) => (
                <optgroup key={h.id} label={h.nombre}>
                  {(codigos || []).filter((x) => x.hotel_id === h.id).map((x) => (
                    <option key={`${h.id}${x.codigo}`} value={x.codigo}>{x.codigo} · {x.descripcion}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="d-mot" className="etiqueta">Motivo (opcional)</label>
            <input id="d-mot" name="motivo" maxLength={300} className="campo" />
          </div>
          <div className="sm:col-span-2">
            <p className="mb-3 text-sm text-suave">El turno original se toma de lo que el solicitante tiene cargado ese día.</p>
            <Enviar>Cargar cambio</Enviar>
          </div>
        </FormAction>
      </section>

      <section aria-labelledby="hist">
        <h2 id="hist" className="mb-3 text-xl font-bold">Historial</h2>
        {historial.length ? (
          <ul className="space-y-3">
            {historial.map((c) => <TarjetaCambio key={c.id} c={c} mostrarSolicitante />)}
          </ul>
        ) : (
          <p className="text-sm text-suave">Todavía no hay cambios resueltos.</p>
        )}
      </section>
    </div>
  )
}
