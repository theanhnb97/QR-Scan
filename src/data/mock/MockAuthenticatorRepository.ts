import { AuthenticatorRepository, SecureCredentialStore } from '../../domain/interfaces';
import { AuthenticatorAccount } from '../../domain/models/AuthenticatorAccount';

export class MockAuthenticatorRepository implements AuthenticatorRepository {
  private accounts: AuthenticatorAccount[] = [];

  constructor(private secureStore: SecureCredentialStore) {}

  async getAllAccounts(): Promise<AuthenticatorAccount[]> {
    return [...this.accounts].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getAccountById(id: string): Promise<AuthenticatorAccount | null> {
    const acc = this.accounts.find(a => a.id === id);
    return acc ? { ...acc } : null;
  }

  async saveAccount(
    input: Omit<AuthenticatorAccount, 'id' | 'createdAt' | 'updatedAt' | 'credentialId'>,
    secret: string
  ): Promise<AuthenticatorAccount> {
    const id = 'auth_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const credentialId = 'cred_' + id;

    // Securely save secret in SecureCredentialStore
    await this.secureStore.saveSecret(credentialId, secret);

    const now = Date.now();
    const account: AuthenticatorAccount = {
      ...input,
      id,
      credentialId,
      createdAt: now,
      updatedAt: now,
      sortOrder: this.accounts.length,
    };

    this.accounts.push(account);
    return { ...account };
  }

  async deleteAccount(id: string): Promise<boolean> {
    const acc = this.accounts.find(a => a.id === id);
    if (!acc) return false;

    await this.secureStore.deleteSecret(acc.credentialId);
    this.accounts = this.accounts.filter(a => a.id !== id);
    return true;
  }

  async toggleFavorite(id: string): Promise<boolean> {
    const acc = this.accounts.find(a => a.id === id);
    if (!acc) return false;
    acc.isFavorite = !acc.isFavorite;
    acc.updatedAt = Date.now();
    return acc.isFavorite;
  }

  async updateAccount(id: string, patch: Pick<AuthenticatorAccount, 'issuer' | 'accountName' | 'label'>): Promise<AuthenticatorAccount | null> {
    const account = this.accounts.find((item) => item.id === id);
    if (!account) return null;
    Object.assign(account, patch, { updatedAt: Date.now() });
    return { ...account };
  }
}
