import { DefaultContentParser } from '../src/domain/parsers/ContentParser';

function varint(value: number): number[] {
  const bytes: number[] = [];
  let next = value;
  do {
    const byte = next % 128;
    next = Math.floor(next / 128);
    bytes.push(byte | (next ? 0x80 : 0));
  } while (next);
  return bytes;
}

function fieldBytes(fieldNumber: number, value: Uint8Array): number[] {
  return [...varint(fieldNumber * 8 + 2), ...varint(value.length), ...value];
}

function fieldString(fieldNumber: number, value: string): number[] {
  return fieldBytes(fieldNumber, Uint8Array.from(value.split('').map((character) => character.charCodeAt(0))));
}

function fieldVarint(fieldNumber: number, value: number): number[] {
  return [...varint(fieldNumber * 8), ...varint(value)];
}

function migrationUri(): string {
  const otp = [
    ...fieldBytes(1, Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])),
    ...fieldString(2, 'GitHub:alice'),
    ...fieldString(3, 'GitHub'),
    ...fieldVarint(4, 1),
    ...fieldVarint(5, 1),
    ...fieldVarint(6, 2),
  ];
  const payload = fieldBytes(1, Uint8Array.from(otp));
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let encoded = '';
  let buffer = 0;
  let bits = 0;
  for (const byte of payload) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 6) {
      bits -= 6;
      encoded += alphabet[(buffer >>> bits) & 63];
    }
  }
  if (bits > 0) encoded += alphabet[(buffer << (6 - bits)) & 63];
  return `otpauth-migration://offline?data=${encoded}`;
}

describe('DefaultContentParser unit tests', () => {
  const parser = new DefaultContentParser();

  it('parses plain text', () => {
    const res = parser.parse('Hello World');
    expect(res.type).toBe('text');
    if (res.type === 'text') {
      expect(res.text).toBe('Hello World');
    }
  });

  it('parses URL', () => {
    const res = parser.parse('https://example.com/test?a=1');
    expect(res.type).toBe('url');
    if (res.type === 'url') {
      expect(res.url).toBe('https://example.com/test?a=1');
      expect(res.domain).toBe('example.com');
    }
  });

  it('parses Wi-Fi QR code', () => {
    const res = parser.parse('WIFI:T:WPA;S:HomeNetwork;P:SecretPass123;H:false;;');
    expect(res.type).toBe('wifi');
    if (res.type === 'wifi') {
      expect(res.ssid).toBe('HomeNetwork');
      expect(res.encryption).toBe('WPA');
      expect(res.password).toBe('SecretPass123');
      expect(res.hidden).toBe(false);
    }
  });

  it('unescapes generated Wi-Fi fields', () => {
    const res = parser.parse('WIFI:T:WPA;S:Office\\;Guest;P:p\\:ss\\\\word;;');
    expect(res.type).toBe('wifi');
    if (res.type === 'wifi') {
      expect(res.ssid).toBe('Office;Guest');
      expect(res.password).toBe('p:ss\\word');
    }
  });

  it('parses TOTP URI into transient provisioning model', () => {
    const res = parser.parse('otpauth://totp/GitHub:alice?secret=JBSWY3DPEHPK3PXP&issuer=GitHub&digits=6&period=30');
    expect(res.type).toBe('totp_provisioning');
    if (res.type === 'totp_provisioning') {
      expect(res.issuer).toBe('GitHub');
      expect(res.accountName).toBe('alice');
      expect(res.secret).toBe('JBSWY3DPEHPK3PXP');
      expect(res.digits).toBe(6);
      expect(res.period).toBe(30);
      expect(res.algorithm).toBe('SHA1');
    }
  });

  it('parses Google Authenticator migration QR into transient accounts', () => {
    const res = parser.parse(migrationUri());
    expect(res.type).toBe('totp_migration');
    if (res.type === 'totp_migration') {
      expect(res.accounts).toHaveLength(1);
      expect(res.accounts[0]).toMatchObject({
        type: 'totp_provisioning',
        issuer: 'GitHub',
        accountName: 'alice',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
      });
      expect(res.accounts[0].secret).toBe('AEBAGBAFAYDQQCIK');
    }
  });

  it('parses URL-encoded migration data with additional query parameters', () => {
    const uri = migrationUri();
    const [prefix, encoded] = uri.split('?data=');
    const encodedFirstCharacter = `%${encoded.charCodeAt(0).toString(16).padStart(2, '0')}${encoded.slice(1)}`;
    const res = parser.parse(`${prefix}?data=${encodedFirstCharacter}&source=google`);
    expect(res.type).toBe('totp_migration');
  });

  it('parses mailto URL', () => {
    const res = parser.parse('mailto:support@example.com?subject=Help&body=Please');
    expect(res.type).toBe('email');
    if (res.type === 'email') {
      expect(res.recipient).toBe('support@example.com');
      expect(res.subject).toBe('Help');
      expect(res.body).toBe('Please');
    }
  });

  it('parses phone numbers', () => {
    const res = parser.parse('tel:+15551234567');
    expect(res.type).toBe('phone');
    if (res.type === 'phone') {
      expect(res.phoneNumber).toBe('+15551234567');
    }
  });

  it('parses SMS', () => {
    const res = parser.parse('smsto:+15551234567:Hello%20There');
    expect(res.type).toBe('sms');
    if (res.type === 'sms') {
      expect(res.phoneNumber).toBe('+15551234567');
      expect(res.message).toBe('Hello There');
    }
  });

  it('parses vCard contact', () => {
    const vcard = ['BEGIN:VCARD', 'VERSION:3.0', 'FN:Jane Doe', 'TEL:+123456789', 'EMAIL:jane@example.com', 'END:VCARD'].join('\n');
    const res = parser.parse(vcard);
    expect(res.type).toBe('contact');
    if (res.type === 'contact') {
      expect(res.name).toBe('Jane Doe');
      expect(res.phone).toBe('+123456789');
      expect(res.email).toBe('jane@example.com');
    }
  });

  it('parses Geo location', () => {
    const res = parser.parse('geo:37.7749,-122.4194');
    expect(res.type).toBe('location');
    if (res.type === 'location') {
      expect(res.latitude).toBeCloseTo(37.7749);
      expect(res.longitude).toBeCloseTo(-122.4194);
    }
  });
});
