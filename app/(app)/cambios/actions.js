'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getPerfil } from '@/lib/auth'
import { TIPOS } from '@/lib/cambios'

const FECHA = /^\d{4}-\d{2}-\d{2}$/

function refrescar() {
  revalidatePath('/cambios')
  revalidatePath('/mis-turnos')
  revalidatePath('/admin/cambios')
}

export async function crearSolicitud(prev, fd) {
  const perfil = await getPerfil()
  if (!perfil) return { ok: false, mensaje: 'Tu sesión venció. Ingresá de nuevo.' }

  const [hotelTxt, fecha] = String(fd.get('turno') || '').split('|')
  const hotel_id = Number(hotelTxt)
  const tipo = String(fd.get('tipo') || '')
  const modo = fd.get('modo') === 'con_reemplazante' ? 'con_reemplazante' : 'solicitud'
  const reemplazante_id = String(fd.get('reemplazante') || '') || null
  const fecha_cambiado = String(fd.get('fecha_cambiado') || '') || null
  const turno_cambiado = String(fd.get('turno_cambiado') || '') || null
  const motivo = String(fd.get('motivo') || '').trim().slice(0, 300) || null

  if (!hotel_id || !FECHA.test(fecha || '')) return { ok: false, mensaje: 'Elegí el turno que querés cambiar.' }
  if (!TIPOS[tipo]) return { ok: false, mensaje: 'Elegí el tipo de cambio.' }
  if (modo === 'con_reemplazante' && !reemplazante_id) return { ok: false, mensaje: 'Elegí al compañero que te cubre.' }
  if (fecha_cambiado && !FECHA.test(fecha_cambiado)) return { ok: false, mensaje: 'La fecha a cambio no es válida.' }
  if (turno_cambiado && !fecha_cambiado) return { ok: false, mensaje: 'Indicá la fecha del turno a cambio.' }

  const supabase = createClient()
  const { data: t } = await supabase
    .from('v_turnos').select('codigo').eq('empleado_id', perfil.id).eq('hotel_id', hotel_id).eq('fecha', fecha).maybeSingle()
  if (!t?.codigo) return { ok: false, mensaje: 'No tenés un turno cargado ese día en ese hotel.' }

  if (turno_cambiado) {
    const { data: c } = await supabase
      .from('codigos_turno').select('codigo').eq('hotel_id', hotel_id).eq('codigo', turno_cambiado).maybeSingle()
    if (!c) return { ok: false, mensaje: 'Ese turno no existe en el hotel del turno que querés cambiar.' }
  }

  const { error } = await supabase.from('cambios').insert({
    modo, tipo, hotel_id,
    solicitante_id: perfil.id,
    fecha_origen: fecha,
    turno_origen: t.codigo,
    reemplazante_id,
    fecha_cambiado,
    turno_cambiado,
    motivo,
  })
  if (error) return { ok: false, mensaje: 'No se pudo enviar la solicitud. Revisá los datos e intentá de nuevo.' }
  refrescar()
  return { ok: true, mensaje: 'Solicitud enviada.' }
}

export async function responderCambio(prev, fd) {
  const supabase = createClient()
  const { error } = await supabase.rpc('responder_cambio', {
    p_id: Number(fd.get('id')),
    p_acepta: fd.get('respuesta') === 'si',
  })
  if (error) return { ok: false, mensaje: 'No se pudo registrar tu respuesta.' }
  refrescar()
  return { ok: true, mensaje: 'Respuesta enviada.' }
}

export async function retirarSolicitud(prev, fd) {
  const perfil = await getPerfil()
  if (!perfil) return { ok: false, mensaje: 'Tu sesión venció.' }
  const supabase = createClient()
  const { error } = await supabase
    .from('cambios').delete().eq('id', Number(fd.get('id'))).eq('solicitante_id', perfil.id).eq('estado', 'solicitada')
  if (error) return { ok: false, mensaje: 'No se pudo retirar la solicitud.' }
  refrescar()
  return { ok: true, mensaje: 'Solicitud retirada.' }
}
