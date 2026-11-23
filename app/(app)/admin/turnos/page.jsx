import { createClient } from '@/lib/supabase/server'
import { parseMes } from '@/lib/turnos'
import Filtros from '@/components/Filtros'
import Grilla from './Grilla'

export const metadata = { title: 'Cargar turnos' }

export default async function Turnos({ searchParams }) {
  const supabase = createClient()
  const mes = parseMes(searchParams?.mes)
  const { data: hoteles } = await supabase.from('hoteles').select('*').order('id')
  const hotelId = Number(searchParams?.hotel) || hoteles?.[0]?.id
  const grupo = searchParams?.grupo === 'Mucama' ? 'Mucama' : 'Conserje'

  const [{ data: codigos }, { data: empleados }, { data: base }, { data: efectos }] = await Promise.all([
    supabase.from('codigos_turno').select('*').eq('hotel_id', hotelId).in('grupo', [grupo, 'Ambos']).order('horas', { ascending: false }).order('codigo'),
    supabase.from('perfiles').select('id,legajo,alias,apellido_nombre,color').eq('rol', 'empleado').eq('activo', true).eq('grupo', grupo).order('legajo'),
    supabase.from('turnos').select('empleado_id,fecha,codigo').eq('hotel_id', hotelId).gte('fecha', mes.desde).lte('fecha', mes.hasta),
    supabase.from('efectos_cambio').select('empleado_id,fecha').eq('hotel_id', hotelId).gte('fecha', mes.desde).lte('fecha', mes.hasta),
  ])

  const baseMapa = {}
  ;(base || []).forEach((t) => {
    baseMapa[`${t.empleado_id}|${t.fecha}`] = t.codigo
  })
  const marcados = (efectos || []).map((e) => `${e.empleado_id}|${e.fecha}`)
  const dias = Array.from({ length: mes.dias }, (_, i) => i + 1)

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Cargar turnos</h1>
      <Filtros hoteles={hoteles || []} hotelId={hotelId} grupo={grupo} mes={mes.clave} />
      {empleados?.length ? (
        <Grilla
          key={`${hotelId}-${grupo}-${mes.clave}`}
          hotelId={hotelId}
          mesClave={mes.clave}
          dias={dias}
          empleados={empleados}
          codigos={codigos || []}
          base={baseMapa}
          marcados={marcados}
        />
      ) : (
        <p className="text-sm text-suave">No hay empleados activos en este grupo. Dalos de alta en Usuarios.</p>
      )}
    </div>
  )
}
