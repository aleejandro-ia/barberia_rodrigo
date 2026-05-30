import type { Metadata } from 'next'
import { Outfit, Dancing_Script } from 'next/font/google'
import './globals.css'

/* Main font — Outfit: more premium, better x-height, cleaner at small sizes */
const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['300', '400', '500', '600', '700', '800'],
})

/* Script font — kept for signature + Maestro Barbero */
const dancingScript = Dancing_Script({
  subsets: ['latin'],
  variable: '--font-dancing',
  weight: ['400', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Rodrigo Barbería',
  description: 'Reserva tu cita online con Rodrigo',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body
        className={`${outfit.variable} ${dancingScript.variable} antialiased`}
        style={{ backgroundColor: '#0E0B08', color: '#F2EDE7' }}
      >
        {children}
      </body>
    </html>
  )
}
