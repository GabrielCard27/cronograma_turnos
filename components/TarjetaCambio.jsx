import { ESTADOS, TIPOS, estadoDetalle } from '@/lib/cambios'
import { fechaCorta } from '@/lib/turnos'

export default function TarjetaCambio({ c, mostrarSolicitante = false, children }) {
  const e = ESTADOS[c.estado]
  return (
    <li className="panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">
          {TIPOS[c.tipo]} · {c.hotel}
        </p>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${e.clase}`}>{e.texto}</span>
      </div>
      <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        {mostrarSolicitante ? (
          <div><dt className="inline text-suave">Solicita: </dt><dd className="inline">{c.solicitante}</dd></div>
        ) : null}
        <div><dt className="inline text-suave">Turno original: </dt><dd className="inline">{c.turno_origen} · {fechaCorta(c.fecha_origen)}</dd></div>
        <div><dt className="inline text-suave">Reemplazante: </dt><dd className="inline">{c.reemplazante || 'Sin definir'}</dd></div>
        <div>
          <dt className="inline text-suave">A cambio: </dt>
          <dd className="inline">
            {c.fecha_cambiado ? `${fechaCorta(c.fecha_cambiado)}${c.turno_cambiado ? ` · ${c.turno_cambiado}` : ''}` : 'Sin definir'}
          </dd>
        </div>
        {c.motivo ? <div className="sm:col-span-2"><dt className="inline text-suave">Motivo: </dt><dd className="inline">{c.motivo}</dd></div> : null}
      </dl>
      <p className="mt-2 text-sm text-suave">{estadoDetalle(c)}</p>
      {children}
    </li>
  )
}
