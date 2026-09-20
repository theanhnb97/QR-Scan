export type OtpAlgorithm = 'SHA1' | 'SHA256' | 'SHA512';

export interface AuthenticatorAccount {
  id: string;
  type: 'TOTP' | 'HOTP';
  issuer: string;
  accountName: string;
  label: string;
  algorithm: OtpAlgorithm;
  digits: number;
  period: number; // For TOTP (default 30s)
  counter?: number; // For HOTP
  credentialId: string; // Foreign key pointer to secure platform storage (Keychain / EncryptedKeystore)
  createdAt: number;
  updatedAt: number;
  isFavorite: boolean;
  sortOrder: number;
}

export interface AuthenticatorAccountWithCode extends AuthenticatorAccount {
  currentCode: string;
  secondsRemaining: number;
  progress: number; // 0.0 to 1.0
}

