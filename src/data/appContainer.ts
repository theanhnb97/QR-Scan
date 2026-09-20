import { NativeSecureCredentialStore } from '../services/security/NativeSecureCredentialStore';
import { NativeBiometricService } from '../services/security/NativeBiometricService';
import { SqliteAuthenticatorRepository } from './sqlite/SqliteAuthenticatorRepository';
import { SqliteDatabase } from './sqlite/SqliteDatabase';
import { SqliteHistoryRepository } from './sqlite/SqliteHistoryRepository';
import { SqliteSettingsRepository } from './sqlite/SqliteSettingsRepository';
import { SqliteGeneratedHistoryRepository } from './sqlite/SqliteGeneratedHistoryRepository';

const database = new SqliteDatabase();

export const secureCredentialStore = new NativeSecureCredentialStore();
export const biometricService = new NativeBiometricService();
export const historyRepository = new SqliteHistoryRepository(database);
export const authenticatorRepository = new SqliteAuthenticatorRepository(database, secureCredentialStore);
export const settingsRepository = new SqliteSettingsRepository(database);
export const generatedHistoryRepository = new SqliteGeneratedHistoryRepository(database);
