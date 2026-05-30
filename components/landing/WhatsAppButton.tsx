'use client'

import { motion, useReducedMotion } from 'motion/react'
import { WhatsappLogo } from '@phosphor-icons/react'

export default function WhatsAppButton() {
  const shouldReduceMotion = useReducedMotion()
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '34000000000'

  return (
    <a
      href={`https://wa.me/${number}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-6 right-6 z-50"
    >
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                scale: [1, 1.06, 1],
              }
        }
        transition={{
          duration: 2.4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
        style={{ backgroundColor: '#25D366' }}
      >
        <WhatsappLogo size={26} weight="fill" color="#fff" />
      </motion.div>
    </a>
  )
}
