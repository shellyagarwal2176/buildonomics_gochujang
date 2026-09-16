# Ghar-Sanket (घर-संकेत)

Ambient ISL sign-communication system for elderly individuals living alone.
See `CLAUDE.md` for full build context and `Ghar-Sanket-PRD.md` for the product spec.

Phase 1 is fully wired end to end: a real webcam feeds MediaPipe Holistic →
a trained classifier → sign chaining into a sentence → an alert relayed to
the family dashboard, plus check-ins flowing back the other way.

## Structure

- `mirror/` — elder-facing camera UI (React + Vite + Tailwind)
- `dashboard/` — family-facing alerts UI (React + Vite + Tailwind)
- `server/` — WebSocket relay, no persistence (Node + socket.io)
- `ml/` — landmark extraction + ISL sign classifier training (Python, offline)

## Dev

```
cd server && npm run dev      # :4000 — start this first
cd mirror && npm run dev      # :5173 — elder-facing mirror
cd dashboard && npm run dev   # :5174 — family dashboard, open this first
```

Open `http://localhost:5174` — it's the front door for both roles. "I look
after them" goes straight into the dashboard; "I live here" (or holding a
hand up to the camera for ~1.2s) opens the mirror at `:5173`.

## How it works

- **Vision**: MediaPipe Holistic runs client-side (loaded via CDN `<script>`
  tags in `mirror/index.html` and `dashboard/index.html` — its npm packages
  break under Vite's ESM/CJS interop, see the comments there). No video is
  ever stored or sent anywhere; only extracted hand-landmark coordinates
  leave the capture step.
- **Classifier**: trained offline in `ml/` on a static-photo dataset (not
  video — see `ml/README.md` for why that changed the model type), exported
  as plain JSON weights to `mirror/src/ml/sign_classifier.json`, and run
  client-side with a small hand-rolled JS forward pass. Nothing trains on
  the elder's device — it's pure inference against those baked-in weights.
- **Vocabulary** (frozen, 19 signs): `AFRAID, AGREE, ASSISTANCE, BAD, DOCTOR,
  GOOD MORNING, HOME, HOW ARE YOU, HUNGRY, I NEED HELP, PAIN, PROBLEM, SICK,
  STAND, STOP, THIRSTY, UNDERSTAND, WARN, YOU`.
- **Sentences**: confirmed signs accumulate into a sentence on the mirror
  screen (with a backspace button for a misread word) and send either on
  "Done" or automatically after 7s of no new sign.
- **Alerts & check-ins**: `server/` relays `{ sign, timestamp, confidence }`
  (mirror → dashboard) and `{ text, timestamp }` (dashboard → mirror) over
  socket.io, validating both — no other payload shapes, no persistence.

## Known limitations

- `HUNGRY` had only 2 training photos and `HOME`/`STOP`/`I NEED HELP` are
  thin too — expect misclassification between under-sampled words until
  `ml/data/` gets more source photos and the model is retrained.
- `GOOD MORNING` and `I NEED HELP` involve motion in real ISL; the classifier
  only sees static handshapes, so these two may be inconsistent.
- The classifier has no "no sign" class — it always outputs a confident
  label for whatever the camera sees, so a mirror with nobody signing in
  front of it can still produce false-positive alerts. Not yet mitigated.

## Branches

Everyone works on their own feature branch off `main`:
- `feature/neerav-chaining-server`
- `feature/shelly-ml`
- `feature/kaavya-frontend`
- `feature/pulkit-frontend`
- `feature/mirror-phase1-ui`
