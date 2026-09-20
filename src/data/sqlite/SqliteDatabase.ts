import { open, type DB } from '@op-engineering/op-sqlite';

const DATABASE_NAME = 'qrscan.sqlite';

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS scan_history (
    id TEXT PRIMARY KEY NOT NULL,
    content_type TEXT NOT NULL,
    display_title TEXT NOT NULL,
    display_subtitle TEXT NOT NULL,
    safe_value TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    last_opened_at INTEGER,
    is_favorite INTEGER NOT NULL DEFAULT 0,
    source TEXT NOT NULL,
    metadata_json TEXT,
    related_authenticator_account_id TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_scan_history_created_at ON scan_history(created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS authenticator_accounts (
    id TEXT PRIMARY KEY NOT NULL,
    type TEXT NOT NULL,
    issuer TEXT NOT NULL,
    account_name TEXT NOT NULL,
    label TEXT NOT NULL,
    algorithm TEXT NOT NULL,
    digits INTEGER NOT NULL,
    period INTEGER NOT NULL,
    counter INTEGER,
    credential_id TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    is_favorite INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_authenticator_accounts_sort_order ON authenticator_accounts(sort_order ASC)`,
  `CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS generated_code_history (
    id TEXT PRIMARY KEY NOT NULL,
    mode TEXT NOT NULL,
    kind TEXT,
    payload TEXT,
    display_value TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_generated_code_history_created_at ON generated_code_history(created_at DESC)`,
];

/** Lazy database connection and schema bootstrap for non-secret data only. */
export class SqliteDatabase {
  private database: DB | null = null;
  private initialization: Promise<DB> | null = null;

  async get(): Promise<DB> {
    if (this.database) return this.database;
    if (!this.initialization) {
      this.initialization = this.openAndMigrate();
    }
    this.database = await this.initialization;
    return this.database;
  }

  private async openAndMigrate(): Promise<DB> {
    const database = await open({ name: DATABASE_NAME });
    await database.execute('PRAGMA foreign_keys = ON');
    await database.transaction(async (transaction) => {
      for (const statement of SCHEMA) {
        await transaction.execute(statement);
      }
    });
    return database;
  }
}
