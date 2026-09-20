import { RfcTotpGenerator } from '../src/domain/otp/RfcTotpGenerator';
import { decodeBase32, encodeBase32 } from '../src/domain/otp/Base32';

describe('Base32 RFC 4648 encoding & decoding', () => {
  it('encodes and decodes ascii strings correctly', () => {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const testVector = 'Hello QR Scan!';
    const encoded = encodeBase32(encoder.encode(testVector));
    const decodedBytes = decodeBase32(encoded);
    const decodedStr = decoder.decode(decodedBytes);

    expect(decodedStr).toEqual(testVector);
  });

  it('decodes standard RFC 4648 test vector: JBSWY3DPEHPK3PXP', () => {
    const decoded = decodeBase32('JBSWY3DPEHPK3PXP');
    expect(decoded.length).toBe(10);
    // 'JBSWY3DPEE======' is 'Hello!' (6 bytes: 0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x21)
    // JBSWY3DPEHPK3PXP is 10 bytes: 0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x21, 0xde, 0xad, 0xbe, 0xef
    expect(Array.from(decoded)).toEqual([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x21, 0xde, 0xad, 0xbe, 0xef]);
  });

  it('handles spaces and lowercase gracefully', () => {
    const raw = 'jbsw y3dp ehpk 3pxp';
    const decoded = decodeBase32(raw);
    expect(decoded.length).toBe(10);
  });
});

describe('RFC 4226 & RFC 6238 TOTP test vectors', () => {
  // Secret: '12345678901234567890' (ASCII 20 bytes) -> Base32: 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'
  const rfcSecretBase32 = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

  // RFC 6238 test vectors with SHA-1, 8 digits (or 6 digits standard)
  it('generates correct OTP for T=59s (counter=1)', () => {
    const otp = RfcTotpGenerator.generateTotp(rfcSecretBase32, 59 * 1000, 30, 8);
    // RFC 6238 specifies 94287082 for T=59
    expect(otp).toBe('94287082');
  });

  it('generates correct 6-digit OTP for standard T=59s', () => {
    const otp = RfcTotpGenerator.generateTotp(rfcSecretBase32, 59 * 1000, 30, 6);
    expect(otp).toBe('287082');
  });

  it('generates correct OTP for T=1111111109s', () => {
    // RFC 6238 Table 1: T=1111111109 -> TOTP: 07081804 (8 digits)
    const otp = RfcTotpGenerator.generateTotp(rfcSecretBase32, 1111111109 * 1000, 30, 8);
    expect(otp).toBe('07081804');
  });

  it('generates correct OTP for T=1111111111s', () => {
    // RFC 6238 Table 1: T=1111111111 -> TOTP: 14050471 (8 digits)
    const otp = RfcTotpGenerator.generateTotp(rfcSecretBase32, 1111111111 * 1000, 30, 8);
    expect(otp).toBe('14050471');
  });

  it('supports the RFC 6238 SHA-256 test vector', () => {
    const secret = encodeBase32(new TextEncoder().encode('12345678901234567890123456789012'));
    expect(RfcTotpGenerator.generateTotp(secret, 59 * 1000, 30, 8, 'SHA256')).toBe('46119246');
    expect(RfcTotpGenerator.generateTotp(secret, 1111111109 * 1000, 30, 8, 'SHA256')).toBe('68084774');
  });

  it('supports the RFC 6238 SHA-512 test vector', () => {
    const secret = encodeBase32(new TextEncoder().encode('1234567890123456789012345678901234567890123456789012345678901234'));
    expect(RfcTotpGenerator.generateTotp(secret, 59 * 1000, 30, 8, 'SHA512')).toBe('90693936');
    expect(RfcTotpGenerator.generateTotp(secret, 1111111109 * 1000, 30, 8, 'SHA512')).toBe('25091201');
  });

  it('calculates remaining seconds correctly from epoch', () => {
    // at t=59s, with period=30s, elapsed = 59 % 30 = 29s, remaining = 30 - 29 = 1s
    expect(RfcTotpGenerator.getRemainingSeconds(59 * 1000, 30)).toBe(1);
    // at t=60s, with period=30s, elapsed = 60 % 30 = 0s, remaining = 30 - 0 = 30s
    expect(RfcTotpGenerator.getRemainingSeconds(60 * 1000, 30)).toBe(30);
  });
});
