# Ghar-Sanket — Product Requirements Document

**घर-संकेत** — an ambient sign-language and wellness portal for elderly deaf individuals aging at home.

**Tracks:** 02 (AI for Accessibility, primary) · 03 (Telehealth & Remote Care, secondary)

---

## 1. Problem Statement

An elderly deaf person living alone cannot communicate needs to family who live elsewhere — voice assistants, phone calls, and texting are all inaccessible to them by design. Meanwhile, their family has no visibility into slow physical decline (gait, balance, mobility) that typically precedes a fall or medical emergency by weeks, and existing monitoring tools (wearables, cameras, panic buttons) fail because they require effort from the person least able to give it.

## 2. Goal

Build a single-camera system that:
1. Lets the grandparent communicate needs via Indian Sign Language, understood instantly and surfaced to family.
2. Passively tracks physical wellness indicators from the same camera feed, surfacing meaningful trends to family — without diagnosing, without burdening the user, and without her ever seeing a health score.

## 3. Non-Goals

- Not a diagnostic or medical device — the system describes changes, it never names a condition.
- Not a wearable or hardware product — webcam only, nothing to charge, wear, or forget.
- Not for real-time video surveillance — no video is ever stored or transmitted, only extracted coordinates.

## 4. Users

| User | Role |
|---|---|
| **Grandparent (primary user)** | Deaf, elderly, lives alone. Interacts only via sign language at the mirror. Never sees health data. |
| **Family member(s) (buyer/monitor)** | Views alerts and wellness trends on the dashboard. Receives pop-up alerts. |

---

## 5. Phase 1 — Sign Communication (Core, Build First)

### 5.1 Functional Requirements

| ID | Requirement |
|---|---|
| P1-1 | System captures live video via laptop webcam, processed entirely client-side. |
| P1-2 | System tracks hand and pose landmarks in real time using MediaPipe Holistic (WASM). |
| P1-3 | System recognizes a fixed vocabulary of ISL signs (target: 15) from a sliding window of landmark sequences. |
| P1-4 | System chains 2–3 sequential signs into a single intent (e.g. `HEAD` + `PAIN` → "headache"). |
| P1-5 | A sign/chain must be held briefly before firing, to prevent false triggers from transitional hand movement. |
| P1-6 | On a confirmed intent, an alert is generated and sent to the family dashboard — **no external SMS/WhatsApp; delivery is internal to the app.** |
| P1-7 | The dashboard displays a real-time pop-up notification showing what was signed and when. |
| P1-8 | The mirror UI shows a live confidence ring that fills as a sign is being recognized. |
| P1-9 | The mirror UI displays only need-based visual cards (`MEDICINE`, `WATER`, `PAIN`, `HELP`, etc.) and a Reassurance Drawer (read receipts, family check-ins). It never shows health data. |

### 5.2 Non-Functional Requirements

- Sign-to-alert latency: under 3 seconds.
- No video frame is ever transmitted or stored — only landmark coordinates.
- Must degrade gracefully with partial hand occlusion or brief tracking loss.

---

## 6. Phase 2 — Wellness Monitoring (Built on the Same Pipeline)

Runs on the pose landmarks already produced by MediaPipe for Phase 1 — no new sensor, no new camera pass.

### 6.1 Core Wellness Features (no added cost — same pipeline, geometry-only, no model)

| ID | Feature | What it measures | Why it matters |
|---|---|---|---|
| P2-1 | **Gait speed** | Hip-centroid displacement over time | Strongest known predictor of fall risk |
| P2-2 | **Sit-to-stand duration** | Hip-height transition time | Direct proxy for lower-limb strength |
| P2-3 | **Postural sway** | Torso oscillation amplitude while standing | Balance degradation |
| P2-4 | **Gait symmetry** | Left vs. right stride length/timing | Flags one-sided issues (hip/knee) distinct from general slowdown |
| P2-5 | **Freezing-of-gait detection** | Sudden mid-stride stop with no recovery movement | Distinct clinical pattern, separate from gradual decline |
| P2-6 | **Fall detection (immediate)** | Sudden vertical drop in hip/head coordinates + no recovery for several seconds | Fires an **immediate** alert, same urgency tier as a signed emergency — bypasses the slow-trend loop entirely |
| P2-7 | **Activity-pattern tracking** | Time spent sitting / standing / lying down across the day | A sudden shift (e.g. lying down far more) is a signal independent of gait |

### 6.2 Trend Engine

| ID | Requirement |
|---|---|
| P2-8 | All daily metrics (P2-1 through P2-4, P2-7) are appended to a rolling 60-day buffer per resident. |
| P2-9 | Changepoint detection runs periodically over the buffer to distinguish genuine drift from day-to-day noise. |
| P2-10 | A detected drift is converted into one plain-language sentence for the family dashboard (a "Drift Card") — never a raw chart or number shown to the grandparent. |
| P2-11 | Fall detection (P2-6) bypasses the trend engine and fires as an immediate pop-up alert, same channel as Phase 1 sign alerts. |

### 6.3 Consent

| ID | Requirement |
|---|---|
| P2-12 | Wellness tracking is explained to the grandparent via an ISL-signed onboarding flow; she must sign yes/no to enable it. |
| P2-13 | She can toggle wellness tracking off at any time from her own screen, in ISL. If disabled, Phase 1 continues to function fully. |
| P2-14 | The grandparent-facing UI never displays a score, chart, or trend line about her own health, under any setting. |

---

## 7. Optional Features (Build Only If Time Permits)

These are explicitly lower priority than everything above. Do not start these until Phase 1 and Section 6 are fully working and demo-ready.

| ID | Feature | Description | Condition |
|---|---|---|---|
| OPT-1 | **Voice agent** | A conversational voice interaction for the grandparent (e.g. a brief daily check-in) | Only if Phase 1 + core wellness features are complete and stable |
| OPT-2 | **Voice/speech signal** | Passive analysis of response latency, pause length, and vocal energy during any voice interaction, as an additional wellness indicator independent of the pose data | Only if OPT-1 is built, since it needs a voice interaction to sample from |

Both are explicitly **cut-first** if the team falls behind schedule. Neither is required for the demo to succeed.

---

## 8. System Architecture

```
Webcam
  │
  MediaPipe Holistic (WASM, client-side, nothing transmitted)
  │
  ├── Hand + face landmarks ──▶ ISL model ──▶ sign chaining ──▶ alert
  │                                                              │
  └── Pose landmarks (33 pts) ──▶ geometry ──▶ rolling buffer    │
                                      │                          │
                                 changepoint detection            │
                                      │                          │
                                 Drift Card ────────────────┐    │
                                                             ▼    ▼
                                                    Family Dashboard
                                                    (pop-up alerts,
                                                     Drift Cards,
                                                     Reassurance Drawer)
```

Alert delivery (both sign-based and fall-based) is **internal to the application** — a WebSocket event relayed through the minimal Node backend, not an external messaging API.

```
Mirror app (grandparent's screen)          Dashboard app (family's screen)
        │                                            ▲
        │ sign confirmed → emit                      │ receive → render pop-up
        ▼                                            │
                    Node server (socket.io/ws)
                    relays { sign, timestamp, confidence }
                    no video, no persistence, no DB
```

---

## 9. Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + Tailwind |
| Vision/tracking | MediaPipe Holistic (WASM), client-side |
| Sign recognition | Small LSTM / 1D-CNN, trained offline on landmark sequences from AI4Bharat INCLUDE + CISLR |
| Wellness metrics | Geometry/arithmetic on pose landmarks — no model |
| Trend detection | `ruptures` (changepoint detection) |
| Backend | Minimal Node.js server (Express or bare `http`) running `socket.io`/`ws` — relays alert events only, no persistence, no video |
| Alert transport | WebSockets (`socket.io`/`ws`) — mirror and dashboard are separate screens/devices (decided) |
| Longitudinal test data | Parametric synthetic generator producing pose sequences with a drifting latent health state, used only to validate detection latency |
| *Optional* voice agent | STT → LLM → TTS, or a single realtime voice API |

---

## 10. Data

- **ISL training data:** AI4Bharat INCLUDE and CISLR, converted to landmark sequences offline before/during the build.
- **Wellness validation data:** No training data needed (geometry-only). A synthetic longitudinal generator is used solely to measure detection latency against known ground truth, since no public dataset contains a single person's decline over months.

---

## 11. Success Criteria (Demo)

1. A person signs a 2-sign chain (e.g. `HEAD` + `PAIN`) and a pop-up alert appears on the dashboard within 3 seconds.
2. A person walks across the room and live gait metrics visibly populate.
3. A simulated fall triggers an immediate pop-up, distinct from the slow-trend alerts.
4. A Drift Card renders a plain-language trend statement from the synthetic longitudinal data, with a stated detection-latency result (e.g. "14% decline over 6 weeks, flagged day 19").
5. The grandparent-facing screen at no point displays a number, score, or chart related to her health.

---

## 12. Risks

| Risk | Mitigation |
|---|---|
| Sign recognition accuracy degrades with real users vs. dataset | Test against live team members early (by hour 6–7), not just held-out dataset splits |
| Vocabulary creep delays the ISL model | Freeze at 15 signs before the build starts; no additions mid-build |
| Judges question the synthetic wellness data | State proactively: real data trained/validated the recognition layer; synthetic data is used only for the multi-month time axis, which no dataset anywhere contains |
| Voice agent/signal eats time better spent elsewhere | Explicitly optional and cut-first; do not start until core scope is demo-ready |
| Lighting/camera angle affects tracking at demo time | Test at actual demo distance and lighting in the final rehearsal block |

---

## 13. Out of Scope (This Build)

- Multi-resident support (distinguishing between two people in frame)
- Two-way communication (family replying via a signing avatar)
- Wearable or radar-based sensing
- Any feature that names or implies a medical diagnosis
