import type { AppointmentStatus } from '@/types'

export interface StatusMeta {
  label: string
  /** Text / accent color. */
  color: string
  /** Soft background for badges. */
  bg: string
  border: string
}

/** Visual + label metadata per appointment status (Spanish, premium palette). */
export const STATUS_META: Record<AppointmentStatus, StatusMeta> = {
  confirmed: {
    label: 'Confirmada',
    color: '#C9A96E',
    bg: 'rgba(201,169,110,0.12)',
    border: 'rgba(201,169,110,0.3)',
  },
  completed: {
    label: 'Asistida',
    color: '#4ADE80',
    bg: 'rgba(74,222,128,0.1)',
    border: 'rgba(74,222,128,0.28)',
  },
  cancelled: {
    label: 'Cancelada',
    color: '#FF8080',
    bg: 'rgba(255,80,80,0.08)',
    border: 'rgba(255,80,80,0.22)',
  },
  cancelled_by_client: {
    label: 'Cancelada (cliente)',
    color: '#FF8080',
    bg: 'rgba(255,80,80,0.08)',
    border: 'rgba(255,80,80,0.22)',
  },
  cancelled_by_admin: {
    label: 'Cancelada (admin)',
    color: '#FF8080',
    bg: 'rgba(255,80,80,0.08)',
    border: 'rgba(255,80,80,0.22)',
  },
  rescheduled: {
    label: 'Reagendada',
    color: '#7FB5E6',
    bg: 'rgba(127,181,230,0.1)',
    border: 'rgba(127,181,230,0.26)',
  },
  no_show: {
    label: 'No asistió',
    color: '#E6A85C',
    bg: 'rgba(230,168,92,0.1)',
    border: 'rgba(230,168,92,0.26)',
  },
}

export function statusMeta(status: AppointmentStatus): StatusMeta {
  return STATUS_META[status] ?? STATUS_META.confirmed
}
