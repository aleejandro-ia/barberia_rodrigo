/**
 * PREREQUISITO: npm install resend
 * ENV VARS necesarias:
 *   RESEND_API_KEY=re_xxxxxxxxxxxx
 *   RESEND_FROM_EMAIL=citas@tudominio.com (o onboarding@resend.dev para pruebas)
 */
import { Resend } from 'resend'

// Lazy-initialize — do NOT instantiate at module level (throws during build if key missing)
function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}
function getFrom() {
  return process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
}

export interface AppointmentEmailData {
  to:        string
  name:      string
  date:      string
  time:      string
  service?:  string
  business:  string
  newDate?:  string
  newTime?:  string
}

export async function sendConfirmationEmail(data: AppointmentEmailData) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping confirmation email')
    return { skipped: true }
  }
  return getResend().emails.send({
    from:    getFrom(),
    to:      data.to,
    subject: `Cita confirmada en ${data.business}`,
    html:    buildConfirmationHtml(data),
  })
}

export async function sendCancellationEmail(data: AppointmentEmailData) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping cancellation email')
    return { skipped: true }
  }
  return getResend().emails.send({
    from:    getFrom(),
    to:      data.to,
    subject: `Cita cancelada en ${data.business}`,
    html:    buildCancellationHtml(data),
  })
}

export async function sendReminderEmail(data: AppointmentEmailData, type: '24h' | '2h') {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping reminder email')
    return { skipped: true }
  }
  const hoursText = type === '24h' ? 'mañana' : 'en 2 horas'
  return getResend().emails.send({
    from:    getFrom(),
    to:      data.to,
    subject: `Recordatorio: tienes cita ${hoursText} en ${data.business}`,
    html:    buildReminderHtml(data, hoursText),
  })
}

export async function sendRescheduleNotificationEmail(data: AppointmentEmailData) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping reschedule email')
    return { skipped: true }
  }
  return getResend().emails.send({
    from:    getFrom(),
    to:      data.to,
    subject: `Tu cita ha sido reprogramada — ${data.business}`,
    html:    buildRescheduleHtml(data),
  })
}

// ─── HTML templates (dark, gold, premium) ──────────────────────
function baseHtml(title: string, body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{background:#0E0B08;font-family:sans-serif;color:#F2EDE7;margin:0;padding:0}
    .container{max-width:480px;margin:40px auto;padding:32px;background:#161310;border-radius:16px;border:1px solid rgba(201,169,110,0.15)}
    h1{color:#C9A96E;font-size:20px;margin:0 0 24px}
    .row{margin:8px 0;font-size:15px;color:#7A7268}
    .row span{color:#F2EDE7;font-weight:600}
    .footer{margin-top:32px;font-size:12px;color:#3A3530;text-align:center}
  </style></head><body><div class="container">
    <h1>${title}</h1>${body}
    <div class="footer">BG Barber — Sistema de reservas</div>
  </div></body></html>`
}

function buildConfirmationHtml(d: AppointmentEmailData): string {
  return baseHtml('✓ Cita confirmada', `
    <p>Hola ${d.name}, tu cita está confirmada.</p>
    <div class="row">Fecha: <span>${d.date}</span></div>
    <div class="row">Hora: <span>${d.time}</span></div>
    ${d.service ? `<div class="row">Servicio: <span>${d.service}</span></div>` : ''}
    <div class="row">Barbería: <span>${d.business}</span></div>
  `)
}

function buildCancellationHtml(d: AppointmentEmailData): string {
  return baseHtml('Cita cancelada', `
    <p>Hola ${d.name}, tu cita ha sido cancelada.</p>
    <div class="row">Fecha: <span>${d.date}</span></div>
    <div class="row">Hora: <span>${d.time}</span></div>
    <p style="color:#7A7268;font-size:14px">Si quieres reservar otra cita, visita la web.</p>
  `)
}

function buildReminderHtml(d: AppointmentEmailData, hoursText: string): string {
  return baseHtml(`Recordatorio — cita ${hoursText}`, `
    <p>Hola ${d.name}, te recordamos tu cita ${hoursText}.</p>
    <div class="row">Fecha: <span>${d.date}</span></div>
    <div class="row">Hora: <span>${d.time}</span></div>
    ${d.service ? `<div class="row">Servicio: <span>${d.service}</span></div>` : ''}
    <div class="row">Barbería: <span>${d.business}</span></div>
  `)
}

function buildRescheduleHtml(d: AppointmentEmailData): string {
  return baseHtml('Tu cita ha sido reprogramada', `
    <p>Hola ${d.name}, el barbero ha reprogramado tu cita.</p>
    ${d.newDate ? `<div class="row">Nueva fecha: <span>${d.newDate}</span></div>` : ''}
    ${d.newTime ? `<div class="row">Nueva hora: <span>${d.newTime}</span></div>` : ''}
    ${d.service ? `<div class="row">Servicio: <span>${d.service}</span></div>` : ''}
    <div class="row">Barbería: <span>${d.business}</span></div>
    <p style="color:#7A7268;font-size:14px">Si tienes preguntas, contacta directamente con la barbería.</p>
  `)
}
