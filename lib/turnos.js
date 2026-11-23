export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
export const DIAS_SEMANA = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

export const PALETA = [
  '#E6194B', '#3CB44B', '#FFB300', '#4363D8', '#F58231', '#911EB4', '#00A6A6', '#F032E6',
  '#7A8B00', '#9A6324', '#800000', '#2E7D32', '#000075', '#808000', '#C2185B', '#546E7A',
  '#FF6F61', '#1B9AAA', '#6A4C93', '#8D6E63', '#0B6E4F', '#D4A017', '#37474F', '#AD1457',
]

const p2 = (n) => String(n).padStart(2, '0')

// Fecha de hoy en Argentina, como 'YYYY-MM-DD'
export function hoy() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
}

// 'YYYY-MM' → datos del mes (si el valor no es válido usa el mes actual)
export function parseMes(valor) {
  const m = /^(\d{4})-(\d{2})$/.exec(valor || '')
  let anio, mes
  if (m && +m[2] >= 1 && +m[2] <= 12) {
    anio = +m[1]
    mes = +m[2]
  } else {
    const h = hoy()
    anio = +h.slice(0, 4)
    mes = +h.slice(5, 7)
  }
  const dias = new Date(Date.UTC(anio, mes, 0)).getUTCDate()
  const clave = `${anio}-${p2(mes)}`
  return {
    anio,
    mes,
    dias,
    clave,
    desde: `${clave}-01`,
    hasta: `${clave}-${p2(dias)}`,
    ant: mes === 1 ? `${anio - 1}-12` : `${anio}-${p2(mes - 1)}`,
    sig: mes === 12 ? `${anio + 1}-01` : `${anio}-${p2(mes + 1)}`,
    titulo: `${MESES[mes - 1]} ${anio}`,
  }
}

export const fechaDia = (clave, d) => `${clave}-${p2(d)}`

export function diaSemana(fecha) {
  const [y, m, d] = fecha.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

export function fechaCorta(fecha) {
  if (!fecha) return ''
  const [, m, d] = fecha.split('-')
  return `${DIAS_SEMANA[diaSemana(fecha)]} ${d}/${m}`
}

export function fechaLarga(fecha) {
  if (!fecha) return ''
  const [y, m, d] = fecha.split('-')
  return `${d}/${m}/${y}`
}

// 'HH:MM:SS' → horas decimales
export function horaDe(t) {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  return h + (m || 0) / 60
}

const hh = (x) => `${p2(Math.floor(x) % 24)}:${p2(Math.round((x - Math.floor(x)) * 60))}`

export function rangoTexto(info) {
  if (!info || !info.desde || !(Number(info.horas) > 0)) return ''
  const ini = horaDe(info.desde)
  return `${hh(ini)} a ${hh(ini + Number(info.horas))}`
}

const NO_TRABAJO = {
  L: ['#E5E7EB', '#374151'],
  FC: ['#E5E7EB', '#374151'],
  V: ['#CDEFE3', '#0B5D4B'],
  E: ['#FBD5D5', '#8A1C1C'],
  A: ['#FDE8B0', '#6B4A00'],
}

// Colores según el momento del día: mañana, tarde o noche
export function estiloCodigo(info, codigo) {
  if (!info || !(Number(info.horas) > 0)) {
    const [fondo, texto] = NO_TRABAJO[codigo] || ['#E5E7EB', '#374151']
    return { background: fondo, color: texto }
  }
  const ini = horaDe(info.desde) ?? 8
  if (ini < 12) return { background: '#FFF0B8', color: '#4A3B00' }
  if (ini < 20) return { background: '#FFD9C2', color: '#5A2A0A' }
  return { background: '#D5DBF7', color: '#1E2A5E' }
}

// Color de texto legible sobre un fondo
export function contraste(hex) {
  const h = (hex || '#999999').replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? '#111111' : '#FFFFFF'
}

export function mapaCodigos(codigos) {
  const m = {}
  ;(codigos || []).forEach((c) => {
    m[`${c.hotel_id}|${c.codigo}`] = c
  })
  return m
}
