import * as Keychain from 'react-native-keychain';
import { SecureCredentialStore } from '../../domain/interfaces';

const SERVICE_PREFIX = 'com.anhnt.qrscan.credential.';

function serviceFor(credentialId: string): string {
  // Credential ids are generated internally, but keep the service name strict
  // so an accidental caller cannot escape the app's keychain namespace.
  const safeId = credentialId.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${SERVICE_PREFIX}${safeId}`;
}

/** Platform-backed secret storage: iOS Keychain and Android Keystore storage. */
export class NativeSecureCredentialStore implements SecureCredentialStore {
  async saveSecret(credentialId: string, secret: string): Promise<void> {
    if (!credentialId || !secret) {
      throw new Error('Credential id and secret are required.');
    }

    const result = await Keychain.setGenericPassword('totp', secret, {
      service: serviceFor(credentialId),
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      securityLevel: Keychain.SECURITY_LEVEL.SECURE_SOFTWARE,
      storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
    });

    if (!result) {
      throw new Error('Secure credential storage was unavailable.');
    }
  }

  async getSecret(credentialId: string): Promise<string | null> {
    const credentials = await Keychain.getGenericPassword({ service: serviceFor(credentialId) });
    return credentials ? credentials.password : null;
  }

  async deleteSecret(credentialId: string): Promise<boolean> {
    return Keychain.resetGenericPassword({ service: serviceFor(credentialId) });
  }

  async hasSecret(credentialId: string): Promise<boolean> {
    return Keychain.hasGenericPassword({ service: serviceFor(credentialId) });
  }
}

