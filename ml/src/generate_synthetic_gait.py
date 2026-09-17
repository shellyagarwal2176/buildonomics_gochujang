"""Generate a synthetic 60-day daily_metrics series with an injected decline,
for testing/demoing detect_drift.py. No real longitudinal elderly-gait dataset
exists (see root CLAUDE.md's Phase 2 "Synthetic data note") — this is what
changepoint detection is actually validated and demoed against, since
live-collected data can never span 60 days in a hackathon.

Writes straight into the same SQLite file the live app uses
(server/wellness.db), so detect_drift.py needs no separate test path.

Usage:
    python src/generate_synthetic_gait.py [--resident-id grandparent-1]
"""

import argparse
import random
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path

ML_ROOT = Path(__file__).parent.parent
DB_PATH = ML_ROOT.parent / "server" / "wellness.db"

DAYS = 60
# 10 days ago: inside detect_drift.py's 14-day "recent" window (so the demo
# actually surfaces a card) while still leaving 50 days of stable baseline
# before it for ruptures to compare against. Obvious magnitude, not subtle —
# pen tuning is fiddly, don't make the demo hinge on it too.
DECLINE_STARTS_AT_DAY = 50


def daily_metrics_schema(conn):
    # Mirrors server/src/db.js's schema — kept in sync by hand, same as the
    # design-token duplication precedent in mirror/dashboard's index.css.
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS daily_metrics (
          resident_id TEXT NOT NULL,
          date TEXT NOT NULL,
          gait_speed_avg REAL,
          sit_to_stand_avg_ms REAL,
          sway_score_avg REAL,
          symmetry_score_avg REAL,
          freeze_events_count INTEGER DEFAULT 0,
          sitting_minutes INTEGER DEFAULT 0,
          standing_minutes INTEGER DEFAULT 0,
          lying_minutes INTEGER DEFAULT 0,
          sample_count INTEGER DEFAULT 0,
          updated_at INTEGER NOT NULL,
          PRIMARY KEY (resident_id, date)
        );
        CREATE TABLE IF NOT EXISTS drift_cards (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          resident_id TEXT NOT NULL,
          metric TEXT NOT NULL,
          message TEXT NOT NULL,
          severity TEXT NOT NULL,
          detected_at INTEGER NOT NULL,
          changepoint_date TEXT NOT NULL,
          dismissed INTEGER DEFAULT 0
        );
        """
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--resident-id", default="grandparent-1")
    args = parser.parse_args()

    DB_PATH.parent.mkdir(exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    daily_metrics_schema(conn)

    random.seed(0)
    today = datetime.now().date()
    rows = []
    for day_offset in range(DAYS, 0, -1):
        date = today - timedelta(days=day_offset)
        day_index = DAYS - day_offset  # 0-indexed, oldest first

        declined = day_index >= DECLINE_STARTS_AT_DAY
        gait_speed = (0.55 if declined else 0.85) + random.uniform(-0.05, 0.05)
        sway = (0.45 if declined else 0.22) + random.uniform(-0.03, 0.03)
        sitting_minutes = (420 if declined else 300) + random.uniform(-20, 20)

        rows.append(
            (
                args.resident_id,
                date.isoformat(),
                round(gait_speed, 3),
                1600 + random.uniform(-150, 150),
                round(sway, 3),
                round(0.9 + random.uniform(-0.05, 0.05), 3),
                random.randint(0, 1),
                round(sitting_minutes),
                round(120 + random.uniform(-15, 15)),
                0,
                48,  # sample_count: ~one metric batch every ~45s over a day, plausible
                int(datetime.now().timestamp() * 1000),
            )
        )

    conn.executemany(
        """
        INSERT OR REPLACE INTO daily_metrics
          (resident_id, date, gait_speed_avg, sit_to_stand_avg_ms, sway_score_avg,
           symmetry_score_avg, freeze_events_count, sitting_minutes, standing_minutes,
           lying_minutes, sample_count, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        rows,
    )
    conn.commit()
    conn.close()

    print(f"Wrote {len(rows)} synthetic days for resident '{args.resident_id}' to {DB_PATH}")
    print(f"Decline injected starting day {DECLINE_STARTS_AT_DAY} of {DAYS} "
          f"(around {(today - timedelta(days=DAYS - DECLINE_STARTS_AT_DAY)).isoformat()}).")
    print("Run detect_drift.py next to confirm it surfaces a Drift Card near that date.")


if __name__ == "__main__":
    main()
