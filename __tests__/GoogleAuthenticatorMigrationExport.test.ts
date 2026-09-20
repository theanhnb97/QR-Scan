import { DefaultContentParser } from '../src/domain/parsers/ContentParser';
import { buildGoogleAuthenticatorMigrationUris } from '../src/domain/otp/GoogleAuthenticatorMigrationExport';
import type { AuthenticatorAccount } from '../src/domain/models/AuthenticatorAccount';

function account(overrides: Partial<AuthenticatorAccount> = {}): AuthenticatorAccount {
  return {
    id: 'account-id',
    type: 'TOTP',
    issuer: 'GitHub',
    accountName: 'alice@example.com',
    label: 'GitHub: alice@example.com',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    credentialId: 'credential-id',
    createdAt: 1,
    updatedAt: 1,
    isFavorite: false,
    sortOrder: 0,
    ...overrides,
  };
}

describe('Google Authenticator migration export', () => {
  it('builds migration QR data that the app parser can read back', () => {
    const uris = buildGoogleAuthenticatorMigrationUris([
      { account: account(), secret: 'JBSWY3DPEHPK3PXP' },
      {
        account: account({
          id: 'hotp-id',
          type: 'HOTP',
          issuer: 'Internal',
          accountName: 'deploy',
          label: 'Internal: deploy',
          algorithm: 'SHA512',
          digits: 8,
          counter: 12,
        }),
        secret: 'MFRGGZDFMZTWQ2LK',
      },
    ]);

    expect(uris).toHaveLength(1);
    const parsed = new DefaultContentParser().parse(uris[0]);
    expect(parsed.type).toBe('totp_migration');
    if (parsed.type === 'totp_migration') {
      expect(parsed.accounts).toEqual([
        expect.objectContaining({
          type: 'totp_provisioning',
          issuer: 'GitHub',
          accountName: 'alice@example.com',
          algorithm: 'SHA1',
          digits: 6,
          period: 30,
          secret: 'JBSWY3DPEHPK3PXP',
        }),
        expect.objectContaining({
          type: 'hotp_provisioning',
          issuer: 'Internal',
          accountName: 'deploy',
          algorithm: 'SHA512',
          digits: 8,
          counter: 12,
          secret: 'MFRGGZDFMZTWQ2LK',
        }),
      ]);
    }
  });

  it('splits large exports into individually readable migration QR payloads', () => {
    const entries = Array.from({ length: 40 }, (_, index) => ({
      account: account({
        id: 'account-' + index,
        accountName: 'user-' + index + '-' + 'x'.repeat(80),
        label: 'GitHub: user-' + index + '-' + 'x'.repeat(80),
      }),
      secret: 'JBSWY3DPEHPK3PXP',
    }));

    const uris = buildGoogleAuthenticatorMigrationUris(entries);
    expect(uris.length).toBeGreaterThan(1);
    for (const uri of uris) {
      expect(uri.length).toBeLessThanOrEqual(1800);
      expect(new DefaultContentParser().parse(uri).type).toBe('totp_migration');
    }
  });
});
