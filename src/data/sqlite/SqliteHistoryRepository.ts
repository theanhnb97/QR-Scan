import type { HistoryRepository } from '../../domain/interfaces';
import type { ScanHistoryItem, CreateHistoryInput } from '../../domain/models/ScanHistoryItem';
import { SqliteDatabase } from './SqliteDatabase';

type HistoryRow = {
  id: string;
  content_type: ScanHistoryItem['contentType'];
  display_title: string;
  display_subtitle: string;
  safe_value: string;
  created_at: number;
  last_opened_at: number | null;
  is_favorite: number;
  source: ScanHistoryItem['source'];
  metadata_json: string | null;
  related_authenticator_account_id: string | null;
};

function fromRow(row: HistoryRow): ScanHistoryItem {
  let metadata: ScanHistoryItem['metadata'];
  if (row.metadata_json) {
    try {
      metadata = JSON.parse(row.metadata_json) as ScanHistoryItem['metadata'];
    } catch {
      metadata = undefined;
    }
  }
  return {
    id: row.id,
    contentType: row.content_type,
    displayTitle: row.display_title,
    displaySubtitle: row.display_subtitle,
    safeValue: row.safe_value,
    createdAt: Number(row.created_at),
    lastOpenedAt: row.last_opened_at == null ? undefined : Number(row.last_opened_at),
    isFavorite: row.is_favorite === 1,
    source: row.source,
    metadata,
    relatedAuthenticatorAccountId: row.related_authenticator_account_id ?? undefined,
  };
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export class SqliteHistoryRepository implements HistoryRepository {
  constructor(private readonly database: SqliteDatabase) {}

  async getAll(): Promise<ScanHistoryItem[]> {
    const db = await this.database.get();
    const result = await db.execute('SELECT * FROM scan_history ORDER BY created_at DESC');
    return result.rows.map((row) => fromRow(row as unknown as HistoryRow));
  }

  async getById(id: string): Promise<ScanHistoryItem | null> {
    const db = await this.database.get();
    const result = await db.execute('SELECT * FROM scan_history WHERE id = ? LIMIT 1', [id]);
    return result.rows.length ? fromRow(result.rows[0] as unknown as HistoryRow) : null;
  }

  async add(input: CreateHistoryInput): Promise<ScanHistoryItem> {
    const item: ScanHistoryItem = { ...input, id: makeId('hist'), createdAt: Date.now() };
    const db = await this.database.get();
    await db.execute(
      `INSERT INTO scan_history
       (id, content_type, display_title, display_subtitle, safe_value, created_at, last_opened_at, is_favorite, source, metadata_json, related_authenticator_account_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.contentType,
        item.displayTitle,
        item.displaySubtitle,
        item.safeValue,
        item.createdAt,
        item.lastOpenedAt ?? null,
        item.isFavorite ? 1 : 0,
        item.source,
        item.metadata ? JSON.stringify(item.metadata) : null,
        item.relatedAuthenticatorAccountId ?? null,
      ],
    );
    return item;
  }

  async delete(id: string): Promise<boolean> {
    const db = await this.database.get();
    const result = await db.execute('DELETE FROM scan_history WHERE id = ?', [id]);
    return result.rowsAffected > 0;
  }

  async clearAll(): Promise<void> {
    const db = await this.database.get();
    await db.execute('DELETE FROM scan_history');
  }

  async toggleFavorite(id: string): Promise<boolean> {
    const db = await this.database.get();
    const existing = await db.execute('SELECT is_favorite FROM scan_history WHERE id = ? LIMIT 1', [id]);
    if (!existing.rows.length) return false;
    const nextValue = Number(existing.rows[0].is_favorite) === 1 ? 0 : 1;
    await db.execute('UPDATE scan_history SET is_favorite = ? WHERE id = ?', [nextValue, id]);
    return nextValue === 1;
  }

  async linkAuthenticator(id: string, accountId: string): Promise<boolean> {
    const db = await this.database.get();
    const result = await db.execute('UPDATE scan_history SET related_authenticator_account_id = ? WHERE id = ?', [accountId, id]);
    return result.rowsAffected > 0;
  }
}
