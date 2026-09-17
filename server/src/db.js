const { DatabaseSync } = require('node:sqlite')
const path = require('path')

// Phase 2 persistence. Phase 1's server was intentionally stateless ("no DB,
// no persistence" in CLAUDE.md) — that line was protecting against storing
// video/PII, not ruling out a rolling metric buffer, which Phase 2's 60-day
// trend engine cannot work without. Single-file SQLite, reused (not a second
// DB file) for the auth tables below — households/family_members/
// mirror_devices, added for per-household auth (see server/src/auth.js and
// CLAUDE.md's Authentication section). daily_metrics/drift_cards still key
// off a single hardcoded residentId, not householdId — that's an existing
// limitation of the Phase 2 trend engine, not something this auth work fixes.
//
// Uses Node's built-in node:sqlite (DatabaseSync) rather than better-sqlite3
// — same synchronous prepare/run/get/all API and @name parameter binding, so
// every query below is unchanged, but no native module to compile. Swapped
// in because better-sqlite3 needs a C++ toolchain (node-gyp) that isn't
// installed on every dev machine; node:sqlite ships with Node 22+ and needs
// nothing extra. It's still marked experimental upstream — worth watching
// for breaking changes on a Node upgrade, but functionally solid here.
const db = new DatabaseSync(path.join(__dirname, '..', 'wellness.db'))

db.exec(`
  CREATE TABLE IF NOT EXISTS households (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pairing_code TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS family_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    household_id INTEGER NOT NULL REFERENCES households(id),
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    UNIQUE (household_id, name)
  );

  CREATE TABLE IF NOT EXISTS mirror_devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    household_id INTEGER NOT NULL REFERENCES households(id),
    device_token TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL
  );

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

function insertHousehold(pairingCode) {
  const { lastInsertRowid } = db
    .prepare('INSERT INTO households (pairing_code, created_at) VALUES (?, ?)')
    .run(pairingCode, Date.now())
  return lastInsertRowid
}

function getHouseholdByPairingCode(pairingCode) {
  return db.prepare('SELECT * FROM households WHERE pairing_code = ?').get(pairingCode)
}

function getHouseholdById(householdId) {
  return db.prepare('SELECT * FROM households WHERE id = ?').get(householdId)
}

function updateHouseholdPairingCode(householdId, pairingCode) {
  db.prepare('UPDATE households SET pairing_code = ? WHERE id = ?').run(pairingCode, householdId)
}

function insertMirrorDevice(householdId, deviceToken) {
  db.prepare('INSERT INTO mirror_devices (household_id, device_token, created_at) VALUES (?, ?, ?)').run(
    householdId,
    deviceToken,
    Date.now()
  )
}

function getMirrorDeviceByToken(deviceToken) {
  return db.prepare('SELECT * FROM mirror_devices WHERE device_token = ?').get(deviceToken)
}

function insertFamilyMember(householdId, name, passwordHash) {
  const { lastInsertRowid } = db
    .prepare('INSERT INTO family_members (household_id, name, password_hash, created_at) VALUES (?, ?, ?, ?)')
    .run(householdId, name, passwordHash, Date.now())
  return lastInsertRowid
}

function getFamilyMember(householdId, name) {
  return db.prepare('SELECT * FROM family_members WHERE household_id = ? AND name = ?').get(householdId, name)
}

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

module.exports = {
  db,
  upsertDailyMetric,
  getUndismissedDriftCards,
  dismissDriftCard,
  insertHousehold,
  getHouseholdByPairingCode,
  getHouseholdById,
  updateHouseholdPairingCode,
  insertMirrorDevice,
  getMirrorDeviceByToken,
  insertFamilyMember,
  getFamilyMember,
}
