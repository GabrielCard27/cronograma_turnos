'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { TIPOS } from '@/lib/cambios'

const FECHA = /^\d{4}-\d{2}-\d{2}$/

function refrescar() {
  revalidatePath('/admin/cambios')
  revalidatePath('/admin/resumen')
  revalidatePath('/admin/turnos')
  revalidatePath('/cambios')
  revalidatePath('/mis-turnos')
}

// Aceptar o rechazar una solicitud pendiente (se pueden completar los datos que falten)
export async function resolverCambio(prev, fd) {
  try {
    await requireAdmin()
    const estado = fd.get('estado') === 'aceptada' ? 'aceptada' : 'rechazada'
    const fecha = String(fd.get('fecha_cambiado') || '')
    const supabase = createClient()
    const { error } = await supabase.rpc('resolver_cambio', {
      p_id: Number(fd.get('id')),
      p_estado: estado,
      p_reemplazante: String(fd.get('reemplazante') || '') || null,
      p_fecha: FECHA.test(fecha) ? fecha : null,
      p_turno: String(fd.get('turno_cambiado') || ''),
    })
    if (error) {
      const claro = /^(El|Falta|Sin|Estado)/.test(error.message)
      return { ok: false, mensaje: claro ? error.message : 'No se pudo resolver el cambio. Revisá los datos.' }
    }
    refrescar()
    return { ok: true, mensaje: estado === 'aceptada' ? 'Cambio aceptado.' : 'Cambio rechazado.' }
  } catch (e) {
    return { ok: false, mensaje: e.message }
  }
}

// El administrador carga un cambio que queda aceptado
export async function crearCambioDirecto(prev, fd) {
  try {
    const admin = await requireAdmin()
    const hotel_id = Number(fd.get('hotel_id'))
    const solicitante_id = String(fd.get('solicitante') || '')
    const fecha_origen = String(fd.get('fecha_origen') || '')
    const tipo = String(fd.get('tipo') || '')
    const reemplazante_id = String(fd.get('reemplazante') || '')
    const fecha_cambiado = String(fd.get('fecha_cambiado') || '')
    const turno_cambiado = String(fd.get('turno_cambiado') || '') || null
    const motivo = String(fd.get('motivo') || '').trim().slice(0, 300) || null

    if (!hotel_id || !solicitante_id || !FECHA.test(fecha_origen)) return { ok: false, mensaje: 'Completá hotel, solicitante y fecha original.' }
    if (!TIPOS[tipo]) return { ok: false, mensaje: 'Elegí el tipo de cambio.' }
    if (!reemplazante_id) return { ok: false, mensaje: 'Elegí al reemplazante.' }
    if (reemplazante_id === solicitante_id) return { ok: false, mensaje: 'El reemplazante debe ser otra persona.' }
    if (!FECHA.test(fecha_cambiado)) return { ok: false, mensaje: 'Indicá la fecha del turno cambiado.' }

    const supabase = createClient()
    const { data: t } = await supabase
      .from('v_turnos').select('codigo').eq('hotel_id', hotel_id).eq('empleado_id', solicitante_id).eq('fecha', fecha_origen).maybeSingle()
    if (!t?.codigo) return { ok: false, mensaje: 'El solicitante no tiene turno cargado en esa fecha y hotel.' }

    if (turno_cambiado) {
      const { data: c } = await supabase.from('codigos_turno').select('codigo').eq('hotel_id', hotel_id).eq('codigo', turno_cambiado).maybeSingle()
      if (!c) return { ok: false, mensaje: 'Ese turno no existe en el hotel elegido.' }
    }

    const { error } = await supabase.from('cambios').insert({
      modo: 'directo', tipo, estado: 'aceptada', hotel_id,
      solicitante_id, fecha_origen, turno_origen: t.codigo,
      reemplazante_id, fecha_cambiado, turno_cambiado, motivo,
      resuelto_por: admin.id, resuelto_en: new Date().toISOString(),
    })
    if (error) return { ok: false, mensaje: 'No se pudo cargar el cambio. Revisá los datos.' }
    refrescar()
    return { ok: true, mensaje: 'Cambio cargado y aplicado.' }
  } catch (e) {
    return { ok: false, mensaje: e.message }
  }
}
