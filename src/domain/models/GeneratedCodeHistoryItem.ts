export interface GeneratedCodeHistoryItem {
  id: string;
  mode: 'qr' | 'barcode';
  kind: 'text' | 'url' | 'wifi' | 'email' | 'phone' | null;
  payload: string | null;
  displayValue: string;
  createdAt: number;
}
