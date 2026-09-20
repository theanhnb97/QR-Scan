import type { AuthenticatorRepository, SecureCredentialStore } from '../../domain/interfaces';
import type { AuthenticatorAccount } from '../../domain/models/AuthenticatorAccount';
import { SqliteDatabase } from './SqliteDatabase';

type AccountRow = {
  id: string;
  type: AuthenticatorAccount['type'];
  issuer: string;
  account_name: string;
  label: string;
  algorithm: AuthenticatorAccount['algorithm'];
  digits: number;
  period: number;
  counter: number | null;
  credential_id: string;
  created_at: number;
  updated_at: number;
  is_favorite: number;
  sort_order: number;
};

function fromRow(row: AccountRow): AuthenticatorAccount {
  return {
    id: row.id,
    type: row.type,
    issuer: row.issuer,
    accountName: row.account_name,
    label: row.label,
    algorithm: row.algorithm,
    digits: Number(row.digits),
    period: Number(row.period),
    counter: row.counter == null ? undefined : Number(row.counter),
    credentialId: row.credential_id,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
    isFavorite: row.is_favorite === 1,
    sortOrder: Number(row.sort_order),
  };
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export class SqliteAuthenticatorRepository implements AuthenticatorRepository {
  constructor(
    private readonly database: SqliteDatabase,
    private readonly secureStore: SecureCredentialStore,
  ) {}

  async getAllAccounts(): Promise<AuthenticatorAccount[]> {
    const db = await this.database.get();
    const result = await db.execute('SELECT * FROM authenticator_accounts ORDER BY sort_order ASC, created_at ASC');
    return result.rows.map((row) => fromRow(row as unknown as AccountRow));
  }

  async getAccountById(id: string): Promise<AuthenticatorAccount | null> {
    const db = await this.database.get();
    const result = await db.execute('SELECT * FROM authenticator_accounts WHERE id = ? LIMIT 1', [id]);
    return result.rows.length ? fromRow(result.rows[0] as unknown as AccountRow) : null;
  }

  async saveAccount(
    input: Omit<AuthenticatorAccount, 'id' | 'createdAt' | 'updatedAt' | 'credentialId'>,
    secret: string,
  ): Promise<AuthenticatorAccount> {
    const id = makeId('auth');
    const credentialId = `cred_${id}`;
    const now = Date.now();
    const account: AuthenticatorAccount = { ...input, id, credentialId, createdAt: now, updatedAt: now };

    // Write the secret first; normal SQLite metadata never contains it.
    await this.secureStore.saveSecret(credentialId, secret);
    try {
      const db = await this.database.get();
      await db.execute(
        `INSERT INTO authenticator_accounts
         (id, type, issuer, account_name, label, algorithm, digits, period, counter, credential_id, created_at, updated_at, is_favorite, sort_order)
         SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(MAX(sort_order) + 1, 0)
         FROM authenticator_accounts`,
        [
          account.id,
          account.type,
          account.issuer,
          account.accountName,
          account.label,
          account.algorithm,
          account.digits,
          account.period,
          account.counter ?? null,
          account.credentialId,
          account.createdAt,
          account.updatedAt,
          account.isFavorite ? 1 : 0,
        ],
      );
    } catch (error) {
      await this.secureStore.deleteSecret(credentialId);
      throw error;
    }
    return account;
  }

  async deleteAccount(id: string): Promise<boolean> {
    const account = await this.getAccountById(id);
    if (!account) return false;
    const db = await this.database.get();
    const result = await db.execute('DELETE FROM authenticator_accounts WHERE id = ?', [id]);
    await this.secureStore.deleteSecret(account.credentialId);
    return result.rowsAffected > 0;
  }

  async toggleFavorite(id: string): Promise<boolean> {
    const db = await this.database.get();
    const existing = await db.execute('SELECT is_favorite FROM authenticator_accounts WHERE id = ? LIMIT 1', [id]);
    if (!existing.rows.length) return false;
    const nextValue = Number(existing.rows[0].is_favorite) === 1 ? 0 : 1;
    await db.execute('UPDATE authenticator_accounts SET is_favorite = ?, updated_at = ? WHERE id = ?', [nextValue, Date.now(), id]);
    return nextValue === 1;
  }

  async updateAccount(id: string, patch: Pick<AuthenticatorAccount, 'issuer' | 'accountName' | 'label'>): Promise<AuthenticatorAccount | null> {
    const db = await this.database.get();
    const result = await db.execute(
      'UPDATE authenticator_accounts SET issuer = ?, account_name = ?, label = ?, updated_at = ? WHERE id = ?',
      [patch.issuer, patch.accountName, patch.label, Date.now(), id],
    );
    if (result.rowsAffected === 0) return null;
    return this.getAccountById(id);
  }
}
