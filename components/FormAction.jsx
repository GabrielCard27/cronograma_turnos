'use client'
import { useEffect, useRef } from 'react'
import { useFormState, useFormStatus } from 'react-dom'

export function Enviar({ children, className = 'btn', name, value }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" name={name} value={value} disabled={pending} className={className}>
      {pending ? 'Guardando…' : children}
    </button>
  )
}

// Envuelve un <form> con una Server Action que devuelve { ok, mensaje }
export default function FormAction({ action, children, className = '', limpiar = false }) {
  const [estado, accion] = useFormState(action, { ok: false, mensaje: '' })
  const ref = useRef(null)

  useEffect(() => {
    if (estado.ok && limpiar && ref.current) ref.current.reset()
  }, [estado, limpiar])

  return (
    <form action={accion} ref={ref} className={className}>
      {children}
      {estado.mensaje ? (
        <p role="status" className={`mt-3 text-sm font-medium ${estado.ok ? 'text-ok' : 'text-alerta'}`}>
          {estado.mensaje}
        </p>
      ) : null}
    </form>
  )
}
