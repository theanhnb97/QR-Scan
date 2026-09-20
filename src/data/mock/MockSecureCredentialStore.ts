import { SecureCredentialStore } from '../../domain/interfaces';

export class MockSecureCredentialStore implements SecureCredentialStore {
  private secrets = new Map<string, string>();

  async saveSecret(credentialId: string, secret: string): Promise<void> {
    this.secrets.set(credentialId, secret);
  }

  async getSecret(credentialId: string): Promise<string | null> {
    return this.secrets.get(credentialId) ?? null;
  }

  async deleteSecret(credentialId: string): Promise<boolean> {
    return this.secrets.delete(credentialId);
  }

  async hasSecret(credentialId: string): Promise<boolean> {
    return this.secrets.has(credentialId);
  }

  clear(): void {
    this.secrets.clear();
  }
}
