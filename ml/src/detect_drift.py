"""Changepoint detection over the wellness trend engine's rolling metric
buffer — the one piece of Phase 2 that has to stay in Python, since `ruptures`
has no JS equivalent (see root CLAUDE.md's Phase 2 spec). One-shot CLI, not a
daemon: run it on demand (button or manual call) rather than building a
scheduler, which is more ops infrastructure than a hackathon needs.

Reads/writes server/wellness.db directly (Python stdlib sqlite3, no new
dependency) — same file the Node relay server's db.js manages.

Usage:
    python src/detect_drift.py [--resident-id grandparent-1]
"""

import argparse
import sqlite3
import time
from pathlib import Path

import numpy as np
import ruptures as rpt

ML_ROOT = Path(__file__).parent.parent
DB_PATH = ML_ROOT.parent / "server" / "wellness.db"

# Fixed lookup table, not generated text — avoids any AI-written-health-claim
# risk and is trivially demoable. One template per (metric, direction) pair.
TEMPLATES = {
    ("gait_speed_avg", "decreasing"): ("Movement has been a bit slower this week.", "notice"),
    ("gait_speed_avg", "increasing"): ("Movement has looked a little quicker this week.", "info"),
    ("sway_score_avg", "increasing"): ("Balance has looked a little less steady lately.", "notice"),
    ("sway_score_avg", "decreasing"): ("Balance has looked steadier lately.", "info"),
    ("sitting_minutes", "increasing"): ("They've been sitting more than usual this week.", "notice"),
    ("sitting_minutes", "decreasing"): ("They've been up and about more than usual this week.", "info"),
    ("symmetry_score_avg", "decreasing"): ("Their walk has looked slightly uneven recently.", "notice"),
    ("symmetry_score_avg", "increasing"): ("Their walk has looked steadier and more even recently.", "info"),
}

RECENT_WINDOW_DAYS = 14  # only surface a changepoint if it's recent, not ancient history
MIN_SAMPLES = 10  # ruptures needs a reasonable series length to say anything meaningful
MIN_RELATIVE_CHANGE = 0.10  # ignore changepoints that are just noise, not a real shift


def find_changepoint(values):
    """Returns the index of the single most significant changepoint, or None.

    ponytail: single-changepoint Pelt with a fixed penalty — not tuned against
    real gait-decline data (none exists), validated only against
    generate_synthetic_gait.py's deliberately obvious injected decline.
    Upgrade path: tune `pen` against real longitudinal data if it ever exists.
    """
    if len(values) < MIN_SAMPLES:
        return None
    series = np.array(values).reshape(-1, 1)
    algo = rpt.Pelt(model="rbf").fit(series)
    breakpoints = algo.predict(pen=5)
    # predict() always includes len(series) as the final "changepoint" — drop it.
    breakpoints = [b for b in breakpoints if b < len(series)]
    if not breakpoints:
        return None
    return breakpoints[-1]  # most recent changepoint


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--resident-id", default="grandparent-1")
    args = parser.parse_args()

    if not DB_PATH.exists():
        print(f"No database at {DB_PATH} — run the server at least once, or "
              f"generate_synthetic_gait.py, first.")
        return

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT * FROM daily_metrics WHERE resident_id = ? ORDER BY date ASC",
        (args.resident_id,),
    ).fetchall()

    if len(rows) < MIN_SAMPLES:
        print(f"Only {len(rows)} day(s) of data for '{args.resident_id}' — need at least "
              f"{MIN_SAMPLES} to look for trends. Run generate_synthetic_gait.py for a demo dataset.")
        conn.close()
        return

    dates = [r["date"] for r in rows]
    cards_written = 0

    for metric in ("gait_speed_avg", "sway_score_avg", "sitting_minutes", "symmetry_score_avg"):
        indexed = [(i, r[metric]) for i, r in enumerate(rows) if r[metric] is not None]
        if len(indexed) < MIN_SAMPLES:
            continue
        indices, values = zip(*indexed)

        cp = find_changepoint(list(values))
        if cp is None or cp == 0:
            continue

        changepoint_date_index = indices[cp - 1] if cp - 1 < len(indices) else indices[-1]
        changepoint_date = dates[changepoint_date_index]

        days_since = len(rows) - 1 - changepoint_date_index
        if days_since > RECENT_WINDOW_DAYS:
            continue  # a real shift, but not a recent one — not worth surfacing now

        before = np.mean(values[:cp])
        after = np.mean(values[cp:])
        if before == 0:
            continue
        relative_change = (after - before) / abs(before)
        if abs(relative_change) < MIN_RELATIVE_CHANGE:
            continue

        direction = "increasing" if after > before else "decreasing"
        template = TEMPLATES.get((metric, direction))
        if not template:
            continue
        message, severity = template

        already_flagged = conn.execute(
            "SELECT 1 FROM drift_cards WHERE resident_id = ? AND metric = ? AND changepoint_date = ? AND dismissed = 0",
            (args.resident_id, metric, changepoint_date),
        ).fetchone()
        if already_flagged:
            continue

        conn.execute(
            """INSERT INTO drift_cards
               (resident_id, metric, message, severity, detected_at, changepoint_date, dismissed)
               VALUES (?, ?, ?, ?, ?, ?, 0)""",
            (args.resident_id, metric, message, severity, int(time.time() * 1000), changepoint_date),
        )
        cards_written += 1
        print(f"Drift Card: [{metric}] {direction} since {changepoint_date} -> \"{message}\"")

    conn.commit()
    conn.close()

    if cards_written == 0:
        print(f"No new drift cards for '{args.resident_id}' — either no significant recent "
              f"changepoints, or they're already flagged.")


if __name__ == "__main__":
    main()
