'use client'

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
        className="bg-zinc-950 border border-zinc-800 text-white max-w-sm"
      >
        <DialogHeader>
          <DialogTitle className="text-white text-lg font-semibold">
            Inicia sesión para reservar
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-sm">
            Verificamos tu identidad para evitar reservas falsas.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          <p className="text-sm text-zinc-400">
            Usa tu cuenta de Google para iniciar sesión de forma rápida y segura.
          </p>
          <GoogleSignInButton />
        </div>
      </DialogContent>
    </Dialog>
  )
}
