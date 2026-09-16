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

export function IconAfraid(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="9" cy="10.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10.5" r="1.1" fill="currentColor" stroke="none" />
      <path d="M8.5 16c1.2-1.3 5.8-1.3 7 0" />
    </svg>
  )
}

export function IconAgree(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7 21V10M2 10h4v11H2zM7 10l3-7c1.5 0 2.5 1.2 2 2.5L11 10h7a2 2 0 0 1 1.9 2.6l-2 6A2 2 0 0 1 16 20H7" />
    </svg>
  )
}

export function IconBad(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17 3v11M22 14h-4V3h4zM17 14l-3 7c-1.5 0-2.5-1.2-2-2.5L13 14H6a2 2 0 0 1-1.9-2.6l2-6A2 2 0 0 1 8 4h9" />
    </svg>
  )
}

export function IconDoctor(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" {...props}>
      <path d="M8 3v4a4 4 0 0 0 8 0V3" />
      <path d="M8 5H6a2 2 0 0 0-2 2v3a8 8 0 0 0 16 0V7a2 2 0 0 0-2-2h-2" />
      <circle cx="19" cy="16" r="2.5" />
      <path d="M19 15v2M18 16h2" />
    </svg>
  )
}

export function IconHome(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9h12v-9" />
    </svg>
  )
}

export function IconHowAreYou(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.6-2.5 2-2.5 4" />
      <circle cx="12" cy="17" r="0.3" fill="currentColor" />
    </svg>
  )
}

export function IconProblem(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" {...props}>
      <path d="M12 3 2 20h20L12 3Z" />
      <path d="M12 10v4" />
      <circle cx="12" cy="17" r="0.3" fill="currentColor" />
    </svg>
  )
}

export function IconSick(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" {...props}>
      <path d="M10 13a4 4 0 1 0 4-4V4" />
      <circle cx="10" cy="17" r="3" />
    </svg>
  )
}

export function IconStand(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" {...props}>
      <circle cx="12" cy="4.5" r="1.8" fill="currentColor" stroke="none" />
      <path d="M12 8v8M9 11h6M9 21l3-5 3 5" />
    </svg>
  )
}

export function IconStop(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" {...props}>
      <path d="M7.5 3h9L21 7.5v9L16.5 21h-9L3 16.5v-9Z" />
      <path d="M8 8l8 8M16 8l-8 8" />
    </svg>
  )
}

export function IconUnderstand(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 12.5 9 17l11-11" />
    </svg>
  )
}

export function IconWarn(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3 2 20h20L12 3Z" />
      <path d="M12 9.5v4" />
      <circle cx="12" cy="16.5" r="0.3" fill="currentColor" />
    </svg>
  )
}

export function IconYou(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" {...props}>
      <circle cx="12" cy="7" r="3.2" />
      <path d="M5.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6" />
    </svg>
  )
}
