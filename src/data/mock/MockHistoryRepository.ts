import { HistoryRepository } from '../../domain/interfaces';
import { ScanHistoryItem, CreateHistoryInput } from '../../domain/models/ScanHistoryItem';

export class MockHistoryRepository implements HistoryRepository {
  private items: ScanHistoryItem[] = [];

  async getAll(): Promise<ScanHistoryItem[]> {
    return [...this.items].sort((a, b) => b.createdAt - a.createdAt);
  }

  async getById(id: string): Promise<ScanHistoryItem | null> {
    const found = this.items.find(item => item.id === id);
    return found ? { ...found } : null;
  }

  async add(input: CreateHistoryInput): Promise<ScanHistoryItem> {
    const newItem: ScanHistoryItem = {
      ...input,
      id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
      createdAt: Date.now(),
    };
    this.items.unshift(newItem);
    return { ...newItem };
  }

  async delete(id: string): Promise<boolean> {
    const initialLen = this.items.length;
    this.items = this.items.filter(item => item.id !== id);
    return this.items.length < initialLen;
  }

  async clearAll(): Promise<void> {
    this.items = [];
  }

  async toggleFavorite(id: string): Promise<boolean> {
    const item = this.items.find(i => i.id === id);
    if (!item) return false;
    item.isFavorite = !item.isFavorite;
    return item.isFavorite;
  }

  async linkAuthenticator(id: string, accountId: string): Promise<boolean> {
    const item = this.items.find((entry) => entry.id === id);
    if (!item) return false;
    item.relatedAuthenticatorAccountId = accountId;
    return true;
  }
}
