# Kine-Sense

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

### Training (offline, one-time, in `ml/` — never runs on a user's device)

1. **Dataset**: a Mendeley dataset of static photos, one or a few per word,
   for the 19-word vocabulary below. (The original plan was ISL video clips
   + a sequence model; this pivoted to photos when video data wasn't
   available — see `CLAUDE.md`'s "Dataset & model type change" note.)
2. **Landmark extraction** (`ml/src/extract_landmarks.py`): every photo runs
   once through MediaPipe's **HandLandmarker** (Tasks Vision API — not
   Holistic, whose hand detection is gated on finding a body pose first,
   which silently failed on close-up hand photos). Pure data prep — MediaPipe
   itself is pretrained and never fine-tuned. Output: 21 (x,y,z) landmarks
   per hand.
3. **Normalization** (`ml/src/normalize.py`): each hand's 21 points are
   re-centered on the wrist and scaled by wrist→middle-knuckle distance, so
   the model is invariant to signer distance from the camera. Left (63
   numbers) + right (63 numbers) = a fixed 126-length vector per photo.
4. **Training** (`ml/src/train_classifier.py`): `StandardScaler` →
   `MLPClassifier` (scikit-learn) with two hidden layers (64, 32 neurons),
   ReLU activations, softmax output — a small feed-forward net, not a
   CNN/LSTM, since the input is already a compact landmark vector rather
   than raw pixels. Reported accuracy: 97.2% cross-validated (skewed by
   class imbalance — see limitations).
5. **Export** (`ml/src/export_model.py`): the scaler's mean/scale and every
   layer's weights/biases are dumped to plain JSON —
   `mirror/src/ml/sign_classifier.json` (~230KB). No ONNX/TF.js.

### Live inference (`mirror/`, entirely client-side)

1. `getUserMedia` → MediaPipe **Holistic** (loaded via CDN `<script>` tags in
   `mirror/index.html`/`dashboard/index.html` — its npm packages break under
   Vite's ESM/CJS interop) extracts hand landmarks every frame. No video is
   ever stored or sent anywhere; only landmark coordinates leave the capture
   step, and even those stay local to the mirror device.
2. `normalize.js` (a JS port of the Python step) builds the same 126-number
   vector.
3. `signClassifier.js` runs a hand-rolled JS forward pass — dense → ReLU →
   dense → ReLU → dense → softmax — against the exported JSON weights.
   Nothing trains here; it's pure inference against baked-in numbers.
4. **Hold-to-confirm**: the last 15 frames' predictions (~1s) are kept in a
   ring buffer; if one label holds ≥60% of that window, it's confirmed —
   smoothing per-frame noise since the model has no memory between frames.
5. **Sign chaining** (`signChain.js`): confirmed words accumulate into a
   sentence (with a backspace button for a misread word) and send either on
   "Done" or automatically after 7s of no new sign.

### Vocabulary (frozen, 19 signs)

`AFRAID, AGREE, ASSISTANCE, BAD, DOCTOR, GOOD MORNING, HOME, HOW ARE YOU,
HUNGRY, I NEED HELP, PAIN, PROBLEM, SICK, STAND, STOP, THIRSTY, UNDERSTAND,
WARN, YOU`.

### Alerts & check-ins

`server/` relays `{ sign, timestamp, confidence }` (mirror → dashboard) and
`{ text, timestamp }` (dashboard → mirror) over socket.io, validating both —
no other payload shapes, no persistence. The dashboard's landing page also
runs a lightweight version of the same MediaPipe setup to detect a hand held
up for ~1.2s ("wave to enter"), jumping straight into the mirror.

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
