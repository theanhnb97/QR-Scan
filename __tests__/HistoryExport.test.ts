import { historyAsCsv, historyAsJson } from '../src/services/history/HistoryExportService';

const item = {
  id: 'hist_1',
  contentType: 'totp_provisioning' as const,
  displayTitle: 'Example',
  displaySubtitle: 'alice@example.com',
  safeValue: 'Authenticator: Example / alice@example.com',
  createdAt: 1,
  isFavorite: false,
  source: 'camera' as const,
  metadata: { algorithm: 'SHA1' },
};

test('history export contains only safe fields', () => {
  const csv = historyAsCsv([item]);
  const json = historyAsJson([item]);
  expect(csv).toContain('contentType,displayTitle');
  expect(csv).not.toContain('metadata');
  expect(json).toContain('Authenticator: Example / alice@example.com');
  expect(json).not.toContain('metadata');
  expect(json).not.toContain('secret');
});

test('CSV escapes commas and quotes', () => {
  const value = { ...item, displaySubtitle: 'A, "quoted" value' };
  expect(historyAsCsv([value])).toContain('"A, ""quoted"" value"');
});
