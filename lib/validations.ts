import { z } from 'zod'

export const bookAppointmentSchema = z.object({
  slot_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slot_start_time: z.string().regex(/^\d{2}:\d{2}$/),
  slot_end_time: z.string().regex(/^\d{2}:\d{2}$/),
  client_name: z.string().min(2).max(100),
  client_phone: z
    .string()
    .transform((v) => v.replace(/\s/g, ''))
    .pipe(z.string().regex(/^\d{9}$/, 'Teléfono debe tener 9 dígitos')),
  notes: z.string().max(500).optional(),
})

export const createSlotsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  barber_id: z.string().uuid(),
  slots: z
    .array(
      z.object({
        start_time: z.string().regex(/^\d{2}:\d{2}$/),
        end_time: z.string().regex(/^\d{2}:\d{2}$/),
      })
    )
    .min(1)
    .max(50),
})

export const bulkCreateSlotsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  barber_id: z.string().uuid(),
  from_time: z.string().regex(/^\d{2}:\d{2}$/),
  to_time: z.string().regex(/^\d{2}:\d{2}$/),
  slot_duration: z.number().int().min(15).max(120).default(30),
})

/* ─── Admin Agenda schemas ───────────────────────────────────── */

export const adminCreateAppointmentSchema = z.object({
  slot_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slot_start_time: z.string().regex(/^\d{2}:\d{2}$/),
  slot_end_time: z.string().regex(/^\d{2}:\d{2}$/),
  barber_id: z.string().uuid().optional(),
  client_name: z.string().min(2).max(100),
  client_phone: z
    .string()
    .transform((v) => v.replace(/\s/g, ''))
    .pipe(z.string().regex(/^\d{9}$/, 'Teléfono debe tener 9 dígitos')),
  notes: z.string().max(500).optional(),
})

export const adminEditAppointmentSchema = z.object({
  client_name: z.string().min(2).max(100),
  client_phone: z
    .string()
    .transform((v) => v.replace(/\s/g, ''))
    .pipe(z.string().regex(/^\d{9}$/, 'Teléfono debe tener 9 dígitos')),
  notes: z.string().max(500).optional(),
})
