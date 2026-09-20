import { encodeBase32 } from './Base32';
import type { OtpAlgorithm } from '../models/AuthenticatorAccount';
import type {
  HotpProvisioningTransientContent,
  TotpProvisioningTransientContent,
} from '../models/ScannedContent';

export type MigrationAccountTransientContent = TotpProvisioningTransientContent | HotpProvisioningTransientContent;

type OtpParameters = {
  secret: Uint8Array;
  name: string;
  issuer: string;
  algorithm: number;
  digits: number;
  type: number;
  counter: number;
};

class ProtoReader {
  private offset = 0;

  constructor(private readonly bytes: Uint8Array) {}

  get done(): boolean {
    return this.offset >= this.bytes.length;
  }

  readVarint(): number {
    let value = 0;
    let shift = 0;
    while (!this.done) {
      const byte = this.bytes[this.offset++];
      value += (byte & 0x7f) * 2 ** shift;
      if ((byte & 0x80) === 0) return value;
      shift += 7;
      if (shift > 49) throw new Error('Migration varint is too large');
    }
    throw new Error('Unexpected end of migration payload');
  }

  readBytes(): Uint8Array {
    const length = this.readVarint();
    const end = this.offset + length;
    if (!Number.isSafeInteger(length) || end > this.bytes.length) throw new Error('Invalid migration field length');
    const value = this.bytes.slice(this.offset, end);
    this.offset = end;
    return value;
  }

  skip(wireType: number): void {
    switch (wireType) {
      case 0:
        this.readVarint();
        return;
      case 1:
        this.offset += 8;
        break;
      case 2:
        this.offset += this.readVarint();
        break;
      case 5:
        this.offset += 4;
        break;
      default:
        throw new Error('Unsupported migration wire type');
    }
    if (this.offset > this.bytes.length) throw new Error('Invalid migration field');
  }
}

function decodeBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/').replace(/\s+/g, '');
  if (!normalized || /[^A-Za-z0-9+/=]/.test(normalized)) throw new Error('Invalid migration encoding');

  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const character of normalized.replace(/=+$/, '')) {
    const code = character.charCodeAt(0);
    const digit = code >= 65 && code <= 90
      ? code - 65
      : code >= 97 && code <= 122
        ? code - 97 + 26
        : code >= 48 && code <= 57
          ? code - 48 + 52
          : character === '+' ? 62 : 63;
    buffer = (buffer << 6) | digit;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >>> bits) & 0xff);
    }
  }
  return new Uint8Array(bytes);
}

function decodeUtf8(bytes: Uint8Array): string {
  let result = '';
  for (let index = 0; index < bytes.length;) {
    const first = bytes[index++];
    if (first < 0x80) {
      result += String.fromCharCode(first);
    } else if (first < 0xe0 && index < bytes.length) {
      result += String.fromCharCode(((first & 0x1f) << 6) | (bytes[index++] & 0x3f));
    } else if (first < 0xf0 && index + 1 < bytes.length) {
      const codePoint = ((first & 0x0f) << 12) | ((bytes[index++] & 0x3f) << 6) | (bytes[index++] & 0x3f);
      result += String.fromCharCode(codePoint);
    } else if (index + 2 < bytes.length) {
      const codePoint = ((first & 0x07) << 18) | ((bytes[index++] & 0x3f) << 12) | ((bytes[index++] & 0x3f) << 6) | (bytes[index++] & 0x3f);
      const adjusted = codePoint - 0x10000;
      result += String.fromCharCode(0xd800 + (adjusted >> 10), 0xdc00 + (adjusted & 0x3ff));
    }
  }
  return result;
}

function parseOtpParameters(bytes: Uint8Array): OtpParameters {
  const reader = new ProtoReader(bytes);
  const result: OtpParameters = { secret: new Uint8Array(), name: '', issuer: '', algorithm: 0, digits: 0, type: 0, counter: 0 };
  while (!reader.done) {
    const tag = reader.readVarint();
    const field = Math.floor(tag / 8);
    const wireType = tag % 8;
    switch (field) {
      case 1: if (wireType === 2) result.secret = reader.readBytes(); else reader.skip(wireType); break;
      case 2: if (wireType === 2) result.name = decodeUtf8(reader.readBytes()); else reader.skip(wireType); break;
      case 3: if (wireType === 2) result.issuer = decodeUtf8(reader.readBytes()); else reader.skip(wireType); break;
      case 4: if (wireType === 0) result.algorithm = reader.readVarint(); else reader.skip(wireType); break;
      case 5: if (wireType === 0) result.digits = reader.readVarint(); else reader.skip(wireType); break;
      case 6: if (wireType === 0) result.type = reader.readVarint(); else reader.skip(wireType); break;
      case 7: if (wireType === 0) result.counter = reader.readVarint(); else reader.skip(wireType); break;
      default: reader.skip(wireType);
    }
  }
  return result;
}

function parseLabel(name: string, issuer: string): { issuer: string; accountName: string } {
  const separator = name.indexOf(':');
  const parsedIssuer = issuer.trim() || (separator > 0 ? name.slice(0, separator).trim() : 'Unknown');
  const accountName = (separator > 0 ? name.slice(separator + 1) : name).trim() || 'Account';
  return { issuer: parsedIssuer, accountName };
}

function mapAlgorithm(value: number): OtpAlgorithm | null {
  if (value === 1) return 'SHA1';
  if (value === 2) return 'SHA256';
  if (value === 3) return 'SHA512';
  return null;
}

function parsePayload(bytes: Uint8Array, rawPayload: string): MigrationAccountTransientContent[] {
  const reader = new ProtoReader(bytes);
  const accounts: MigrationAccountTransientContent[] = [];
  while (!reader.done) {
    const tag = reader.readVarint();
    const field = Math.floor(tag / 8);
    const wireType = tag % 8;
    if (field === 1 && wireType === 2) {
      const item = parseOtpParameters(reader.readBytes());
      const algorithm = mapAlgorithm(item.algorithm);
      if (!algorithm || item.secret.length === 0 || (item.type !== 1 && item.type !== 2)) continue;
      const label = parseLabel(item.name, item.issuer);
      const secret = encodeBase32(item.secret).replace(/=+$/, '');
      if (item.type === 1) {
        accounts.push({ type: 'hotp_provisioning', rawPayload, issuer: label.issuer, accountName: label.accountName, secret, algorithm, digits: item.digits === 2 ? 8 : 6, counter: item.counter });
      } else {
        accounts.push({ type: 'totp_provisioning', rawPayload, issuer: label.issuer, accountName: label.accountName, secret, algorithm, digits: item.digits === 2 ? 8 : 6, period: 30 });
      }
    } else {
      reader.skip(wireType);
    }
  }
  return accounts;
}

export function parseGoogleAuthenticatorMigration(uri: string): MigrationAccountTransientContent[] | null {
  try {
    const match = uri.match(/^otpauth-migration:\/\/offline(?:\?([^#]*))?$/i);
    if (!match) return null;
    const dataParameter = match[1]?.split('&').find((parameter) => parameter.toLowerCase().startsWith('data='));
    const rawEncoded = dataParameter?.slice(5);
    if (!rawEncoded) return null;
    const encoded = decodeURIComponent(rawEncoded);
    if (!encoded) return null;
    const accounts = parsePayload(decodeBase64Url(encoded), uri);
    return accounts.length ? accounts : null;
  } catch {
    return null;
  }
}
