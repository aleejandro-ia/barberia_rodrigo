'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import MisDatosModal from './MisDatosModal'

// Same key BookingSection uses to stash a pending booking across OAuth.
// If present, the user is mid-booking — don't interrupt with onboarding.
const PENDING_BOOKING_KEY = 'bgbarber_pending_booking'
// Per-session dismiss flag so we don't nag after the user closes it.
const ONBOARDING_DISMISSED_KEY = 'bgbarber_onboarding_dismissed'

/**
 * Global first-login onboarding. When a logged-in user has no phone on their
 * profile yet, prompt them to complete "Mis datos" once. Trigger = empty phone,
 * which also captures users who signed up before this feature existed.
 */
export default function ProfileOnboarding() {
  const [open, setOpen] = useState(false)
  const checkedForUser = useRef<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const maybePrompt = async (userId: string | null) => {
      if (!userId) return
      // Only check once per user id per mount.
      if (checkedForUser.current === userId) return
      checkedForUser.current = userId

      // Don't interrupt an in-progress booking restored after OAuth.
      try {
        if (sessionStorage.getItem(PENDING_BOOKING_KEY)) return
        if (sessionStorage.getItem(ONBOARDING_DISMISSED_KEY)) return
      } catch {
        /* sessionStorage unavailable — proceed */
      }

      try {
        const res = await fetch('/api/profile')
        if (!res.ok) return
        const data = await res.json()
        const phone = (data?.profile?.phone ?? '').trim()
        if (!phone) {
          // Small delay so it doesn't fight the post-OAuth redirect/scroll.
          setTimeout(() => setOpen(true), 600)
        }
      } catch {
        /* network error — skip silently */
      }
    }

    supabase.auth.getUser().then(({ data: { user } }) => maybePrompt(user?.id ?? null))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      maybePrompt(session?.user?.id ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  function handleClose() {
    setOpen(false)
    try {
      sessionStorage.setItem(ONBOARDING_DISMISSED_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  return <MisDatosModal open={open} onClose={handleClose} variant="onboarding" />
}
