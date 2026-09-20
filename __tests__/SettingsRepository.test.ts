import { SqliteSettingsRepository } from '../src/data/sqlite/SqliteSettingsRepository';
import { SqliteDatabase } from '../src/data/sqlite/SqliteDatabase';

function makeRepository(rows: Array<{ key: string; value: string }>): SqliteSettingsRepository {
  const database = {
    get: async () => ({
      execute: jest.fn(async () => ({ rows, rowsAffected: 0 })),
    }),
  } as unknown as SqliteDatabase;
  return new SqliteSettingsRepository(database);
}

describe('SqliteSettingsRepository link behavior', () => {
  it('defaults new settings to the external browser', async () => {
    await expect(makeRepository([]).getSettings()).resolves.toMatchObject({ linkBehavior: 'external' });
  });

  it('keeps an explicitly saved in-app browser preference', async () => {
    await expect(makeRepository([{ key: 'link_behavior', value: 'in_app' }]).getSettings()).resolves.toMatchObject({ linkBehavior: 'in_app' });
  });
});
