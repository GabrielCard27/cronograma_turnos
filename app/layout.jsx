import './globals.css'
import { Public_Sans } from 'next/font/google'
import RegisterSW from '@/components/RegisterSW'

const fuente = Public_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })

export const metadata = {
  title: { default: 'Turnos', template: '%s · Turnos' },
  description: 'Consulta y gestión de turnos de conserjes y mucamas.',
  applicationName: 'Turnos',
  appleWebApp: { capable: true, title: 'Turnos', statusBarStyle: 'default' },
  icons: { icon: '/icons/icon-192.png', apple: '/icons/apple-touch-icon.png' },
}

export const viewport = {
  themeColor: '#16213A',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={fuente.variable}>
      <body className="font-sans">
        {children}
        <RegisterSW />
      </body>
    </html>
  )
}
