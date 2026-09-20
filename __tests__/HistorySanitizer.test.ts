import { toSafeHistoryInput } from '../src/domain/history/HistorySanitizer';

describe('History sanitizer', () => {
  it('never persists a Wi-Fi password', () => {
    const item = toSafeHistoryInput(
      {
        type: 'wifi',
        rawPayload: 'WIFI:T:WPA;S:Home;P:super-secret;;',
        ssid: 'Home',
        encryption: 'WPA',
        password: 'super-secret',
      },
      'camera',
    );

    expect(item.safeValue).toBe('Wi-Fi network: Home');
    expect(item.safeValue).not.toContain('super-secret');
  });

  it('never persists an otpauth secret', () => {
    const item = toSafeHistoryInput(
      {
        type: 'totp_provisioning',
        rawPayload: 'otpauth://totp/Example:alice?secret=JBSWY3DPEHPK3PXP',
        issuer: 'Example',
        accountName: 'alice',
        secret: 'JBSWY3DPEHPK3PXP',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
      },
      'camera',
    );

    expect(item.safeValue).toBe('Authenticator: Example / alice');
    expect(item.safeValue).not.toContain('JBSWY3DPEHPK3PXP');
    expect(item.safeValue).not.toContain('otpauth://');
  });

  it('stores only migration metadata, never migration secrets or payloads', () => {
    const item = toSafeHistoryInput(
      {
        type: 'totp_migration',
        rawPayload: 'otpauth-migration://offline?data=secret-payload',
        accounts: [{
          type: 'totp_provisioning',
          rawPayload: 'otpauth-migration://offline?data=secret-payload',
          issuer: 'GitHub',
          accountName: 'alice',
          secret: 'AEBAGBAFAYDQQCI',
          algorithm: 'SHA1',
          digits: 6,
          period: 30,
        }],
      },
      'camera',
    );

    expect(item.safeValue).toBe('Authenticator import: 1 accounts');
    expect(item.safeValue).not.toContain('secret-payload');
    expect(item.safeValue).not.toContain('AEBAGBAFAYDQQCI');
  });
});
