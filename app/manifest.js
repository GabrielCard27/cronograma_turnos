export default function manifest() {
  return {
    name: 'Turnos',
    short_name: 'Turnos',
    description: 'Consulta y gestión de turnos de conserjes y mucamas.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#F5F6F8',
    theme_color: '#16213A',
    lang: 'es',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
