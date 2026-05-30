'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { PhoneOtpForm } from './PhoneOtpForm'
import { GoogleSignInButton } from './GoogleSignInButton'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

type Tab = 'phone' | 'google'

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('phone')

  function handleSuccess() {
    onSuccess?.()
    onClose()
  }

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

        {/* Tab switcher */}
        <div
          className="flex gap-0 rounded-lg border border-zinc-800 bg-zinc-900 p-1"
          role="tablist"
          aria-label="Método de inicio de sesión"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'phone'}
            onClick={() => setActiveTab('phone')}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'phone'
                ? 'bg-zinc-700 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Teléfono
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'google'}
            onClick={() => setActiveTab('google')}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'google'
                ? 'bg-zinc-700 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Google
          </button>
        </div>

        {/* Tab panels */}
        <div className="mt-1">
          {activeTab === 'phone' && (
            <div role="tabpanel">
              <PhoneOtpForm onSuccess={handleSuccess} />
            </div>
          )}
          {activeTab === 'google' && (
            <div role="tabpanel" className="flex flex-col gap-3 py-2">
              <p className="text-sm text-zinc-400">
                Usa tu cuenta de Google para iniciar sesión de forma rápida y segura.
              </p>
              <GoogleSignInButton />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
