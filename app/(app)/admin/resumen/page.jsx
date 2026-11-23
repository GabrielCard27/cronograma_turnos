import { createClient } from '@/lib/supabase/server'
import { contraste, diaSemana, fechaDia, horaDe, mapaCodigos, parseMes, DIAS_SEMANA } from '@/lib/turnos'
import Filtros from '@/components/Filtros'

export const metadata = { title: 'Resumen' }

const p2 = (n) => String(n).padStart(2, '0')

export default async function Resumen({ searchParams }) {
  const supabase = createClient()
  const mes = parseMes(searchParams?.mes)
  const { data: hoteles } = await supabase.from('hoteles').select('*').order('id')
  const hotelId = Number(searchParams?.hotel) || hoteles?.[0]?.id
  const grupo = searchParams?.grupo === 'Mucama' ? 'Mucama' : 'Conserje'

  const [{ data: codigos }, { data: empleados }, { data: turnos }] = await Promise.all([
    supabase.from('codigos_turno').select('*').eq('hotel_id', hotelId),
    supabase.from('perfiles').select('id,legajo,alias,apellido_nombre,color').eq('rol', 'empleado').eq('grupo', grupo).order('legajo'),
    supabase.from('v_turnos').select('empleado_id,fecha,codigo,cambiado').eq('hotel_id', hotelId).gte('fecha', mes.desde).lte('fecha', mes.hasta),
  ])

  const info = Object.fromEntries((codigos || []).map((c) => [c.codigo, c]))
  const emp = Object.fromEntries((empleados || []).map((e) => [e.id, e]))
  const trabajan = (codigos || []).filter((c) => Number(c.horas) > 0 && c.desde)
  const inicio = trabajan.length ? Math.min(...trabajan.map((c) => Math.floor(horaDe(c.desde)))) : 7
  const horas = Array.from({ length: 24 }, (_, i) => inicio + i)

  // matriz[fecha][hora] = [{ legajo, color, cambiado }]
  const matriz = {}
  ;(turnos || []).forEach((t) => {
    const e = emp[t.empleado_id]
    const c = t.codigo ? info[t.codigo] : null
    if (!e || !c || !(Number(c.horas) > 0) || !c.desde) return
    const ini = Math.floor(horaDe(c.desde))
    const fin = horaDe(c.desde) + Number(c.horas)
    for (let h = ini; h < fin; h++) {
      if (h < inicio || h >= inicio + 24) continue
      ;((matriz[t.fecha] ||= {})[h] ||= []).push({ legajo: e.legajo, color: e.color, cambiado: t.cambiado, nombre: e.apellido_nombre })
    }
  })

  const dias = Array.from({ length: mes.dias }, (_, i) => i + 1)
  const hayCambios = (turnos || []).some((t) => t.cambiado)

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Resumen de cobertura</h1>
      <Filtros hoteles={hoteles || []} hotelId={hotelId} grupo={grupo} mes={mes.clave} />

      <p className="text-sm text-suave">
        Cada número es el ID de quien cubre esa hora, con su color. Los turnos modificados por un cambio aceptado
        llevan borde grueso, negrita y asterisco (*).
        {grupo === 'Conserje' ? ' Las horas sin conserje se marcan en rojo claro.' : ''}
      </p>

      <div className="max-h-[70vh] overflow-auto rounded-lg border border-linea bg-white">
        <table className="border-separate border-spacing-0 text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-20 border-b border-r border-linea bg-white px-2 py-1 text-left">Hora</th>
              {dias.map((d) => {
                const f = fechaDia(mes.clave, d)
                const dom = diaSemana(f) === 0
                return (
                  <th key={d} className={`sticky top-0 z-10 min-w-[3rem] border-b border-linea px-1 py-1 text-center ${dom ? 'bg-rose-50' : 'bg-white'}`}>
                    <span className="block font-bold">{d}</span>
                    <span className="block font-normal text-suave">{DIAS_SEMANA[diaSemana(f)]}</span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {horas.map((h) => (
              <tr key={h}>
                <th className="sticky left-0 z-10 border-b border-r border-linea bg-white px-2 py-1 text-left font-medium tabular-nums">
                  {p2(h % 24)}:00
                </th>
                {dias.map((d) => {
                  const f = fechaDia(mes.clave, d)
                  const lista = (matriz[f]?.[h] || []).slice().sort((a, b) => a.legajo - b.legajo)
                  const vacia = lista.length === 0
                  return (
                    <td
                      key={d}
                      className={`border-b border-linea p-0.5 align-top ${vacia && grupo === 'Conserje' ? 'bg-rose-50' : ''}`}
                    >
                      <div className="flex flex-wrap justify-center gap-0.5">
                        {lista.map((x, i) => (
                          <span
                            key={i}
                            title={x.nombre}
                            style={{ background: x.color, color: contraste(x.color) }}
                            className={`inline-flex min-w-[1.6rem] items-center justify-center rounded px-1 py-0.5 text-[11px] leading-none ${
                              x.cambiado ? 'border-[3px] border-black font-extrabold' : 'border-[3px] border-transparent font-semibold'
                            }`}
                          >
                            {x.legajo}
                            {x.cambiado ? '*' : ''}
                          </span>
                        ))}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section aria-labelledby="refs">
        <h2 id="refs" className="mb-2 text-sm font-semibold">Referencias</h2>
        <ul className="flex flex-wrap gap-2 text-xs">
          {(empleados || []).map((e) => (
            <li key={e.id} className="flex items-center gap-1.5 rounded-full border border-linea bg-white py-1 pl-1 pr-3">
              <span style={{ background: e.color, color: contraste(e.color) }} className="inline-flex min-w-[1.6rem] items-center justify-center rounded-full px-1.5 py-0.5 font-semibold">
                {e.legajo}
              </span>
              {e.alias || e.apellido_nombre}
            </li>
          ))}
        </ul>
        {!hayCambios ? <p className="mt-3 text-xs text-suave">No hay cambios aceptados en este mes.</p> : null}
      </section>
    </div>
  )
}
