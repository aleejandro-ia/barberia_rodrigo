'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface PhoneOtpFormProps {
  onSuccess?: () => void
}

type Step = 'phone' | 'otp'

export function PhoneOtpForm({ onSuccess }: PhoneOtpFormProps) {
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const fullPhone = phone.startsWith('+') ? phone : `+34${phone}`

    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: fullPhone,
    })

    setLoading(false)

    if (otpError) {
      setError(otpError.message)
      return
    }

    setPhone(fullPhone)
    setStep('otp')
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms',
    })

    setLoading(false)

    if (verifyError) {
      setError(verifyError.message)
      return
    }

    onSuccess?.()
  }

  async function handleResend() {
    setError(null)
    setLoading(true)

    const { error: resendError } = await supabase.auth.signInWithOtp({
      phone,
    })

    setLoading(false)

    if (resendError) {
      setError(resendError.message)
    }
  }

  if (step === 'otp') {
    return (
      <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="otp" className="text-zinc-200">
            Código de verificación
          </Label>
          <p className="text-xs text-zinc-400">
            Enviamos un código a {phone}
          </p>
          <Input
            id="otp"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            required
            autoComplete="one-time-code"
            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:border-zinc-500 h-10 text-center text-lg tracking-widest"
          />
        </div>

        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="w-full h-10 bg-white text-zinc-950 hover:bg-zinc-100 font-medium"
        >
          {loading ? 'Verificando...' : 'Verificar'}
        </Button>

        <button
          type="button"
          onClick={handleResend}
          disabled={loading}
          className="text-sm text-zinc-400 hover:text-zinc-200 underline underline-offset-4 transition-colors disabled:opacity-50"
        >
          Reenviar código
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone" className="text-zinc-200">
          Número de teléfono
        </Label>
        <div className="flex gap-2">
          <span className="inline-flex items-center rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-sm text-zinc-400 select-none">
            +34
          </span>
          <Input
            id="phone"
            type="tel"
            placeholder="612 345 678"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d+\s]/g, ''))}
            required
            autoComplete="tel"
            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:border-zinc-500 h-10 flex-1"
          />
        </div>
        <p className="text-xs text-zinc-500">
          Si tu número no es español, escríbelo con prefijo (+1, +52…)
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={loading || phone.length < 9}
        className="w-full h-10 bg-white text-zinc-950 hover:bg-zinc-100 font-medium"
      >
        {loading ? 'Enviando...' : 'Enviar código'}
      </Button>
    </form>
  )
}
