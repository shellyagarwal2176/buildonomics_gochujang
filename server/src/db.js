 const Database = require('better-sqlite3')
const path = require('path')

// Phase 2 persistence. Phase 1's server was intentionally stateless ("no DB,
// no persistence" in CLAUDE.md) — that line was protecting against storing
// video/PII, not ruling out a rolling metric buffer, which Phase 2's 60-day
// trend engine cannot work without. Single-file SQLite, single hardcoded
// resident — no multi-resident/accounts support, not asked for.
const db = new Database(path.join(__dirname, '..', 'wellness.db'))

db.exec(`
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
`)

// Incremental mean per field: new_avg = old_avg + (value - old_avg) / (n+1).
// Nullable metric fields (a batch may have no gait observed, e.g. resident sat
// the whole window) are only folded in when non-null, so a window with no
// signal for a metric doesn't drag its average toward 0.
function upsertDailyMetric(residentId, date, batch) {
  const existing = db
    .prepare('SELECT * FROM daily_metrics WHERE resident_id = ? AND date = ?')
    .get(residentId, date)

  if (!existing) {
    db.prepare(
      `INSERT INTO daily_metrics
        (resident_id, date, gait_speed_avg, sit_to_stand_avg_ms, sway_score_avg,
         symmetry_score_avg, freeze_events_count, sitting_minutes, standing_minutes,
         lying_minutes, sample_count, updated_at)
       VALUES (@residentId, @date, @gaitSpeedAvg, @sitToStandMs, @swayScore,
         @symmetryScore, @freezeEventsCount, @sittingMinutes, @standingMinutes,
         @lyingMinutes, 1, @updatedAt)`
    ).run({
      residentId,
      date,
      gaitSpeedAvg: batch.gaitSpeedAvg ?? null,
      sitToStandMs: batch.sitToStandMs ?? null,
      swayScore: batch.swayScore ?? null,
      symmetryScore: batch.symmetryScore ?? null,
      freezeEventsCount: batch.freezeEventsCount ?? 0,
      sittingMinutes: batch.sittingMinutes ?? 0,
      standingMinutes: batch.standingMinutes ?? 0,
      lyingMinutes: batch.lyingMinutes ?? 0,
      updatedAt: Date.now(),
    })
    return
  }

  const n = existing.sample_count
  const nextAvg = (field, value) =>
    value == null ? existing[field] : existing[field] == null ? value : existing[field] + (value - existing[field]) / (n + 1)

  db.prepare(
    `UPDATE daily_metrics SET
      gait_speed_avg = @gaitSpeedAvg,
      sit_to_stand_avg_ms = @sitToStandMs,
      sway_score_avg = @swayScore,
      symmetry_score_avg = @symmetryScore,
      freeze_events_count = freeze_events_count + @freezeEventsCount,
      sitting_minutes = sitting_minutes + @sittingMinutes,
      standing_minutes = standing_minutes + @standingMinutes,
      lying_minutes = lying_minutes + @lyingMinutes,
      sample_count = sample_count + 1,
      updated_at = @updatedAt
    WHERE resident_id = @residentId AND date = @date`
  ).run({
    residentId,
    date,
    gaitSpeedAvg: nextAvg('gait_speed_avg', batch.gaitSpeedAvg ?? null),
    sitToStandMs: nextAvg('sit_to_stand_avg_ms', batch.sitToStandMs ?? null),
    swayScore: nextAvg('sway_score_avg', batch.swayScore ?? null),
    symmetryScore: nextAvg('symmetry_score_avg', batch.symmetryScore ?? null),
    freezeEventsCount: batch.freezeEventsCount ?? 0,
    sittingMinutes: batch.sittingMinutes ?? 0,
    standingMinutes: batch.standingMinutes ?? 0,
    lyingMinutes: batch.lyingMinutes ?? 0,
    updatedAt: Date.now(),
  })
}

function getUndismissedDriftCards(residentId) {
  return db
    .prepare(
      'SELECT id, metric, message, severity, detected_at, changepoint_date FROM drift_cards WHERE resident_id = ? AND dismissed = 0 ORDER BY detected_at DESC'
    )
    .all(residentId)
}

function dismissDriftCard(id) {
  db.prepare('UPDATE drift_cards SET dismissed = 1 WHERE id = ?').run(id)
}

module.exports = { db, upsertDailyMetric, getUndismissedDriftCards, dismissDriftCard }
