export type ScannedContentType =
  | 'text'
  | 'url'
  | 'wifi'
  | 'email'
  | 'phone'
  | 'sms'
  | 'contact'
  | 'location'
  | 'calendar_event'
  | 'totp_provisioning'
  | 'hotp_provisioning'
  | 'totp_migration'
  | 'product_barcode'
  | 'isbn'
  | 'generic_barcode'
  | 'unsupported';

export interface BaseScannedContent {
  type: ScannedContentType;
  rawPayload: string;
}

export interface TextScannedContent extends BaseScannedContent {
  type: 'text';
  text: string;
}

export interface UrlScannedContent extends BaseScannedContent {
  type: 'url';
  url: string;
  domain: string;
}

export interface WifiScannedContent extends BaseScannedContent {
  type: 'wifi';
  ssid: string;
  encryption: 'WPA' | 'WEP' | 'nopass' | 'WPA2' | 'WPA3' | string;
  password?: string;
  hidden?: boolean;
}

export interface EmailScannedContent extends BaseScannedContent {
  type: 'email';
  recipient: string;
  subject?: string;
  body?: string;
}

export interface PhoneScannedContent extends BaseScannedContent {
  type: 'phone';
  phoneNumber: string;
}

export interface SmsScannedContent extends BaseScannedContent {
  type: 'sms';
  phoneNumber: string;
  message?: string;
}

export interface ContactScannedContent extends BaseScannedContent {
  type: 'contact';
  name: string;
  phone?: string;
  email?: string;
  organization?: string;
}

export interface LocationScannedContent extends BaseScannedContent {
  type: 'location';
  latitude: number;
  longitude: number;
}

export interface CalendarScannedContent extends BaseScannedContent {
  type: 'calendar_event';
  title: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  description?: string;
}

export interface TotpProvisioningTransientContent extends BaseScannedContent {
  type: 'totp_provisioning';
  issuer: string;
  accountName: string;
  secret: string; // Transient in memory only; never persisted to normal DB
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  digits: number;
  period: number;
}

export interface HotpProvisioningTransientContent extends BaseScannedContent {
  type: 'hotp_provisioning';
  issuer: string;
  accountName: string;
  secret: string; // Transient in memory only
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  digits: number;
  counter: number;
}

export interface TotpMigrationTransientContent extends BaseScannedContent {
  type: 'totp_migration';
  accounts: Array<TotpProvisioningTransientContent | HotpProvisioningTransientContent>;
}

export interface BarcodeScannedContent extends BaseScannedContent {
  type: 'product_barcode' | 'isbn' | 'generic_barcode';
  format: string;
  code: string;
}

export interface UnsupportedScannedContent extends BaseScannedContent {
  type: 'unsupported';
  errorHint?: string;
}

export type ScannedContent =
  | TextScannedContent
  | UrlScannedContent
  | WifiScannedContent
  | EmailScannedContent
  | PhoneScannedContent
  | SmsScannedContent
  | ContactScannedContent
  | LocationScannedContent
  | CalendarScannedContent
  | TotpProvisioningTransientContent
  | HotpProvisioningTransientContent
  | TotpMigrationTransientContent
  | BarcodeScannedContent
  | UnsupportedScannedContent;
