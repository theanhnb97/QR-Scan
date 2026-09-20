import * as Keychain from 'react-native-keychain';
import { BiometricService } from '../../domain/interfaces';

const AUTH_GATE_SERVICE = 'com.anhnt.qrscan.biometric-gate';

/** Uses native Keychain/Keystore access control so JS booleans are not a security boundary. */
export class NativeBiometricService implements BiometricService {
  async isAvailable(): Promise<boolean> {
    const type = await Keychain.getSupportedBiometryType();
    return type !== null;
  }

  async authenticate(reason: string): Promise<boolean> {
    try {
      const existing = await Keychain.getGenericPassword({
        service: AUTH_GATE_SERVICE,
        accessControl: Keychain.ACCESS_CONTROL.USER_PRESENCE,
        authenticationPrompt: { title: reason, cancel: 'Cancel' },
      });
      if (existing) return true;

      const result = await Keychain.setGenericPassword('gate', 'device-authenticated', {
        service: AUTH_GATE_SERVICE,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        accessControl: Keychain.ACCESS_CONTROL.USER_PRESENCE,
        authenticationPrompt: { title: reason, cancel: 'Cancel' },
        securityLevel: Keychain.SECURITY_LEVEL.SECURE_SOFTWARE,
        storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
      });
      if (!result) return false;
      const verified = await Keychain.getGenericPassword({
        service: AUTH_GATE_SERVICE,
        accessControl: Keychain.ACCESS_CONTROL.USER_PRESENCE,
        authenticationPrompt: { title: reason, cancel: 'Cancel' },
      });
      return Boolean(verified);
    } catch {
      return false;
    }
  }
}
