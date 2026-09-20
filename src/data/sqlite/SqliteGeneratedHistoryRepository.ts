import type { GeneratedHistoryRepository } from '../../domain/interfaces';
import type { GeneratedCodeHistoryItem } from '../../domain/models/GeneratedCodeHistoryItem';
import { SqliteDatabase } from './SqliteDatabase';

type GeneratedRow = {
  id: string;
  mode: GeneratedCodeHistoryItem['mode'];
  kind: GeneratedCodeHistoryItem['kind'];
  payload: string | null;
  display_value: string;
  created_at: number;
};

function fromRow(row: GeneratedRow): GeneratedCodeHistoryItem {
  return {
    id: row.id,
    mode: row.mode,
    kind: row.kind,
    payload: row.payload,
    displayValue: row.display_value,
    createdAt: Number(row.created_at),
  };
}

function makeId(): string {
  return `generated_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export class SqliteGeneratedHistoryRepository implements GeneratedHistoryRepository {
  constructor(private readonly database: SqliteDatabase) {}

  async getAll(): Promise<GeneratedCodeHistoryItem[]> {
    const db = await this.database.get();
    const result = await db.execute('SELECT * FROM generated_code_history ORDER BY created_at DESC LIMIT 50');
    return result.rows.map((row) => fromRow(row as unknown as GeneratedRow));
  }

  async add(input: Omit<GeneratedCodeHistoryItem, 'id' | 'createdAt'>): Promise<GeneratedCodeHistoryItem> {
    const item: GeneratedCodeHistoryItem = { ...input, id: makeId(), createdAt: Date.now() };
    const db = await this.database.get();
    await db.execute(
      'INSERT INTO generated_code_history (id, mode, kind, payload, display_value, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [item.id, item.mode, item.kind, item.payload, item.displayValue, item.createdAt],
    );
    await db.execute('DELETE FROM generated_code_history WHERE id NOT IN (SELECT id FROM generated_code_history ORDER BY created_at DESC LIMIT 50)');
    return item;
  }
}
