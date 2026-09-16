# ml/

ISL sign classifier — Shelly's component.

- `data/` — AI4Bharat INCLUDE + CISLR clips, scoped to the frozen 15-sign vocabulary
- `src/` — landmark extraction (MediaPipe Holistic offline pass) + classifier training
- `notebooks/` — exploration

Pipeline: raw video → MediaPipe Holistic (offline, once) → labeled landmark sequences →
train LSTM/1D-CNN classifier → export weights for the mirror app's live inference.

MediaPipe itself is never trained — see root CLAUDE.md for the full pipeline contract.
