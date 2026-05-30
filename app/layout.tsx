import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Dancing_Script } from 'next/font/google'
import './globals.css'

/* Main font — Plus Jakarta Sans: humanist grotesque, crisp rendering, premium feel */
const outfit = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['400', '500', '600', '700', '800'],
})

/* Script font — kept for signature + Maestro Barbero */
const dancingScript = Dancing_Script({
  subsets: ['latin'],
  variable: '--font-dancing',
  weight: ['400', '600', '700'],
})

export const metadata: Metadata = {
  title: 'BG Barber — Rodrigo Bargueño',
  description: 'Barbería BG Barber. Solo cita previa. Reserva online.',
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
