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
- **Vocabulary is frozen at 19 signs** (corrected 2026-09-16, matches actual downloaded data): `AFRAID, AGREE, ASSISTANCE, BAD, DOCTOR, GOOD MORNING, HOME, HOW ARE YOU, HUNGRY, I NEED HELP, PAIN, PROBLEM, SICK, STAND, STOP, THIRSTY, UNDERSTAND, WARN, YOU`. Do not suggest expanding it further.
- Grandparent-facing UI shows **only**: need-based visual cards (`MEDICINE`, `WATER`, `PAIN`, `HELP`, etc.), live mirror feed with confidence ring, and the Reassurance Drawer. Never any health/diagnostic data (that's Phase 2's rule, but keep the UI clean of it regardless).
- Sign-to-alert latency target: under 3 seconds.
- System must tolerate brief tracking loss / partial hand occlusion without crashing or misfiring.

---

## Camera pipeline — exact flow to implement

**Updated 2026-09-16: training data is static photos (Mendeley dataset), not video clips — see "Dataset & model type change" below. The pipeline below reflects the resulting per-frame classification approach, not the original sequence-model plan.**

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
Per-frame classification (trained separately, see below)
   │  → input: single frame's normalized landmark vector (no temporal window)
   │  → output: predicted sign label + confidence score, re-run every frame
   │
Confidence ring UI feedback (continuous, live)
   │
Hold-to-confirm
   │  → the SAME predicted label must stay above threshold for a short sustained
   │    run of consecutive frames (majority vote over e.g. last ~15 frames)
   │  → this is now doing the job the sliding window used to do: smoothing
   │    per-frame noise into a stable confirmation, since the model itself has
   │    no memory of prior frames
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

### Dataset & model type change (2026-09-16)

The original plan (video clips from AI4Bharat INCLUDE/CISLR → LSTM/1D-CNN sequence
classifier) has been replaced. Actual data on hand: a **Mendeley dataset of static
photos**, one or a few still images per word, for the 19-word vocabulary above.

Consequences:
- **No trajectory data exists.** The classifier trains on a single frame's normalized
  landmark vector (e.g. a small MLP / dense NN, or a classical model like SVM /
  random forest on the landmark features) — not a sequence model.
- **Known accuracy risk:** several words in the vocabulary (`GOOD MORNING`,
  `I NEED HELP`) plausibly involve motion in real ISL, not just a static handshape.
  A static-photo-trained classifier can only key off handshape, so these signs may
  be harder to distinguish reliably. This is an accepted tradeoff given the
  available data — flag it if accuracy on motion-dependent signs is poor, don't
  silently work around it by inventing synthetic motion data.
- Live inference is still continuous video (webcam is not static) — the model just
  gets called fresh every frame instead of on a sliding window, and hold-to-confirm
  (majority vote across recent frames) does the temporal stabilization instead.

### Critical implementation notes

- **Keep the MediaPipe/landmark loop OUTSIDE React (or equivalent) state.** Use refs + a ring buffer for the per-frame loop; only push to actual UI state at ~5Hz. Wiring every frame directly into component state will tank frame rate.
- Normalization is not optional polish — skip it and the model will misfire the moment a real person sits at a slightly different distance than the training/test setup.
- MediaPipe Holistic returns pose landmarks too, even though Phase 1 doesn't use them — don't discard the capability, just don't build on it yet (Phase 2 will).

---

## MediaPipe Holistic — how it's actually used (avoid a common misconception)

**MediaPipe Holistic is pretrained. It is never trained or fine-tuned by us.** Its only job: image/frame in → landmark coordinates out. Treat it as a fixed library call, not a model we own.

**The model we DO train is a separate, second, much smaller model** — a sign classifier. Sequence:

1. Take ISL dataset photos (Mendeley dataset, static images, scoped to our 19 signs — see "Dataset & model type change" above).
2. Run each photo through MediaPipe's hand landmarker **once, offline, before/during the hackathon** — this converts photos into labeled landmark coordinate vectors (one vector per image, no temporal sequence). This step is a data-prep/conversion step, not model training. (Offline extraction uses the standalone `HandLandmarker`, not `HolisticLandmarker` — Holistic gates hand detection on finding a full body pose first, which silently failed on this dataset's close-up hand photos. The live mirror app below still uses Holistic since it also wants pose data for Phase 2; that's an independent choice from the offline extraction step.)
3. Train a small per-frame classifier (MLP/dense NN, or a classical model like SVM/random forest) on those labeled landmark vectors. Input: a single frame's landmark coordinates. Output: sign label. This is the actual ML training, and it's cheap — numeric arrays, not images, trains in minutes on CPU.
4. At runtime, live camera frames go through the same MediaPipe conversion (step 2's process, live, one frame at a time) and feed into this trained classifier every frame; hold-to-confirm (majority vote over recent frames) provides temporal stability since the model itself has no memory.

**Do not attempt to train or fine-tune MediaPipe itself.**

Note the original plan called for video-based sequence training and explicitly ruled out static-photo recognition, since most ISL signs are defined by trajectory over time and a single frame normally can't distinguish them. That guidance still holds as the *ideal* — but the team is working from a static-photo dataset (Mendeley) as of 2026-09-16, so this project deliberately accepts the static-handshape approach and its accuracy tradeoff on motion-dependent signs (see above) rather than blocking on video data that isn't available. If video data becomes available later, prefer switching back to the sequence-model approach.

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite + Tailwind |
| Vision/tracking | MediaPipe Holistic (WASM), client-side, pretrained |
| Sign recognition model | Small per-frame classifier (MLP/dense NN or classical ML), trained offline on static-photo landmark vectors |
| ISL datasets | Mendeley dataset, static photos (scoped to 19 home/health/emergency signs) |
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
- Static-photo-based recognition is now the accepted approach for this project (data constraint, see "Dataset & model type change") — but don't silently paper over its accuracy limits on motion-dependent signs; flag them instead of inventing synthetic trajectory data.
- Don't expand the sign vocabulary beyond the frozen 19-word list without being told to.
- Don't build Phase 2 features unless explicitly asked — flag if a request seems to require them.
- Don't put the MediaPipe per-frame loop into reactive UI state directly.
- Don't skip landmark normalization.
