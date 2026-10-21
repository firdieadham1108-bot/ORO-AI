// SQLite storage for the ORO AI demo (Node's built-in SQLite, no native install needed).
// Four tables: staff, capacity_blocks, quotes, activity_log.
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { logger } from "../logger";
import { nowMyt } from "./dates";
import { SEED_ACTIVITY, SEED_BLOCKS, SEED_STAFF } from "./seed";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS staff (
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL,
  is_senior   INTEGER NOT NULL DEFAULT 0,
  can_install INTEGER NOT NULL DEFAULT 0,
  dispatch_order INTEGER NOT NULL DEFAULT 100
);

-- Time already taken: approved leave (simulated eLeave) or a job assignment (simulated Orbyte Work).
CREATE TABLE IF NOT EXISTS capacity_blocks (
  id        INTEGER PRIMARY KEY,
  staff_id  INTEGER NOT NULL REFERENCES staff(id),
  kind      TEXT NOT NULL CHECK (kind IN ('leave', 'assignment')),
  title     TEXT NOT NULL,
  start_at  TEXT NOT NULL,
  end_at    TEXT NOT NULL,
  reference TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS capacity_blocks_staff_idx ON capacity_blocks(staff_id);

CREATE TABLE IF NOT EXISTS quotes (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  reference      TEXT NOT NULL UNIQUE,
  customer_name  TEXT NOT NULL,
  location       TEXT NOT NULL,
  service_code   TEXT NOT NULL,
  quantity       INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_sen INTEGER NOT NULL,
  total_sen      INTEGER NOT NULL,
  requested_date TEXT NOT NULL,
  appointment_date TEXT,
  status         TEXT NOT NULL DEFAULT 'draft',
  approved_by    TEXT,
  approved_at    TEXT,
  crew           TEXT,
  message        TEXT,
  created_at     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activity_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  action      TEXT NOT NULL,
  description TEXT NOT NULL,
  actor       TEXT NOT NULL,
  severity    TEXT NOT NULL DEFAULT 'info',
  created_at  TEXT NOT NULL
);
`;

function hasColumn(database: DatabaseSync, table: string, column: string): boolean {
  const columns = database.prepare(`PRAGMA table_info(${table})`).all() as unknown as Array<{ name: string }>;
  return columns.some((c) => c.name === column);
}

/** Bring demo databases created by earlier versions up to the current columns, in place. */
function upgradeOlderDatabase(database: DatabaseSync): void {
  if (!hasColumn(database, "staff", "dispatch_order")) {
    database.exec("ALTER TABLE staff ADD COLUMN dispatch_order INTEGER NOT NULL DEFAULT 100");
    const update = database.prepare("UPDATE staff SET dispatch_order = ? WHERE id = ? AND name = ?");
    for (const s of SEED_STAFF) update.run(s.dispatchOrder, s.id, s.name);
  }
  for (const column of ["appointment_date", "approved_by", "approved_at", "crew"]) {
    if (!hasColumn(database, "quotes", column)) database.exec(`ALTER TABLE quotes ADD COLUMN ${column} TEXT`);
  }
}

function openDatabase(): DatabaseSync {
  const file = process.env["ORO_DB_PATH"] ?? path.resolve(process.cwd(), "data", "oro.db");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const database = new DatabaseSync(file);
  database.exec("PRAGMA journal_mode = WAL;");
  database.exec("PRAGMA foreign_keys = ON;");
  database.exec(SCHEMA);
  upgradeOlderDatabase(database);
  logger.info({ file }, "SQLite database ready");
  return database;
}

export const db: DatabaseSync = openDatabase();

/** Wrap work in a transaction. DatabaseSync is synchronous, so this is atomic. */
export function inTransaction<T>(work: () => T): T {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = work();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function logActivity(
  action: string,
  description: string,
  actor: string,
  severity: "info" | "success" | "warning" = "info",
): void {
  db.prepare(
    "INSERT INTO activity_log (action, description, actor, severity, created_at) VALUES (?, ?, ?, ?, ?)",
  ).run(action, description, actor, severity, nowMyt());
}

function insertSeedData(): void {
  const insertStaff = db.prepare(
    "INSERT INTO staff (id, name, role, is_senior, can_install, dispatch_order) VALUES (?, ?, ?, ?, ?, ?)",
  );
  for (const s of SEED_STAFF) {
    insertStaff.run(s.id, s.name, s.role, s.isSenior ? 1 : 0, s.canInstall ? 1 : 0, s.dispatchOrder);
  }
  const insertBlock = db.prepare(
    "INSERT INTO capacity_blocks (id, staff_id, kind, title, start_at, end_at, reference) VALUES (?, ?, ?, ?, ?, ?, ?)",
  );
  for (const b of SEED_BLOCKS) {
    insertBlock.run(b.id, b.staffId, b.kind, b.title, b.startAt, b.endAt, b.reference);
  }
  for (const a of SEED_ACTIVITY) {
    logActivity(a.action, a.description, a.actor, a.severity);
  }
}

/** Seed once, when the database is empty. */
export function seedIfEmpty(): void {
  const row = db.prepare("SELECT COUNT(*) AS n FROM staff").get() as { n: number };
  if (row.n === 0) {
    inTransaction(insertSeedData);
    logger.info("Seeded synthetic CoolAir Services data");
  }
}

/** Wipe everything and restore the starting demo state (for rehearsals). */
export function resetDemoData(): { staffCount: number; capacityBlockCount: number } {
  inTransaction(() => {
    db.exec("DELETE FROM quotes; DELETE FROM activity_log; DELETE FROM capacity_blocks; DELETE FROM staff;");
    db.exec("DELETE FROM sqlite_sequence WHERE name IN ('quotes', 'activity_log');");
    insertSeedData();
    logActivity("demo_reset", "Demo data was reset to its starting state.", "Demo control", "warning");
  });
  return { staffCount: SEED_STAFF.length, capacityBlockCount: SEED_BLOCKS.length };
}

seedIfEmpty();
