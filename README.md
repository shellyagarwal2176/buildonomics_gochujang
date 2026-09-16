# Ghar-Sanket (घर-संकेत)

Ghar-Sanket is an ambient, camera-based Indian Sign Language (ISL) communication system for elderly deaf individuals living alone.

Phase 1 (current build) recognizes a fixed set of ISL signs in real time and sends **internal in-app alerts** to a family dashboard.

## Current Scope (Phase 1)

- Grandparent signs in front of a webcam-enabled mirror screen.
- MediaPipe extracts hand landmarks client-side.
- A per-frame classifier predicts sign + confidence.
- Hold-to-confirm + short sign chaining turns stable signs into one intent.
- Server relays alert events over WebSockets to the family dashboard.
- Dashboard shows real-time alert pop-ups and reassurance/read-receipt updates.

## Hard Requirements

- No external SMS/WhatsApp/Twilio; alerts are internal app events only.
- No video is stored or transmitted; only landmark coordinates are used.
- Sign-to-alert latency target: under 3 seconds.
- Must tolerate brief tracking loss/occlusion without crashing or misfiring.
- Vocabulary is frozen to 19 signs:
  `AFRAID, AGREE, ASSISTANCE, BAD, DOCTOR, GOOD MORNING, HOME, HOW ARE YOU, HUNGRY, I NEED HELP, PAIN, PROBLEM, SICK, STAND, STOP, THIRSTY, UNDERSTAND, WARN, YOU`.

## Architecture

Three deployable pieces:

- `mirror/` — grandparent-facing React app (camera, confidence ring, needs cards, reassurance drawer)
- `dashboard/` — family-facing React app (real-time alert pop-ups)
- `server/` — minimal Node.js WebSocket relay (no DB, no persistence)
- `ml/` — offline landmark extraction + model training/export pipeline

Alert contract across mirror/server/dashboard:

```json
{ "sign": "string", "timestamp": 0, "confidence": 0 }
```

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend apps | React 19 + Vite 8 + Tailwind CSS 4 |
| Vision | MediaPipe Holistic (WASM, browser-side) |
| Sign model | Per-frame classifier on normalized hand landmarks (scikit-learn MLP/classical ML) |
| ML pipeline | Python + MediaPipe + OpenCV + NumPy + scikit-learn + joblib |
| Backend relay | Node.js + Socket.IO |
| Transport | WebSockets (`socket.io`) |

## Repository Structure

- `/mirror` — mirror app
- `/dashboard` — dashboard app
- `/server` — socket relay server
- `/ml` — ML data prep/training/export scripts
- `/Ghar-Sanket-PRD.md` — detailed product requirements
- `/CLAUDE.md` — implementation constraints and architecture notes

## Local Development

Run each component in its own terminal:

```bash
cd /home/runner/work/buildonomics_gochujang/buildonomics_gochujang/mirror
npm install
npm run dev
```

```bash
cd /home/runner/work/buildonomics_gochujang/buildonomics_gochujang/dashboard
npm install
npm run dev
```

```bash
cd /home/runner/work/buildonomics_gochujang/buildonomics_gochujang/server
npm install
npm run dev
```

Default ports:
- mirror: `5173`
- dashboard: `5174`
- server: `4000`

## ML Pipeline (Offline)

```bash
cd /home/runner/work/buildonomics_gochujang/buildonomics_gochujang/ml
pip install -r requirements.txt
python src/extract_landmarks.py
python src/train_classifier.py
python src/export_model.py
```

## Notes

- MediaPipe is used as a fixed landmark extractor; it is not trained/fine-tuned.
- Current dataset is static photos (Mendeley), so temporal stability is handled via hold-to-confirm rather than a sequence model.
- Phase 2 wellness monitoring is documented but not in current implementation scope.
