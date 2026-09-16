"""Export the trained sklearn sign classifier (models/sign_classifier.joblib) to a
plain JSON weight file the mirror app can load in the browser — no ONNX/TF.js
needed, the network is tiny (126->64->32->19) so a hand-rolled JS forward pass
is simpler and dependency-free.

This is the ml/ -> mirror/ contract handoff: weights only, no inference code
bundled with it (see mirror/src/ml/signClassifier.js for that).

Usage:
    python src/export_model.py
"""

import json
from pathlib import Path

import joblib

ML_ROOT = Path(__file__).parent.parent
MODEL_PATH = ML_ROOT / "models" / "sign_classifier.joblib"
OUT_PATH = ML_ROOT.parent / "mirror" / "src" / "ml" / "sign_classifier.json"


def main():
    if not MODEL_PATH.exists():
        print(f"No trained model at {MODEL_PATH} — run train_classifier.py first.")
        return

    pipeline = joblib.load(MODEL_PATH)
    scaler = pipeline.named_steps["standardscaler"]
    mlp = pipeline.named_steps["mlpclassifier"]

    if mlp.activation != "relu" or mlp.out_activation_ != "softmax":
        print(f"Unexpected activations ({mlp.activation}/{mlp.out_activation_}) — "
              f"the JS forward pass assumes relu hidden layers + softmax output. "
              f"Update signClassifier.js before trusting this export.")
        return

    export = {
        "classes": mlp.classes_.tolist(),
        "scaler": {
            "mean": scaler.mean_.tolist(),
            "scale": scaler.scale_.tolist(),
        },
        "layers": [
            {"weights": coef.tolist(), "biases": bias.tolist()}
            for coef, bias in zip(mlp.coefs_, mlp.intercepts_)
        ],
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w") as f:
        json.dump(export, f)

    print(f"Exported {len(export['classes'])}-class model "
          f"({' -> '.join(str(len(l['biases'])) for l in export['layers'])} "
          f"hidden/output units) to {OUT_PATH}")


if __name__ == "__main__":
    main()
