import { decodeBase32 } from './Base32';
import type { AuthenticatorAccount } from '../models/AuthenticatorAccount';

export type MigrationExportEntry = {
  account: AuthenticatorAccount;
  secret: string;
};

const MAX_MIGRATION_URI_LENGTH = 1800;

function encodeVarint(value: number): number[] {
  const bytes: number[] = [];
  let next = Math.max(0, Math.floor(value));
  do {
    const byte = next % 128;
    next = Math.floor(next / 128);
    bytes.push(byte | (next ? 0x80 : 0));
  } while (next);
  return bytes;
}

function encodeUtf8(value: string): Uint8Array {
  const bytes: number[] = [];
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    if (codePoint <= 0x7f) {
      bytes.push(codePoint);
    } else if (codePoint <= 0x7ff) {
      bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f));
    } else if (codePoint <= 0xffff) {
      bytes.push(0xe0 | (codePoint >> 12), 0x80 | ((codePoint >> 6) & 0x3f), 0x80 | (codePoint & 0x3f));
    } else {
      bytes.push(0xf0 | (codePoint >> 18), 0x80 | ((codePoint >> 12) & 0x3f), 0x80 | ((codePoint >> 6) & 0x3f), 0x80 | (codePoint & 0x3f));
    }
  }
  return new Uint8Array(bytes);
}

function fieldBytes(fieldNumber: number, value: Uint8Array): number[] {
  return [...encodeVarint(fieldNumber * 8 + 2), ...encodeVarint(value.length), ...value];
}

function fieldString(fieldNumber: number, value: string): number[] {
  return fieldBytes(fieldNumber, encodeUtf8(value));
}

function fieldVarint(fieldNumber: number, value: number): number[] {
  return [...encodeVarint(fieldNumber * 8), ...encodeVarint(value)];
}

function mapAlgorithm(value: AuthenticatorAccount['algorithm']): number {
  if (value === 'SHA256') return 2;
  if (value === 'SHA512') return 3;
  return 1;
}

function encodeOtpParameters(entry: MigrationExportEntry): Uint8Array {
  const { account } = entry;
  const secret = decodeBase32(entry.secret.replace(/\s+/g, '').toUpperCase());
  const label = `${account.issuer}: ${account.accountName}`;
  const bytes = [
    ...fieldBytes(1, secret),
    ...fieldString(2, label),
    ...fieldString(3, account.issuer),
    ...fieldVarint(4, mapAlgorithm(account.algorithm)),
    ...fieldVarint(5, account.digits === 8 ? 2 : 1),
    ...fieldVarint(6, account.type === 'HOTP' ? 1 : 2),
  ];
  if (account.type === 'HOTP') bytes.push(...fieldVarint(7, account.counter ?? 0));
  return new Uint8Array(bytes);
}

function encodeMigrationPayload(entries: MigrationExportEntry[], batchSize: number, batchIndex: number, batchId: number): Uint8Array {
  const bytes: number[] = [];
  for (const entry of entries) bytes.push(...fieldBytes(1, encodeOtpParameters(entry)));
  bytes.push(...fieldVarint(2, 1), ...fieldVarint(3, batchSize), ...fieldVarint(4, batchIndex), ...fieldVarint(5, batchId));
  return new Uint8Array(bytes);
}

function encodeBase64Url(bytes: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let output = '';
  let buffer = 0;
  let bits = 0;
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 6) {
      bits -= 6;
      output += alphabet[(buffer >>> bits) & 63];
    }
  }
  if (bits > 0) output += alphabet[(buffer << (6 - bits)) & 63];
  return output;
}

function makeUri(entries: MigrationExportEntry[], batchSize: number, batchIndex: number, batchId: number): string {
  return `otpauth-migration://offline?data=${encodeBase64Url(encodeMigrationPayload(entries, batchSize, batchIndex, batchId))}`;
}

/** Builds Google Authenticator-compatible migration QR payloads without persisting secrets. */
export function buildGoogleAuthenticatorMigrationUris(entries: MigrationExportEntry[]): string[] {
  if (entries.length === 0) return [];
  const batchId = Math.floor(Date.now() / 1000) % 2147483647;
  const chunks: MigrationExportEntry[][] = [];
  let current: MigrationExportEntry[] = [];

  for (const entry of entries) {
    const candidate = [...current, entry];
    if (current.length > 0 && makeUri(candidate, 1, 0, batchId).length > MAX_MIGRATION_URI_LENGTH) {
      chunks.push(current);
      current = [entry];
    } else {
      current = candidate;
    }
  }
  if (current.length > 0) chunks.push(current);

  return chunks.map((chunk, index) => makeUri(chunk, chunks.length, index, batchId));
}
