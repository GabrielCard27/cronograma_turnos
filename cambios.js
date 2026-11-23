import { fechaCorta } from '@/lib/turnos'

export const TIPOS = {
  permutacion: 'Permutación',
  reprogramacion: 'Reprogramación',
  cancelacion_franco: 'Cancelación de franco',
}

export const ESTADOS = {
  solicitada: { texto: 'Pendiente', clase: 'bg-amber-100 text-amber-900' },
  aceptada: { texto: 'Aceptado', clase: 'bg-emerald-100 text-emerald-900' },
  rechazada: { texto: 'Rechazado', clase: 'bg-rose-100 text-rose-900' },
}

export function estadoDetalle(c) {
  if (c.estado === 'aceptada') return 'Aplicado en tus turnos.'
  if (c.estado === 'rechazada') {
    return c.modo === 'con_reemplazante' && c.reemplazante_acepta === false
      ? `${c.reemplazante} no aceptó el cambio.`
      : 'El cambio fue rechazado.'
  }
  if (c.modo === 'con_reemplazante') {
    if (c.reemplazante_acepta === true) return `${c.reemplazante} aceptó. Falta la aprobación del administrador.`
    return `Esperando respuesta de ${c.reemplazante}.`
  }
  return 'Esperando la aprobación del administrador.'
}

export function resumenCambio(c) {
  let t = `${c.solicitante} cede su turno ${c.turno_origen} del ${fechaCorta(c.fecha_origen)}`
  if (c.reemplazante) t += ` a ${c.reemplazante}`
  if (c.fecha_cambiado) {
    t += `; a cambio trabaja el ${fechaCorta(c.fecha_cambiado)}`
    if (c.turno_cambiado) t += ` (${c.turno_cambiado})`
  }
  return t + '.'
}

// Texto para el empleado: qué cambió en SUS turnos
export function novedadPara(c, yo) {
  if (c.reemplazante_id === yo) {
    let t = `Cubrís el turno ${c.turno_origen} del ${fechaCorta(c.fecha_origen)} (${c.hotel}) en lugar de ${c.solicitante}.`
    if (c.tipo === 'permutacion' && c.fecha_cambiado) t += ` El ${fechaCorta(c.fecha_cambiado)} quedás libre.`
    return t
  }
  let t = `Dejás tu turno ${c.turno_origen} del ${fechaCorta(c.fecha_origen)} (${c.hotel})${c.reemplazante ? `; lo cubre ${c.reemplazante}` : ''}.`
  if (c.fecha_cambiado) t += ` Trabajás el ${fechaCorta(c.fecha_cambiado)}${c.turno_cambiado ? ` (${c.turno_cambiado})` : ''}.`
  return t
}
