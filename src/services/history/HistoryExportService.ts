import { ScanHistoryItem } from '../../domain/models/ScanHistoryItem';

const EXPORT_FIELDS: Array<keyof Pick<ScanHistoryItem, 'id' | 'contentType' | 'displayTitle' | 'displaySubtitle' | 'safeValue' | 'createdAt' | 'source' | 'isFavorite'>> = [
  'id', 'contentType', 'displayTitle', 'displaySubtitle', 'safeValue', 'createdAt', 'source', 'isFavorite',
];

function csvCell(value: string | number | boolean): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Exports only already-sanitized history fields; secrets cannot enter this format. */
export function historyAsCsv(items: ScanHistoryItem[]): string {
  const header = EXPORT_FIELDS.join(',');
  const rows = items.map((item) => EXPORT_FIELDS.map((field) => csvCell(item[field] as string | number | boolean)).join(','));
  return [header, ...rows].join('\n');
}

export function historyAsJson(items: ScanHistoryItem[]): string {
  const safeItems = items.map((item) => Object.fromEntries(EXPORT_FIELDS.map((field) => [field, item[field]])));
  return JSON.stringify(safeItems, null, 2);
}
