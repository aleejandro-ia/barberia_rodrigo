/* Service icon registry — keyed by icon_key in DB (services.icon_key).
   Keeps the original hand-drawn landing illustrations. */

function CombIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect x="4" y="13" width="32" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" />
      {[7, 11, 15, 19, 23, 27, 31].map((x) => (
        <line key={x} x1={x} y1="20" x2={x} y2="31" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      ))}
      <line x1="5" y1="13" x2="35" y2="13" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
      <circle cx="34" cy="7" r="1.5" fill="currentColor" fillOpacity="0.6" />
      <line x1="34" y1="3.5" x2="34" y2="5" stroke="currentColor" strokeWidth="1" strokeOpacity="0.6" />
      <line x1="30.5" y1="7" x2="32" y2="7" stroke="currentColor" strokeWidth="1" strokeOpacity="0.6" />
    </svg>
  )
}

function ScissorsIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="10" cy="11" r="5.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="30" cy="11" r="5.5" stroke="currentColor" strokeWidth="1.4" />
      <line x1="14.5" y1="15.5" x2="35" y2="33" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="25.5" y1="15.5" x2="5" y2="33" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="10" cy="33.5" r="3.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="30" cy="33.5" r="3.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="20" cy="24.5" r="2" fill="currentColor" fillOpacity="0.7" />
    </svg>
  )
}

function RazorIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect x="16" y="4" width="8" height="13" rx="4" stroke="currentColor" strokeWidth="1.4" />
      <line x1="17.5" y1="9" x2="22.5" y2="9" stroke="currentColor" strokeWidth="0.75" strokeOpacity="0.5" />
      <line x1="17.5" y1="12" x2="22.5" y2="12" stroke="currentColor" strokeWidth="0.75" strokeOpacity="0.5" />
      <rect x="5" y="18" width="30" height="8" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <line x1="5" y1="24.5" x2="35" y2="24.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="5" y1="26.5" x2="35" y2="26.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="13" y1="21" x2="27" y2="21" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
      <rect x="9" y="29" width="22" height="4" rx="1" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.6" />
      {[12, 16, 20, 24, 28].map((x) => (
        <line key={x} x1={x} y1="33" x2={x} y2="36" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.6" />
      ))}
    </svg>
  )
}

export const SERVICE_ICONS: Record<string, () => React.ReactElement> = {
  comb: CombIcon,
  scissors: ScissorsIcon,
  razor: RazorIcon,
}

export const SERVICE_ICON_OPTIONS: { key: string; label: string }[] = [
  { key: 'scissors', label: 'Tijeras' },
  { key: 'comb', label: 'Peine' },
  { key: 'razor', label: 'Navaja' },
]

export function getServiceIcon(key?: string): () => React.ReactElement {
  return SERVICE_ICONS[key ?? 'scissors'] ?? ScissorsIcon
}
