'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'

export async function guardarTurnos(prev, fd) {
  try {
    await requireAdmin()
    const hotel_id = Number(fd.get('hotel_id'))
    const cambios = JSON.parse(String(fd.get('payload') || '[]'))
    if (!hotel_id || !Array.isArray(cambios) || cambios.length === 0) {
      return { ok: false, mensaje: 'No hay cambios para guardar.' }
    }
    const supabase = createClient()

    const guardar = cambios
      .filter((c) => c.codigo)
      .map((c) => ({ hotel_id, empleado_id: c.empleado_id, fecha: c.fecha, codigo: c.codigo }))
    if (guardar.length) {
      const { error } = await supabase.from('turnos').upsert(guardar, { onConflict: 'hotel_id,empleado_id,fecha' })
      if (error) throw new Error(error.message)
    }

    const borrar = {}
    cambios.filter((c) => !c.codigo).forEach((c) => (borrar[c.empleado_id] ||= []).push(c.fecha))
    for (const [empleado_id, fechas] of Object.entries(borrar)) {
      const { error } = await supabase.from('turnos').delete().eq('hotel_id', hotel_id).eq('empleado_id', empleado_id).in('fecha', fechas)
      if (error) throw new Error(error.message)
    }

    revalidatePath('/admin/turnos')
    revalidatePath('/admin/resumen')
    revalidatePath('/mis-turnos')
    return { ok: true, mensaje: `Se guardaron ${cambios.length} cambios.` }
  } catch (e) {
    return { ok: false, mensaje: e.message || 'No se pudo guardar.' }
  }
}
