import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState, AppStateStatus, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { biometricService, settingsRepository } from '../../data/appContainer';
import { colors } from '../theme/colors';
import type { AppSettings, LinkBehavior } from '../../data/sqlite/SqliteSettingsRepository';

interface AppSecurityValue {
  settings: AppSettings;
  isReady: boolean;
  isLocked: boolean;
  unlock: () => Promise<boolean>;
  setAppLockEnabled: (enabled: boolean) => Promise<boolean>;
  setLinkBehavior: (behavior: LinkBehavior) => Promise<void>;
}

const DEFAULT_SETTINGS: AppSettings = { appLockEnabled: false, linkBehavior: 'external', language: 'vi' };
const SecurityContext = createContext<AppSecurityValue | null>(null);

export const AppSecurityProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isReady, setIsReady] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    let mounted = true;
    void settingsRepository.getSettings().then((loaded) => {
      if (!mounted) return;
      setSettings(loaded);
      setIsLocked(loaded.appLockEnabled);
      setIsReady(true);
    }).catch(() => {
      // Do not expose scan history when the lock preference cannot be read.
      if (mounted) {
        setIsLocked(true);
        setIsReady(true);
      }
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const onAppStateChange = (nextState: AppStateStatus) => {
      if ((nextState === 'background' || nextState === 'inactive') && settings.appLockEnabled) {
        setIsLocked(true);
      }
    };
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, [settings.appLockEnabled]);

  const unlock = useCallback(async () => {
    const authenticated = await biometricService.authenticate('Unlock QR Scan');
    if (authenticated) setIsLocked(false);
    return authenticated;
  }, []);

  const setAppLockEnabled = useCallback(async (enabled: boolean) => {
    // Enabling and disabling the lock both require current device presence.
    if (!(await biometricService.authenticate(enabled ? 'Enable app lock' : 'Disable app lock'))) return false;
    await settingsRepository.setAppLockEnabled(enabled);
    setSettings((current) => ({ ...current, appLockEnabled: enabled }));
    setIsLocked(false);
    return true;
  }, []);

  const setLinkBehavior = useCallback(async (linkBehavior: LinkBehavior) => {
    await settingsRepository.setLinkBehavior(linkBehavior);
    setSettings((current) => ({ ...current, linkBehavior }));
  }, []);

  const value = useMemo(() => ({ settings, isReady, isLocked, unlock, setAppLockEnabled, setLinkBehavior }), [isLocked, isReady, setAppLockEnabled, setLinkBehavior, settings, unlock]);
  return <SecurityContext.Provider value={value}>{children}</SecurityContext.Provider>;
};

export function useAppSecurity(): AppSecurityValue {
  const value = useContext(SecurityContext);
  if (!value) throw new Error('useAppSecurity must be used inside AppSecurityProvider');
  return value;
}

export const AppLockGate: React.FC = () => {
  const { isReady, isLocked, unlock } = useAppSecurity();
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  if (!isReady || !isLocked) return null;
  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>QR Scan is locked</Text>
      <Text style={[styles.body, { color: theme.textMuted }]}>Authenticate with your device to view your scans and codes.</Text>
      <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => void unlock()} accessibilityRole="button" accessibilityLabel="Unlock QR Scan">
        <Text style={styles.buttonText}>Unlock</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', padding: 28, zIndex: 100 },
  title: { fontSize: 25, fontWeight: '800', textAlign: 'center' },
  body: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 10, maxWidth: 320 },
  button: { marginTop: 24, paddingHorizontal: 30, paddingVertical: 14, borderRadius: 12 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
