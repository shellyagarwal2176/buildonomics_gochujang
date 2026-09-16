"""Frozen 19-sign vocabulary — see root CLAUDE.md. Do not add signs here without
confirming with the team; this list is the single source of truth other ml/ scripts
import from.
"""

VOCABULARY = [
    "AFRAID",
    "AGREE",
    "ASSISTANCE",
    "BAD",
    "DOCTOR",
    "GOOD MORNING",
    "HOME",
    "HOW ARE YOU",
    "HUNGRY",
    "I NEED HELP",
    "PAIN",
    "PROBLEM",
    "SICK",
    "STAND",
    "STOP",
    "THIRSTY",
    "UNDERSTAND",
    "WARN",
    "YOU",
]


def normalize_label(raw):
    """Turn a folder/file name like 'good_morning' or 'Good-Morning' into the
    canonical vocabulary form 'GOOD MORNING'."""
    cleaned = raw.strip().upper().replace("_", " ").replace("-", " ")
    cleaned = " ".join(cleaned.split())
    return cleaned


LABEL_SET = {normalize_label(w) for w in VOCABULARY}
