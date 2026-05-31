export function cleanPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (/^[6789]\d{8}$/.test(digits)) return `34${digits}`
  if (/^34[6789]\d{8}$/.test(digits)) return digits
  return digits
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  return `https://wa.me/${cleanPhone(phone)}?text=${encodeURIComponent(message)}`
}

export function whatsAppReminder(phone: string, name: string, date: string, time: string): string {
  return buildWhatsAppUrl(phone, `Hola ${name}, te recuerdo tu cita en BG Barber el ${date} a las ${time}. ¡Te esperamos!`)
}

export function whatsAppCancelOutOfTime(phone: string, msg: string): string {
  return buildWhatsAppUrl(phone, msg)
}

export function whatsAppRescheduleOutOfTime(phone: string, msg: string): string {
  return buildWhatsAppUrl(phone, msg)
}
