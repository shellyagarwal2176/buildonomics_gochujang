# ml/

ISL sign classifier — Shelly's component.

- `data/` — Mendeley dataset, static photos, one folder per word, scoped to the frozen
  19-sign vocabulary: `AFRAID, AGREE, ASSISTANCE, BAD, DOCTOR, GOOD MORNING, HOME,
  HOW ARE YOU, HUNGRY, I NEED HELP, PAIN, PROBLEM, SICK, STAND, STOP, THIRSTY,
  UNDERSTAND, WARN, YOU`
- `src/` — landmark extraction (MediaPipe HandLandmarker offline pass, one frame per
  photo) + classifier training + JS export for the mirror app
- `notebooks/` — exploration

Pipeline: static photos → MediaPipe HandLandmarker (offline, once, one frame per image)
→ labeled landmark vectors → train a per-frame classifier (MLP/dense NN or classical ML
— no sequence model, since there's no trajectory data) → export weights for the mirror
app's live inference.

Note: extraction uses the standalone `HandLandmarker`, not `HolisticLandmarker` —
Holistic gates hand detection on finding a full body pose first, which silently failed
on this dataset's close-up hand photos (some words had a 0% detection rate). The live
mirror app can still use Holistic if it wants pose data for Phase 2; that's an
independent choice from how this offline extraction step works.

### Running the pipeline

```
python src/extract_landmarks.py   # data/ -> features/{features,labels}.npy
python src/train_classifier.py    # features/ -> models/sign_classifier.joblib
python src/export_model.py        # models/sign_classifier.joblib -> ../mirror/src/ml/sign_classifier.json
```

`export_model.py` writes weights only (StandardScaler mean/scale + MLP layer
weights/biases) as plain JSON — no ONNX/TF.js dependency. `mirror/src/ml/normalize.js`
and `mirror/src/ml/signClassifier.js` are the JS side of the contract: a port of
`normalize.py` and a ~20-line hand-rolled forward pass, verified to match the Python
model's predictions exactly on held-out samples. Re-run `export_model.py` any time the
model is retrained — the JSON is regenerated, the JS loader code doesn't change.

### Known data limitation

Per-word sample counts after extraction are very uneven (roughly 600-900 for 9 words,
as low as 2 for `HUNGRY`) because several words' source photos have the hand small/
occluded/out of frame. `HUNGRY`'s 2 usable samples aren't enough to learn or evaluate
that word reliably — the model will effectively have memorized them, not learned the
sign. This needs more source photos for `HUNGRY` (and ideally `STOP`, `HOME`, `I NEED
HELP`) to fix; it isn't a pipeline bug.

MediaPipe itself is never trained — see root CLAUDE.md for the full pipeline contract
and the "Dataset & model type change" note (this deviates from the original
video-sequence plan because the available data is static photos, not clips).

## Expected data layout

Copy your downloaded photos into `data/` so each word has its own subfolder, named
after the word (case/spacing is normalized by the extraction script, so `good_morning/`,
`Good Morning/`, or `GOOD-MORNING/` all work):

```
ml/data/
  afraid/            *.jpg | *.jpeg | *.png
  agree/
  assistance/
  bad/
  doctor/
  good morning/
  home/
  how are you/
  hungry/
  i need help/
  pain/
  problem/
  sick/
  stand/
  stop/
  thirsty/
  understand/
  warn/
  you/
```
