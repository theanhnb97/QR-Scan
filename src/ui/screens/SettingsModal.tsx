import React, { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Switch, Text, useColorScheme, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { historyRepository } from '../../data/appContainer';
import { useAppSecurity } from '../state/AppSecurityContext';
import { colors } from '../theme/colors';
import { useLocale } from '../i18n';
import { DismissibleBackdrop } from '../components/DismissibleBackdrop';
import type { RootTabParamList } from '../navigation/RootNavigator';

export const SettingsModal: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const { settings, setAppLockEnabled, setLinkBehavior } = useAppSecurity();
  const { locale, setLocale, t } = useLocale();
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const [busy, setBusy] = useState(false);

  const toggleLock = async (enabled: boolean) => {
    setBusy(true);
    try {
      const changed = await setAppLockEnabled(enabled);
      if (!changed) Alert.alert('Authentication required', 'The app lock setting was not changed.');
    } catch {
      Alert.alert('Could not update app lock', 'Try again with your device passcode or biometrics.');
    } finally {
      setBusy(false);
    }
  };

  const clearHistory = () => Alert.alert('Clear history?', 'Only non-secret scan metadata will be removed.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Clear', style: 'destructive', onPress: () => void historyRepository.clearAll() },
  ]);

  const openAuthenticatorImport = () => {
    onClose();
    navigation.navigate('Scan', { importAuthenticator: Date.now() });
  };

  const openAuthenticatorExport = () => {
    onClose();
    navigation.navigate('Auth', { openExport: Date.now() });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <DismissibleBackdrop style={styles.backdrop} onDismiss={onClose}>
        <View style={[styles.sheet, { backgroundColor: theme.card }]}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          <Text style={[styles.title, { color: theme.text }]}>{t('settings')}</Text>
          <Text style={[styles.section, { color: theme.textMuted }]}>{t('security')}</Text>
          <View style={styles.row}>
            <View style={styles.copy}>
              <Text style={[styles.label, { color: theme.text }]}>{t('appLock')}</Text>
              <Text style={[styles.description, { color: theme.textMuted }]}>Yêu cầu xác thực thiết bị sau khi rời QR Scan.</Text>
            </View>
            <Switch value={settings.appLockEnabled} onValueChange={(value) => void toggleLock(value)} disabled={busy} accessibilityLabel="App lock" />
          </View>
          <Text style={[styles.section, { color: theme.textMuted }]}>{t('links')}</Text>
          <View style={styles.choiceRow}>
            {(['in_app', 'external'] as const).map((behavior) => (
              <Pressable key={behavior} onPress={() => void setLinkBehavior(behavior)} style={[styles.choice, { borderColor: settings.linkBehavior === behavior ? theme.primary : theme.border, backgroundColor: settings.linkBehavior === behavior ? theme.primary : theme.surface }]} accessibilityRole="button" accessibilityLabel={`${behavior === 'in_app' ? 'Open links in app' : 'Open links externally'}`}>
                <Text style={{ color: settings.linkBehavior === behavior ? '#FFFFFF' : theme.text, fontWeight: '700' }}>{behavior === 'in_app' ? t('inAppBrowser') : t('externalBrowser')}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.section, { color: theme.textMuted }]}>{t('data')}</Text>
          <Pressable onPress={clearHistory} style={[styles.action, { borderColor: theme.border }]} accessibilityRole="button"><Text style={{ color: theme.danger, fontWeight: '700' }}>Xóa lịch sử quét</Text></Pressable>
          <Text style={[styles.section, { color: theme.textMuted }]}>{t('authenticator')}</Text>
          <Pressable onPress={openAuthenticatorImport} style={[styles.action, { borderColor: theme.border }]} accessibilityRole="button" accessibilityLabel={t('importFromGoogleAuthenticator')}>
            <Text style={{ color: theme.primary, fontWeight: '700' }}>{t('importFromGoogleAuthenticator')}</Text>
          </Pressable>
          <Pressable onPress={openAuthenticatorExport} style={[styles.action, { borderColor: theme.border, marginTop: 8 }]} accessibilityRole="button" accessibilityLabel={t('exportAllAccounts')}>
            <Text style={{ color: theme.primary, fontWeight: '700' }}>{t('exportAllAccounts')}</Text>
          </Pressable>
          <Text style={[styles.section, { color: theme.textMuted }]}>{t('language')}</Text>
          <View style={styles.choiceRow}>
            {(['vi', 'en'] as const).map((item) => (
              <Pressable key={item} onPress={() => setLocale(item)} style={[styles.choice, { borderColor: locale === item ? theme.primary : theme.border, backgroundColor: locale === item ? theme.primary : theme.surface }]} accessibilityRole="button" accessibilityState={{ selected: locale === item }}>
                <Text style={{ color: locale === item ? '#FFFFFF' : theme.text, fontWeight: '700' }}>{item === 'vi' ? t('vietnamese') : t('english')}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.about, { color: theme.textMuted }]}>QR Scan · offline-first QR and authenticator utility</Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={t('done')}><Text style={[styles.close, { color: theme.primary }]}>{t('done')}</Text></Pressable>
        </View>
      </DismissibleBackdrop>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 30 },
  handle: { width: 42, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 18 },
  section: { fontSize: 11, fontWeight: '800', letterSpacing: 1.1, marginTop: 12, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  copy: { flex: 1 },
  label: { fontSize: 16, fontWeight: '700' },
  description: { fontSize: 13, lineHeight: 18, marginTop: 3 },
  choiceRow: { flexDirection: 'row', gap: 8 },
  choice: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  action: { borderWidth: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  about: { textAlign: 'center', fontSize: 12, marginTop: 20 },
  close: { textAlign: 'center', fontWeight: '700', paddingVertical: 14 },
});
