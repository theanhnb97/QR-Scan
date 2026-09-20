import { ScannedContentType } from './ScannedContent';

export interface ScanHistoryItem {
  id: string;
  contentType: ScannedContentType;
  displayTitle: string;
  displaySubtitle: string;
  safeValue: string; // Sanitized content - NEVER contains TOTP secrets or Wi-Fi passwords
  createdAt: number;
  lastOpenedAt?: number;
  isFavorite: boolean;
  source: 'camera' | 'image_picker' | 'manual';
  metadata?: Record<string, string | number | boolean>;
  relatedAuthenticatorAccountId?: string;
}

export type CreateHistoryInput = Omit<ScanHistoryItem, 'id' | 'createdAt'>;

