import type { Metadata } from 'next'
import { Geist, Geist_Mono, Dancing_Script } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })
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
        className={`${geist.variable} ${geistMono.variable} ${dancingScript.variable} antialiased`}
        style={{ backgroundColor: '#0E0B08', color: '#F2EDE7' }}
      >
        {children}
      </body>
    </html>
  )
}
