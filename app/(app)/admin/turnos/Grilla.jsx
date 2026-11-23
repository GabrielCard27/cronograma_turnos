'use client'
import { useMemo, useState } from 'react'
import FormAction, { Enviar } from '@/components/FormAction'
import { contraste, diaSemana, DIAS_SEMANA, fechaDia } from '@/lib/turnos'
import { guardarTurnos } from './actions'

export default function Grilla({ hotelId, mesClave, dias, empleados, codigos, base, marcados }) {
  const [valores, setValores] = useState(base)
  const horasDe = useMemo(() => Object.fromEntries(codigos.map((c) => [c.codigo, Number(c.horas)])), [codigos])
  const marcadas = useMemo(() => new Set(marcados), [marcados])

  const cambios = useMemo(() => {
    const claves = new Set([...Object.keys(base), ...Object.keys(valores)])
    const lista = []
    claves.forEach((k) => {
      if ((valores[k] || '') !== (base[k] || '')) {
        const [empleado_id, fecha] = k.split('|')
        lista.push({ empleado_id, fecha, codigo: valores[k] || '' })
      }
    })
    return lista
  }, [valores, base])

  const cambiar = (clave, codigo) => setValores((v) => ({ ...v, [clave]: codigo }))

  return (
    <FormAction action={guardarTurnos}>
      <input type="hidden" name="hotel_id" value={hotelId} />
      <input type="hidden" name="payload" value={JSON.stringify(cambios)} />

      <div className="max-h-[68vh] overflow-auto rounded-lg border border-linea bg-white">
        <table className="border-separate border-spacing-0 text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-30 min-w-[8.5rem] border-b border-r border-linea bg-white px-2 py-1 text-left">Empleado</th>
              {dias.map((d) => {
                const f = fechaDia(mesClave, d)
                const dom = diaSemana(f) === 0
                return (
                  <th key={d} className={`sticky top-0 z-20 border-b border-linea px-0.5 py-1 text-center ${dom ? 'bg-rose-50' : 'bg-white'}`}>
                    <span className="block font-bold">{d}</span>
                    <span className="block font-normal text-suave">{DIAS_SEMANA[diaSemana(f)]}</span>
                  </th>
                )
              })}
              <th className="sticky top-0 z-20 border-b border-l border-linea bg-white px-2 py-1">Hs</th>
            </tr>
          </thead>
          <tbody>
            {empleados.map((e) => {
              const total = dias.reduce((s, d) => s + (horasDe[valores[`${e.id}|${fechaDia(mesClave, d)}`]] || 0), 0)
              return (
                <tr key={e.id}>
                  <th className="sticky left-0 z-10 border-b border-r border-linea bg-white px-2 py-1 text-left font-medium">
                    <span
                      style={{ background: e.color, color: contraste(e.color) }}
                      className="mr-1.5 inline-flex min-w-[1.5rem] justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold"
                    >
                      {e.legajo}
                    </span>
                    {e.alias || e.apellido_nombre}
                  </th>
                  {dias.map((d) => {
                    const f = fechaDia(mesClave, d)
                    const clave = `${e.id}|${f}`
                    const actual = valores[clave] || ''
                    const modificado = actual !== (base[clave] || '')
                    const hayOpcion = !actual || codigos.some((c) => c.codigo === actual)
                    return (
                      <td key={d} className="border-b border-linea p-0.5">
                        <select
                          aria-label={`${e.alias || e.apellido_nombre}, día ${d}`}
                          value={actual}
                          onChange={(ev) => cambiar(clave, ev.target.value)}
                          title={marcadas.has(clave) ? 'Tiene un cambio de turno aceptado' : undefined}
                          className={`h-9 w-12 rounded border-[3px] px-0 text-center text-xs font-semibold ${
                            marcadas.has(clave) ? 'border-black' : 'border-transparent'
                          } ${modificado ? 'bg-amber-100' : 'bg-papel'}`}
                        >
                          <option value="">·</option>
                          {!hayOpcion ? <option value={actual}>{actual}</option> : null}
                          {codigos.map((c) => (
                            <option key={c.codigo} value={c.codigo}>{c.codigo}</option>
                          ))}
                        </select>
                      </td>
                    )
                  })}
                  <td className="border-b border-l border-linea px-2 text-center font-semibold tabular-nums">{total}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Enviar>Guardar {cambios.length ? `(${cambios.length})` : ''}</Enviar>
        {cambios.length ? (
          <button type="button" className="btn-sec" onClick={() => setValores(base)}>Descartar cambios</button>
        ) : null}
        <p className="text-sm text-suave">Las celdas con borde grueso tienen un cambio de turno aceptado; se administran en Cambios.</p>
      </div>
    </FormAction>
  )
}
