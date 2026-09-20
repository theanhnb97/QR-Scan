import { ScannedContent } from './models/ScannedContent';

export interface ContentParser {
  parse(rawPayload: string): ScannedContent;
}

export interface ScanDetection {
  value: string;
  format: string;
}

export interface ImageCodeDecoder {
  decode(uri: string): Promise<ScanDetection[]>;
}

export interface HistoryRepository {
  getAll(): Promise<import('./models/ScanHistoryItem').ScanHistoryItem[]>;
  getById(id: string): Promise<import('./models/ScanHistoryItem').ScanHistoryItem | null>;
  add(item: import('./models/ScanHistoryItem').CreateHistoryInput): Promise<import('./models/ScanHistoryItem').ScanHistoryItem>;
  delete(id: string): Promise<boolean>;
  clearAll(): Promise<void>;
  toggleFavorite(id: string): Promise<boolean>;
  linkAuthenticator(id: string, accountId: string): Promise<boolean>;
}

export interface SecureCredentialStore {
  saveSecret(credentialId: string, secret: string): Promise<void>;
  getSecret(credentialId: string): Promise<string | null>;
  deleteSecret(credentialId: string): Promise<boolean>;
  hasSecret(credentialId: string): Promise<boolean>;
}

export interface BiometricService {
  isAvailable(): Promise<boolean>;
  authenticate(reason: string): Promise<boolean>;
}

export interface AuthenticatorRepository {
  getAllAccounts(): Promise<import('./models/AuthenticatorAccount').AuthenticatorAccount[]>;
  getAccountById(id: string): Promise<import('./models/AuthenticatorAccount').AuthenticatorAccount | null>;
  saveAccount(
    account: Omit<import('./models/AuthenticatorAccount').AuthenticatorAccount, 'id' | 'createdAt' | 'updatedAt' | 'credentialId'>,
    secret: string
  ): Promise<import('./models/AuthenticatorAccount').AuthenticatorAccount>;
  deleteAccount(id: string): Promise<boolean>;
  toggleFavorite(id: string): Promise<boolean>;
  updateAccount(id: string, patch: Pick<import('./models/AuthenticatorAccount').AuthenticatorAccount, 'issuer' | 'accountName' | 'label'>): Promise<import('./models/AuthenticatorAccount').AuthenticatorAccount | null>;
}

export interface OtpGenerator {
  generateTotp(secret: string, timestampMs?: number, period?: number, digits?: number, algorithm?: import('./models/AuthenticatorAccount').OtpAlgorithm): string;
  generateHotp(secret: string, counter: number, digits?: number, algorithm?: import('./models/AuthenticatorAccount').OtpAlgorithm): string;
  getRemainingSeconds(timestampMs?: number, period?: number): number;
}

export interface GeneratedHistoryRepository {
  getAll(): Promise<import('./models/GeneratedCodeHistoryItem').GeneratedCodeHistoryItem[]>;
  add(input: Omit<import('./models/GeneratedCodeHistoryItem').GeneratedCodeHistoryItem, 'id' | 'createdAt'>): Promise<import('./models/GeneratedCodeHistoryItem').GeneratedCodeHistoryItem>;
}
