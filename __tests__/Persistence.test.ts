import { SqliteAuthenticatorRepository } from '../src/data/sqlite/SqliteAuthenticatorRepository';
import { SqliteDatabase } from '../src/data/sqlite/SqliteDatabase';
import { SqliteHistoryRepository } from '../src/data/sqlite/SqliteHistoryRepository';

describe('SQLite persistence boundaries', () => {
  it('keeps authenticator secrets out of every SQL statement', async () => {
    const statements: Array<{ sql: string; params?: unknown[] }> = [];
    const execute = jest.fn(async (sql: string, params?: unknown[]) => {
      statements.push({ sql, params });
      if (sql.includes('SELECT * FROM authenticator_accounts')) return { rows: [], rowsAffected: 0 };
      if (sql.includes('SELECT is_favorite')) return { rows: [], rowsAffected: 0 };
      return { rows: [], rowsAffected: 1 };
    });
    const fakeDb: { execute: typeof execute; transaction: jest.Mock } = {
      execute,
      transaction: jest.fn(),
    };
    const database = { get: async () => fakeDb } as unknown as SqliteDatabase;
    const secureStore = {
      saveSecret: jest.fn(async () => undefined),
      getSecret: jest.fn(async () => 'not-used'),
      deleteSecret: jest.fn(async () => true),
      hasSecret: jest.fn(async () => true),
    };
    const repository = new SqliteAuthenticatorRepository(database, secureStore);
    const secret = 'JBSWY3DPEHPK3PXP';

    await repository.saveAccount({
      type: 'TOTP', issuer: 'Example', accountName: 'user@example.com', label: 'Example:user@example.com',
      algorithm: 'SHA1', digits: 6, period: 30, isFavorite: false, sortOrder: 0,
    }, secret);

    expect(secureStore.saveSecret).toHaveBeenCalledWith(expect.stringMatching(/^cred_auth_/), secret);
    expect(JSON.stringify(statements).toLowerCase()).not.toContain(secret.toLowerCase());
    expect(statements.some(({ sql }) => /secret/i.test(sql))).toBe(false);
  });

  it('persists only sanitized history fields supplied by the domain', async () => {
    const statements: Array<{ sql: string; params?: unknown[] }> = [];
    const fakeDb = {
      execute: jest.fn(async (sql: string, params?: unknown[]) => {
        statements.push({ sql, params });
        return { rows: [], rowsAffected: 1 };
      }),
      transaction: jest.fn(),
    };
    const database = { get: async () => fakeDb } as unknown as SqliteDatabase;
    const repository = new SqliteHistoryRepository(database);
    await repository.add({
      contentType: 'totp_provisioning', displayTitle: 'Example', displaySubtitle: 'user@example.com',
      safeValue: 'Authenticator: Example / user@example.com', isFavorite: false, source: 'camera',
      metadata: { algorithm: 'SHA1', digits: 6, period: 30 },
    });

    const insert = statements.find(({ sql }) => sql.includes('INSERT INTO scan_history'));
    expect(insert).toBeDefined();
    expect(JSON.stringify(insert)).not.toContain('otpauth://');
    expect(JSON.stringify(insert)).not.toContain('JBSWY3DPEHPK3PXP');
  });
});
