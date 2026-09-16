// Minimal line-icon set for the need cards. Keep every icon on a 24x24
// viewBox with stroke="currentColor" so they inherit the card's text color
// automatically (see NeedCard.jsx).

export function IconWater(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2C8 8.5 5.5 12.7 5.5 16a6.5 6.5 0 0 0 13 0C18.5 12.7 16 8.5 12 2Z" />
    </svg>
  )
}

export function IconFood(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...props}>
      <path d="M4 11h16a8 4 0 0 1-16 0Z" />
      <path d="M9 6c-1 1-1 2 0 3M13 6c-1 1-1 2 0 3" strokeLinecap="round" />
    </svg>
  )
}

export function IconMedicine(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...props}>
      <rect x="4" y="9" width="16" height="6" rx="3" transform="rotate(-28 12 12)" />
      <line x1="10.5" y1="8" x2="13.5" y2="16" transform="rotate(-28 12 12)" />
    </svg>
  )
}

export function IconPain(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  )
}

export function IconHelp(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" {...props}>
      <path d="M6 13V6a1.5 1.5 0 0 1 3 0v5M9 11V4.5a1.5 1.5 0 0 1 3 0V11M12 11V5.5a1.5 1.5 0 0 1 3 0V12M15 12.5V8a1.5 1.5 0 0 1 3 0v6c0 4-2.5 7-6.5 7-3 0-4.3-1.2-6-3.3L4 15c-.6-.8-.2-2 .9-2.1.6 0 1.2.3 1.6.8L8 15.5" />
    </svg>
  )
}

export function IconCall(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1L6.6 10.8Z" />
    </svg>
  )
}

export function IconToilet(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...props}>
      <rect x="7" y="3" width="9" height="6" rx="1.5" />
      <path d="M6 16a6 3 0 0 0 12 0v-3H6Z" />
    </svg>
  )
}

export function IconCold(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" {...props}>
      <line x1="12" y1="4" x2="12" y2="20" />
      <line x1="5" y1="7.5" x2="19" y2="16.5" />
      <line x1="19" y1="7.5" x2="5" y2="16.5" />
    </svg>
  )
}

export function IconHot(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" {...props}>
      <circle cx="12" cy="12" r="4.2" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
      <line x1="4.9" y1="4.9" x2="7" y2="7" />
      <line x1="17" y1="17" x2="19.1" y2="19.1" />
      <line x1="4.9" y1="19.1" x2="7" y2="17" />
      <line x1="17" y1="7" x2="19.1" y2="4.9" />
    </svg>
  )
}

export function IconTired(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" {...props}>
      <path d="M4 12q4 3 7 0" />
      <path d="M13 12q4 3 7 0" />
      <text x="16.5" y="7" fontSize="6" stroke="none" fill="currentColor">z</text>
    </svg>
  )
}
