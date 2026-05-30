import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: 'Rodrigo Barbería',
  description: 'Reserva tu cita online con Rodrigo',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className={`${geist.variable} ${geistMono.variable} antialiased bg-zinc-950 text-zinc-50`}>
        {children}
      </body>
    </html>
  )
}
