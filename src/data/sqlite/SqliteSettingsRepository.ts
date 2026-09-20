import { SqliteDatabase } from './SqliteDatabase';

export type LinkBehavior = 'in_app' | 'external';
export type AppLanguage = 'vi' | 'en';

export interface AppSettings {
  appLockEnabled: boolean;
  linkBehavior: LinkBehavior;
  language: AppLanguage;
}

const DEFAULT_SETTINGS: AppSettings = {
  appLockEnabled: false,
  linkBehavior: 'external',
  language: 'vi',
};

/** Persists non-secret preferences only. Credentials never pass through this repository. */
export class SqliteSettingsRepository {
  constructor(private readonly database: SqliteDatabase) {}

  async getSettings(): Promise<AppSettings> {
    const db = await this.database.get();
    const result = await db.execute('SELECT key, value FROM app_settings');
    const values = new Map(result.rows.map((row) => [String(row.key), String(row.value)]));
    const savedLinkBehavior = values.get('link_behavior');
    return {
      appLockEnabled: values.get('app_lock_enabled') === 'true',
      linkBehavior: savedLinkBehavior === 'in_app' || savedLinkBehavior === 'external' ? savedLinkBehavior : DEFAULT_SETTINGS.linkBehavior,
      language: values.get('language') === 'en' ? 'en' : DEFAULT_SETTINGS.language,
    };
  }

  async setAppLockEnabled(enabled: boolean): Promise<void> {
    await this.set('app_lock_enabled', enabled ? 'true' : 'false');
  }

  async setLinkBehavior(behavior: LinkBehavior): Promise<void> {
    await this.set('link_behavior', behavior);
  }

  async setLanguage(language: AppLanguage): Promise<void> {
    await this.set('language', language);
  }

  private async set(key: string, value: string): Promise<void> {
    const db = await this.database.get();
    await db.execute(
      `INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      [key, value, Date.now()],
    );
  }
}
