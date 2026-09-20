import { CreateHistoryInput } from '../models/ScanHistoryItem';
import { ScannedContent } from '../models/ScannedContent';

const MAX_PREVIEW_LENGTH = 240;

function preview(value: string): string {
  const compact = value.replace(/\s+/g, ' ').trim();
  return compact.length > MAX_PREVIEW_LENGTH ? `${compact.slice(0, MAX_PREVIEW_LENGTH - 1)}…` : compact;
}

/** Converts parsed content into history data without persisting secret material. */
export function toSafeHistoryInput(content: ScannedContent, source: CreateHistoryInput['source']): CreateHistoryInput {
  switch (content.type) {
    case 'text':
      return {
        contentType: content.type,
        displayTitle: 'Text',
        displaySubtitle: preview(content.text) || 'Empty text',
        safeValue: preview(content.text),
        isFavorite: false,
        source,
      };
    case 'url':
      return {
        contentType: content.type,
        displayTitle: content.domain,
        displaySubtitle: content.url.startsWith('https://') ? 'HTTPS link' : 'HTTP link',
        safeValue: content.url,
        isFavorite: false,
        source,
      };
    case 'wifi':
      return {
        contentType: content.type,
        displayTitle: content.ssid || 'Wi-Fi network',
        displaySubtitle: content.encryption,
        safeValue: `Wi-Fi network: ${content.ssid}`,
        isFavorite: false,
        source,
        metadata: { hidden: Boolean(content.hidden) },
      };
    case 'totp_provisioning':
      return {
        contentType: content.type,
        displayTitle: content.issuer,
        displaySubtitle: content.accountName,
        safeValue: `Authenticator: ${content.issuer} / ${content.accountName}`,
        isFavorite: false,
        source,
        metadata: { algorithm: content.algorithm, digits: content.digits, period: content.period },
      };
    case 'hotp_provisioning':
      return {
        contentType: content.type,
        displayTitle: content.issuer,
        displaySubtitle: content.accountName,
        safeValue: `Authenticator: ${content.issuer} / ${content.accountName}`,
        isFavorite: false,
        source,
        metadata: { algorithm: content.algorithm, digits: content.digits, counter: content.counter },
      };
    case 'totp_migration':
      return {
        contentType: content.type,
        displayTitle: 'Authenticator import',
        displaySubtitle: `${content.accounts.length} accounts`,
        safeValue: `Authenticator import: ${content.accounts.length} accounts`,
        isFavorite: false,
        source,
        metadata: { accountCount: content.accounts.length },
      };
    case 'email':
      return {
        contentType: content.type,
        displayTitle: content.recipient,
        displaySubtitle: content.subject || 'Email address',
        safeValue: content.recipient,
        isFavorite: false,
        source,
      };
    case 'phone':
      return {
        contentType: content.type,
        displayTitle: content.phoneNumber,
        displaySubtitle: 'Phone number',
        safeValue: content.phoneNumber,
        isFavorite: false,
        source,
      };
    case 'sms':
      return {
        contentType: content.type,
        displayTitle: content.phoneNumber,
        displaySubtitle: content.message ? preview(content.message) : 'SMS number',
        safeValue: content.phoneNumber,
        isFavorite: false,
        source,
      };
    case 'contact':
      return {
        contentType: content.type,
        displayTitle: content.name,
        displaySubtitle: content.organization || content.email || content.phone || 'Contact',
        safeValue: content.name,
        isFavorite: false,
        source,
      };
    case 'location':
      return {
        contentType: content.type,
        displayTitle: 'Location',
        displaySubtitle: `${content.latitude}, ${content.longitude}`,
        safeValue: `${content.latitude},${content.longitude}`,
        isFavorite: false,
        source,
      };
    case 'calendar_event':
      return {
        contentType: content.type,
        displayTitle: content.title,
        displaySubtitle: content.startDate || 'Calendar event',
        safeValue: content.title,
        isFavorite: false,
        source,
      };
    case 'product_barcode':
    case 'isbn':
    case 'generic_barcode':
      return {
        contentType: content.type,
        displayTitle: content.code,
        displaySubtitle: content.format,
        safeValue: content.code,
        isFavorite: false,
        source,
      };
    case 'unsupported':
      return {
        contentType: content.type,
        displayTitle: 'Unsupported code',
        displaySubtitle: content.errorHint || 'Unsupported format',
        safeValue: '',
        isFavorite: false,
        source,
      };
  }
}
