"""Train the per-frame sign classifier on landmark vectors produced by
extract_landmarks.py. No sequence model — see root CLAUDE.md's "Dataset & model
type change" note for why (static-photo data has no trajectory to learn from).

Usage:
    python src/train_classifier.py
"""

from pathlib import Path

import joblib
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report

ML_ROOT = Path(__file__).parent.parent
FEATURES_DIR = ML_ROOT / "features"
MODELS_DIR = ML_ROOT / "models"


def main():
    features_path = FEATURES_DIR / "features.npy"
    labels_path = FEATURES_DIR / "labels.npy"
    if not features_path.exists() or not labels_path.exists():
        print("No features found — run extract_landmarks.py first.")
        return

    X = np.load(features_path)
    y = np.load(labels_path)

    counts = {label: int((y == label).sum()) for label in sorted(set(y))}
    print("Samples per label:")
    for label, count in counts.items():
        print(f"  {label}: {count}")

    min_count = min(counts.values())
    if min_count < 2:
        print("\nAt least one label has fewer than 2 samples — can't hold out a "
              "test set. Add more photos for that word, or train on everything "
              "below with no held-out evaluation.")
        stratify = None
        test_size = 0.0
    else:
        stratify = y
        # keep at least 1 sample per class in the test set where possible
        test_size = 0.2 if min_count >= 5 else max(1, min_count // 5) / len(y)
        # stratified splitting needs the test set to hold at least one sample
        # per class overall; a very rare class (e.g. 2 samples) can otherwise
        # shrink test_size below that floor and make train_test_split raise.
        num_classes = len(counts)
        test_size = max(test_size, (num_classes + 1) / len(y))

    model = make_pipeline(
        StandardScaler(),
        MLPClassifier(hidden_layer_sizes=(64, 32), max_iter=2000, random_state=0),
    )

    if test_size > 0:
        try:
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=test_size, stratify=stratify, random_state=0
            )
        except ValueError as e:
            print(f"\nCouldn't hold out a stratified test set ({e}); "
                  f"training on everything with no held-out evaluation instead.")
            model.fit(X, y)
        else:
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            print("\nHeld-out evaluation:")
            print(classification_report(y_test, y_pred, zero_division=0))
    else:
        model.fit(X, y)
        print("\nTrained on all samples (no held-out set — too little data per class).")

    MODELS_DIR.mkdir(exist_ok=True)
    model_path = MODELS_DIR / "sign_classifier.joblib"
    joblib.dump(model, model_path)
    print(f"\nSaved model to {model_path}")


if __name__ == "__main__":
    main()
