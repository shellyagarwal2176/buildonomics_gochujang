# CLAUDE.md — Ghar-Sanket (घर-संकेत)

This file gives Claude Code full context for this project. Read this before making architectural decisions or generating code.

---

## What this project is

An ambient, camera-based sign-language communication system for elderly deaf individuals living alone. A grandparent signs Indian Sign Language (ISL) at a laptop/mirror interface; the system recognizes the sign(s), and an alert appears on a family member's dashboard.

**We are building Phase 1 right now.** Phase 2 (passive wellness/gait monitoring) is documented below for architectural awareness only — do not build it yet. Do not add scope from Phase 2 unless explicitly asked.

**Hackathon tracks:** Track 02 (AI for Accessibility) primary, Track 03 (Telehealth & Remote Care) secondary via Phase 2.

---

## Phase 1 scope — build this

### User flow

1. Grandparent sits in front of a webcam-equipped screen (the "mirror").
2. She signs a word or short sign chain (e.g. `HEAD` then `PAIN`).
3. System recognizes the sign(s) in real time, shows live feedback (confidence ring filling).
4. On a confirmed sign/chain, an alert fires **internally within the app** — not via SMS/WhatsApp/Twilio/any external messaging API.
5. Alert appears as a real-time pop-up notification on a separate "family dashboard" view.
6. Dashboard also shows a Reassurance Drawer — read receipts / family check-ins reflecting back to the grandparent's mirror.

### Hard requirements

- **No external SMS/WhatsApp/Twilio.** Alerts are internal application events only, relayed over WebSockets through a minimal Node backend (mirror and dashboard are separate screens/devices — decided architecture, not a single-page app).
- **No video is ever stored or transmitted.** Only extracted landmark coordinates exist past the capture step. This is a stated privacy/architecture requirement, not just a nice-to-have.
- **Vocabulary is frozen at ~15 signs.** Do not suggest expanding it. Confirm the list before writing training code.
- Grandparent-facing UI shows **only**: need-based visual cards (`MEDICINE`, `WATER`, `PAIN`, `HELP`, etc.), live mirror feed with confidence ring, and the Reassurance Drawer. Never any health/diagnostic data (that's Phase 2's rule, but keep the UI clean of it regardless).
- Sign-to-alert latency target: under 3 seconds.
- System must tolerate brief tracking loss / partial hand occlusion without crashing or misfiring.

---

## Camera pipeline — exact flow to implement

```
Webcam (getUserMedia)
   │
MediaPipe Holistic (WASM, runs client-side in browser)
   │  → outputs per frame: 21 hand landmarks per hand, 33 pose landmarks (pose unused in Phase 1)
   │
Normalize hand landmarks
   │  → re-center on a stable reference point (e.g. wrist/palm center)
   │  → scale by a consistent measurement (e.g. hand span)
   │  → makes recognition invariant to distance/position from camera
   │
Sliding window buffer
   │  → last ~30–40 frames (~1–1.5 sec of motion)
   │  → slides forward one frame at a time
   │
Sign classification model (trained separately, see below)
   │  → input: windowed landmark sequence
   │  → output: predicted sign label + confidence score
   │
Confidence ring UI feedback (continuous, live)
   │
Hold-to-confirm
   │  → confidence must stay above threshold for a short sustained duration
   │  → prevents false triggers from transitional hand movement
   │
Sign chaining
   │  → 2–3 confirmed signs within a short time window → one intent
   │  → e.g. HEAD + PAIN → "headache"
   │  → no match within window → buffer clears, wait for next sign
   │
Fire internal alert event
   │  → emit { sign/intent, timestamp, confidence } over WebSocket, NOT external API call
   │
Node server (socket.io/ws) relays event
   │  → no video, no persistence, no DB — pure pass-through
   │
Dashboard app subscribes to alert channel → renders pop-up notification
```

### Critical implementation notes

- **Keep the MediaPipe/landmark loop OUTSIDE React (or equivalent) state.** Use refs + a ring buffer for the per-frame loop; only push to actual UI state at ~5Hz. Wiring every frame directly into component state will tank frame rate.
- Normalization is not optional polish — skip it and the model will misfire the moment a real person sits at a slightly different distance than the training/test setup.
- MediaPipe Holistic returns pose landmarks too, even though Phase 1 doesn't use them — don't discard the capability, just don't build on it yet (Phase 2 will).

---

## MediaPipe Holistic — how it's actually used (avoid a common misconception)

**MediaPipe Holistic is pretrained. It is never trained or fine-tuned by us.** Its only job: image/frame in → landmark coordinates out. Treat it as a fixed library call, not a model we own.

**The model we DO train is a separate, second, much smaller model** — a sign classifier. Sequence:

1. Take ISL dataset videos (AI4Bharat INCLUDE + CISLR, scoped to our 15 signs).
2. Run each video through MediaPipe Holistic **once, offline, before/during the hackathon** — this converts videos into labeled landmark coordinate sequences. This step is a data-prep/conversion step, not model training.
3. Train a small sequence classifier (LSTM or 1D-CNN) on those labeled coordinate sequences. Input: coordinate sequences. Output: sign label. This is the actual ML training, and it's cheap — numeric arrays, not images, trains in minutes on CPU.
4. At runtime, live camera frames go through the same MediaPipe conversion (step 2's process, live) and feed into this trained classifier.

**Do not attempt to train or fine-tune MediaPipe itself.** Do not attempt sign recognition from static single-frame photos — most ISL signs are defined by trajectory over time, not a static handshape, and a single frame cannot distinguish them. The interaction must be continuous video → sliding window → sequence classification.

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite + Tailwind |
| Vision/tracking | MediaPipe Holistic (WASM), client-side, pretrained |
| Sign recognition model | Small LSTM / 1D-CNN, trained offline on landmark sequences |
| ISL datasets | AI4Bharat INCLUDE, CISLR (scoped to ~15 home/health signs) |
| Backend | Minimal Node.js server (Express or bare `http`), `socket.io` or `ws` — relays alert events only, no DB, no persistence, no video |
| Alert transport | WebSockets, mirror app and dashboard app are separate screens/devices |
| Notification UI | Custom or lightweight toast/pop-up component |

### Project layout (decided)

Three deployable pieces, not one app:
- `mirror/` — React app, grandparent-facing camera UI (confidence ring, need cards, Reassurance Drawer)
- `dashboard/` — React app, family-facing alert pop-ups
- `server/` — minimal Node + socket.io/ws relay, no DB

Alert contract between frontend and backend: `{ sign: string, timestamp: number, confidence: number }`. Don't add fields without updating both mirror emit code and dashboard render code.

**Explicitly not used:** Twilio, WhatsApp Business API, any external SMS gateway. These were part of an earlier iteration of the plan and are no longer in scope — alerts are internal only.

---

## Team / component ownership (for context, not for Claude Code to manage)

Phase 1 active builders: **Neerav** and **Shelly**. Kaavya and Pulkit are on frontend for now.

| Owner | Component | Folder |
|---|---|---|
| Shelly | MediaPipe integration, landmark extraction, normalization, ISL dataset prep, sign classifier training, live inference | `ml/` |
| Neerav | Sign chaining logic, internal alert dispatch, WebSocket relay server, integration, demo | `server/` |
| Kaavya + Pulkit | Frontend — mirror UI, confidence ring, needs cards, Reassurance Drawer, dashboard alerts UI | `mirror/`, `dashboard/` |

Contract between `ml/` and the rest: a fixed-shape landmark array in, a sign label + confidence out. Don't change this shape without updating both sides.

Contract between `server/` and the frontends: `{ sign, timestamp, confidence }` over the `alert` socket event. Don't change this shape without updating both sides.

---

## Phase 2 — documented for context only, NOT in current build scope

Runs on the same pose landmarks MediaPipe already produces (33 points), which Phase 1 computes but doesn't use. No new sensor or camera pass required when this phase starts.

**Free/no-added-cost features (pure geometry, no model):**
- Gait speed (hip-centroid displacement over time)
- Sit-to-stand duration (hip-height transition)
- Postural sway (torso oscillation)
- Gait symmetry (left vs right stride comparison)
- Freezing-of-gait detection (sudden mid-stride stop)
- Fall detection (sudden vertical drop + no recovery) — fires immediate alert, same channel as Phase 1
- Activity-pattern tracking (sitting/standing/lying time across the day)

**Trend engine:** rolling 60-day metric buffer per resident, changepoint detection (`ruptures`), surfaced to family as plain-language "Drift Cards" — never raw charts, and never shown to the grandparent under any setting.

**Consent:** ISL-signed onboarding for the wellness layer; toggleable off anytime by her; Phase 1 continues fully if declined.

**Optional, time-permitting only, build last:**
- Voice agent (daily check-in interaction)
- Voice/speech biomarker signal (response latency, pause length, vocal energy) — depends on the voice agent existing first

**Synthetic data note (Phase 2 only):** no public dataset contains a single person's gait decline over months, so a parametric generator will produce synthetic longitudinal pose sequences to validate detection latency. This is separate from and does not affect Phase 1's real-data-trained sign recognition.

---

## Things to actively avoid

- Don't wire any external messaging API (Twilio/WhatsApp) — this was explicitly removed from scope.
- Don't attempt static-photo-based sign recognition — architecturally insufficient for a trajectory-based sign set.
- Don't expand the sign vocabulary beyond the frozen list without being told to.
- Don't build Phase 2 features unless explicitly asked — flag if a request seems to require them.
- Don't put the MediaPipe per-frame loop into reactive UI state directly.
- Don't skip landmark normalization.
