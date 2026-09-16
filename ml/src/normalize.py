"""Landmark normalization shared by extraction (offline) and live inference (mirror app
port of this logic). Re-centers on the wrist and scales by hand span so recognition is
invariant to distance/position from the camera — see root CLAUDE.md, this step is not
optional.
"""

import numpy as np

WRIST_IDX = 0
MIDDLE_MCP_IDX = 9
NUM_LANDMARKS = 21
VEC_LEN_PER_HAND = NUM_LANDMARKS * 3  # x, y, z


def normalize_hand(landmarks_xyz):
    """landmarks_xyz: (21, 3) array for one hand, or None if not detected.
    Returns a flat (63,) float32 vector, zeros if the hand wasn't detected."""
    if landmarks_xyz is None:
        return np.zeros(VEC_LEN_PER_HAND, dtype=np.float32)

    pts = np.asarray(landmarks_xyz, dtype=np.float32)
    wrist = pts[WRIST_IDX]
    centered = pts - wrist

    hand_span = np.linalg.norm(centered[MIDDLE_MCP_IDX])
    scale = hand_span if hand_span > 1e-6 else 1.0
    scaled = centered / scale

    return scaled.flatten()


def landmarks_to_vector(left_hand_xyz, right_hand_xyz):
    """Fixed-shape (126,) vector: 63 for left hand + 63 for right hand, in that
    order. This is the contract's "fixed-shape landmark array" — don't change the
    shape or ordering without updating mirror/ and CLAUDE.md."""
    left = normalize_hand(left_hand_xyz)
    right = normalize_hand(right_hand_xyz)
    return np.concatenate([left, right])
