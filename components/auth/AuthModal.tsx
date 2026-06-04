'use client'

import { Scissors, ShieldCheck } from '@phosphor-icons/react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { GoogleSignInButton } from './GoogleSignInButton'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => { if (!open) onClose() }}>
      <DialogContent
        showCloseButton
        className="max-w-sm overflow-hidden"
        style={{
          backgroundColor: '#161310',
          border: '1px solid rgba(201,169,110,0.28)',
          borderRadius: 22,
          padding: '28px 26px 24px',
          boxShadow:
            '0 30px 70px rgba(0,0,0,0.6), 0 2px 0 rgba(201,169,110,0.06), inset 0 1px 0 rgba(255,255,255,0.05), inset 0 0 0 1px rgba(201,169,110,0.05)',
          backgroundImage:
            'radial-gradient(120% 80% at 50% -10%, rgba(201,169,110,0.10) 0%, transparent 55%)',
        }}
      >
        {/* Premium top hairline */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            left: '14%',
            right: '14%',
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(201,169,110,0.6), transparent)',
          }}
        />

        <DialogHeader>
          {/* Emblem */}
          <div
            className="mx-auto mb-4 flex items-center justify-center"
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: 'rgba(201,169,110,0.1)',
              border: '1px solid rgba(201,169,110,0.25)',
            }}
          >
            <Scissors size={26} weight="duotone" style={{ color: '#C9A96E' }} />
          </div>

          <DialogTitle
            className="text-center"
            style={{
              fontFamily: 'var(--font-serif), Georgia, serif',
              color: '#F2EDE7',
              fontSize: '2rem',
              fontWeight: 600,
              letterSpacing: '0.005em',
              lineHeight: 1.1,
              textRendering: 'optimizeLegibility',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
            }}
          >
            Reserva tu cita
          </DialogTitle>
          <DialogDescription
            className="text-center"
            style={{
              color: '#A89F94',
              fontSize: '0.9rem',
              lineHeight: 1.55,
              marginTop: 8,
              textRendering: 'optimizeLegibility',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
            }}
          >
            Identifícate en un segundo para asegurar tu hueco. Sin contraseñas, sin complicaciones.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-2">
          <GoogleSignInButton />

          {/* Trust line */}
          <div className="flex items-center justify-center gap-1.5">
            <ShieldCheck size={13} style={{ color: '#4A4540' }} />
            <span style={{ fontSize: '0.72rem', color: '#4A4540' }}>
              Tus datos están protegidos y encriptados
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
