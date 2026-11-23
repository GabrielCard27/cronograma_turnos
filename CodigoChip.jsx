import { estiloCodigo } from '@/lib/turnos'

// Muestra el código de turno. Si fue modificado por un cambio: borde grueso, negrita y asterisco.
export default function CodigoChip({ codigo, info, cambiado = false }) {
  if (!codigo) return null
  const estilo = estiloCodigo(info, codigo)
  return (
    <span
      style={estilo}
      title={info?.descripcion}
      className={`inline-flex min-w-9 items-center justify-center rounded px-1.5 py-0.5 text-xs font-bold ${
        cambiado ? 'border-[3px] border-black' : 'border-[3px] border-transparent'
      }`}
    >
      {codigo}
      {cambiado ? '*' : ''}
    </span>
  )
}
