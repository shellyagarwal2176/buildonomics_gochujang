"""Offline pass: data/<word>/*.{jpg,jpeg,png} -> labeled landmark vectors.

Runs MediaPipe Holistic once per photo (MediaPipe is pretrained, never fine-tuned —
see root CLAUDE.md). Writes features.npy (N, 126) and labels.npy (N,) to ml/features/.

Usage:
    python src/extract_landmarks.py
"""

import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from labels import LABEL_SET, normalize_label
from normalize import landmarks_to_vector

import mediapipe as mp
from mediapipe.tasks.python import BaseOptions
from mediapipe.tasks.python.vision import HandLandmarker, HandLandmarkerOptions

ML_ROOT = Path(__file__).parent.parent
DATA_DIR = ML_ROOT / "data"
OUT_DIR = ML_ROOT / "features"
MODEL_PATH = ML_ROOT / "models" / "hand_landmarker.task"
IMAGE_EXTS = {".jpg", ".jpeg", ".png"}


def split_by_handedness(result):
    """HandLandmarker (unlike HolisticLandmarker) doesn't tie hand detection to
    finding a body pose first, which matters a lot for close-up dataset photos
    where the arm/torso isn't in frame — Holistic silently failed to find hands
    on several word folders (e.g. GOOD MORNING: 0/40) that this detects fine.
    Route each detected hand into left/right by its handedness classification."""
    left = right = None
    for landmarks, handedness in zip(result.hand_landmarks, result.handedness):
        xyz = [(lm.x, lm.y, lm.z) for lm in landmarks]
        if handedness[0].category_name == "Left":
            left = xyz
        else:
            right = xyz
    return left, right


def main():
    if not DATA_DIR.exists():
        print(f"No data/ folder found at {DATA_DIR}. Copy your photos in first — "
              f"see ml/README.md for the expected layout.")
        return

    word_folders = sorted(p for p in DATA_DIR.iterdir() if p.is_dir())
    if not word_folders:
        print(f"{DATA_DIR} exists but has no subfolders. Expected one folder per word.")
        return

    if not MODEL_PATH.exists():
        print(f"No model asset found at {MODEL_PATH}. Download "
              f"hand_landmarker.task into ml/models/ first.")
        return

    features = []
    labels = []
    skipped_no_hand = 0
    skipped_unknown_label = []

    hand_landmarker = HandLandmarker.create_from_options(
        HandLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=str(MODEL_PATH)),
            num_hands=2,
            min_hand_detection_confidence=0.3,
        )
    )

    for folder in word_folders:
        label = normalize_label(folder.name)
        if label not in LABEL_SET:
            skipped_unknown_label.append(folder.name)
            continue

        # Some words store images directly in the folder, others nest them under
        # per-signer subfolders (User_1/, User_2/, ...) — search recursively so
        # both layouts are picked up.
        image_paths = [p for p in folder.rglob("*") if p.suffix.lower() in IMAGE_EXTS]
        print(f"{label}: {len(image_paths)} image(s)")

        for img_path in image_paths:
            image = cv2.imread(str(img_path))
            if image is None:
                print(f"  could not read {img_path.name}, skipping")
                continue

            rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            result = hand_landmarker.detect(mp_image)

            left, right = split_by_handedness(result)

            if left is None and right is None:
                skipped_no_hand += 1
                continue

            vec = landmarks_to_vector(left, right)
            features.append(vec)
            labels.append(label)

    hand_landmarker.close()

    if skipped_unknown_label:
        print(f"\nSkipped {len(skipped_unknown_label)} folder(s) not in the frozen "
              f"vocabulary (check spelling against ml/src/labels.py): "
              f"{skipped_unknown_label}")
    if skipped_no_hand:
        print(f"Skipped {skipped_no_hand} image(s) where MediaPipe found no hand.")

    if not features:
        print("\nNo usable images found — nothing written.")
        return

    OUT_DIR.mkdir(exist_ok=True)
    X = np.stack(features)
    y = np.array(labels)
    np.save(OUT_DIR / "features.npy", X)
    np.save(OUT_DIR / "labels.npy", y)

    print(f"\nWrote {len(y)} samples across {len(set(labels))} labels to {OUT_DIR}")


if __name__ == "__main__":
    main()
