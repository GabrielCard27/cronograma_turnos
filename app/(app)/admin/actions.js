'use server'
import { revalidatePath } from 'next/cache'
import { adminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'

function leer(fd) {
  const rol = fd.get('rol') === 'admin' ? 'admin' : 'empleado'
  const grupoTxt = String(fd.get('grupo') || '')
  const legajoTxt = String(fd.get('legajo') || '').trim()
  return {
    email: String(fd.get('email') || '').trim().toLowerCase(),
    apellido_nombre: String(fd.get('apellido_nombre') || '').trim(),
    alias: String(fd.get('alias') || '').trim() || null,
    legajo: legajoTxt ? Number(legajoTxt) : null,
    rol,
    grupo: rol === 'empleado' && ['Conserje', 'Mucama'].includes(grupoTxt) ? grupoTxt : null,
    color: /^#[0-9a-fA-F]{6}$/.test(String(fd.get('color'))) ? String(fd.get('color')) : '#9CA3AF',
  }
}

function validar(d) {
  if (!d.email || !d.apellido_nombre) return 'Completá el correo y el apellido y nombre.'
  if (d.rol === 'empleado' && !d.grupo) return 'Elegí el grupo del empleado (conserje o mucama).'
  if (d.rol === 'empleado' && (!d.legajo || d.legajo < 1)) return 'Indicá el ID del empleado (un número).'
  return null
}

function traducir(msg = '') {
  if (/already|registered|exists/i.test(msg)) return 'Ya existe un usuario con ese correo.'
  if (/password/i.test(msg)) return 'La contraseña no es válida (mínimo 8 caracteres).'
  return msg || 'No se pudo completar la operación.'
}

export async function crearUsuario(prev, fd) {
  try {
    await requireAdmin()
    const d = leer(fd)
    const password = String(fd.get('password') || '')
    const falta = validar(d)
    if (falta) return { ok: false, mensaje: falta }
    if (password.length < 8) return { ok: false, mensaje: 'La contraseña inicial debe tener al menos 8 caracteres.' }

    const admin = adminClient()
    const { data, error } = await admin.auth.admin.createUser({ email: d.email, password, email_confirm: true })
    if (error) return { ok: false, mensaje: traducir(error.message) }

    const { error: e2 } = await admin.from('perfiles').insert({ id: data.user.id, ...d })
    if (e2) {
      await admin.auth.admin.deleteUser(data.user.id)
      return { ok: false, mensaje: e2.code === '23505' ? 'Ya hay otro empleado con ese ID.' : 'No se pudo crear el perfil.' }
    }
    revalidatePath('/admin/usuarios')
    return { ok: true, mensaje: 'Usuario creado. Pasale el correo y la contraseña inicial.' }
  } catch (e) {
    return { ok: false, mensaje: e.message }
  }
}

export async function actualizarUsuario(prev, fd) {
  try {
    const yo = await requireAdmin()
    const id = String(fd.get('id') || '')
    const d = leer(fd)
    const activo = fd.get('activo') === 'on'
    const password = String(fd.get('password') || '')
    const falta = validar(d)
    if (falta) return { ok: false, mensaje: falta }
    if (id === yo.id && (d.rol !== 'admin' || !activo)) {
      return { ok: false, mensaje: 'No podés quitarte el rol de administrador ni desactivar tu propio usuario.' }
    }
    if (password && password.length < 8) return { ok: false, mensaje: 'La contraseña nueva debe tener al menos 8 caracteres.' }

    const admin = adminClient()
    const { error } = await admin.from('perfiles').update({ ...d, activo }).eq('id', id)
    if (error) return { ok: false, mensaje: error.code === '23505' ? 'Ya hay otro empleado con ese ID.' : 'No se pudo guardar.' }

    const cambiosAuth = { email: d.email, email_confirm: true, ban_duration: activo ? 'none' : '87600h' }
    if (password) cambiosAuth.password = password
    const { error: e2 } = await admin.auth.admin.updateUserById(id, cambiosAuth)
    if (e2) return { ok: false, mensaje: traducir(e2.message) }

    revalidatePath('/admin/usuarios')
    return { ok: true, mensaje: 'Cambios guardados.' }
  } catch (e) {
    return { ok: false, mensaje: e.message }
  }
}
