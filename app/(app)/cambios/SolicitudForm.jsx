import FormAction, { Enviar } from '@/components/FormAction'
import { TIPOS } from '@/lib/cambios'
import { fechaCorta } from '@/lib/turnos'
import { crearSolicitud } from './actions'

export default function SolicitudForm({ turnos, companeros, codigos, hoteles, grupo }) {
  const hotel = Object.fromEntries(hoteles.map((h) => [h.id, h.nombre]))
  const nombreCodigo = Object.fromEntries(codigos.map((c) => [`${c.hotel_id}|${c.codigo}`, c.descripcion]))

  return (
    <FormAction action={crearSolicitud} limpiar className="panel space-y-4 p-4">
      <div>
        <label htmlFor="turno" className="etiqueta">Turno que querés cambiar</label>
        <select id="turno" name="turno" required defaultValue="" className="campo">
          <option value="" disabled>Elegí un turno</option>
          {turnos.map((t) => (
            <option key={`${t.hotel_id}|${t.fecha}`} value={`${t.hotel_id}|${t.fecha}`}>
              {fechaCorta(t.fecha)} · {t.codigo} {nombreCodigo[`${t.hotel_id}|${t.codigo}`] || ''} · {hotel[t.hotel_id]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="tipo" className="etiqueta">Tipo de cambio</label>
          <select id="tipo" name="tipo" required defaultValue="permutacion" className="campo">
            {Object.entries(TIPOS).map(([v, t]) => (
              <option key={v} value={v}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="modo" className="etiqueta">¿Cómo lo pedís?</label>
          <select id="modo" name="modo" defaultValue="solicitud" className="campo">
            <option value="solicitud">Solo lo pido: decide el administrador</option>
            <option value="con_reemplazante">Ya lo hablé con un compañero: debe aceptarlo</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="reemplazante" className="etiqueta">Compañero que te cubre</label>
        <select id="reemplazante" name="reemplazante" defaultValue="" className="campo">
          <option value="">Sin definir (obligatorio si ya lo hablaste con un compañero)</option>
          {companeros.map((c) => (
            <option key={c.id} value={c.id}>{c.apellido_nombre}{c.legajo ? ` (ID ${c.legajo})` : ''}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="fecha_cambiado" className="etiqueta">Fecha en que trabajás a cambio</label>
          <input id="fecha_cambiado" name="fecha_cambiado" type="date" className="campo" />
        </div>
        <div>
          <label htmlFor="turno_cambiado" className="etiqueta">Turno a cambio</label>
          <select id="turno_cambiado" name="turno_cambiado" defaultValue="" className="campo">
            <option value="">Sin definir</option>
            {hoteles.map((h) => (
              <optgroup key={h.id} label={h.nombre}>
                {codigos
                  .filter((c) => c.hotel_id === h.id && (c.grupo === 'Ambos' || c.grupo === grupo))
                  .map((c) => (
                    <option key={`${h.id}|${c.codigo}`} value={c.codigo}>{c.codigo} · {c.descripcion}</option>
                  ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="motivo" className="etiqueta">Motivo (opcional)</label>
        <textarea id="motivo" name="motivo" rows={2} maxLength={300} className="campo" />
      </div>

      <Enviar>Enviar solicitud</Enviar>
    </FormAction>
  )
}
