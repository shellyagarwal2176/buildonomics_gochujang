// Fallback composer for signChain.js when a chain has no exact INTENT_MAP
// entry. Each sign gets its own literal first-person phrase; a multi-sign
// chain joins those phrases as independent clauses rather than inventing a
// relationship between them (e.g. PAIN + DOCTOR reads as "I am in pain" +
// "I need a doctor", never a guessed diagnosis) — the same "don't put words
// in the person's mouth" caution intentMap.js's own comment already calls out.
const PHRASES = {
  AFRAID: "I am afraid",
  AGREE: "Yes, I agree",
  ASSISTANCE: "I need assistance",
  BAD: "I am not feeling well",
  DOCTOR: "I need a doctor",
  "GOOD MORNING": "Good morning",
  HOME: "I want to go home",
  "HOW ARE YOU": "How are you",
  HUNGRY: "I am hungry",
  "I NEED HELP": "I need help",
  PAIN: "I am in pain",
  PROBLEM: "There is a problem",
  SICK: "I feel sick",
  STAND: "I am standing up",
  STOP: "Please stop",
  THIRSTY: "I am thirsty",
  UNDERSTAND: "I understand",
  WARN: "Be careful",
  YOU: "You",
};

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function phraseFor(sign) {
  return PHRASES[sign] ?? sign.toLowerCase();
}

export function composeSentence(signs) {
  const phrases = signs.map(phraseFor);
  if (phrases.length === 1) return `${capitalize(phrases[0])}.`;

  const last = phrases[phrases.length - 1];
  const rest = phrases.slice(0, -1);
  return `${capitalize(rest.join(", "))}, and ${last}.`;
}
