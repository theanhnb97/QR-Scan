import Clipboard from '@react-native-clipboard/clipboard';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Share,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Circle, Svg } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot/lib/index.js';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp, BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { authenticatorRepository, biometricService, secureCredentialStore } from '../../data/appContainer';
import { AuthenticatorAccount } from '../../domain/models/AuthenticatorAccount';
import { decodeBase32 } from '../../domain/otp/Base32';
import { buildGoogleAuthenticatorMigrationUris } from '../../domain/otp/GoogleAuthenticatorMigrationExport';
import type { MigrationExportEntry } from '../../domain/otp/GoogleAuthenticatorMigrationExport';
import { RfcTotpGenerator } from '../../domain/otp/RfcTotpGenerator';
import { brandAssets } from '../assets';
import { colors } from '../theme/colors';
import { SwipeableRow } from '../components/SwipeableRow';
import { useLocale } from '../i18n';
import { DismissibleBackdrop } from '../components/DismissibleBackdrop';
import { APP_ICON_SIZES, AppIcon } from '../components/AppIcon';
import { getOtpCountdownColor } from '../utils/otpVisuals';
import type { RootTabParamList } from '../navigation/RootNavigator';

type AccountCode = { code: string; secondsRemaining: number };
type AuthScreenProps = BottomTabScreenProps<RootTabParamList, 'Auth'>;
type BulkExportState = { uris: string[]; currentIndex: number; skippedCustomPeriods: number };

export const AuthScreen: React.FC<AuthScreenProps> = ({ route }) => {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const { t } = useLocale();
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const [accounts, setAccounts] = useState<AuthenticatorAccount[]>([]);
  const [codes, setCodes] = useState<Record<string, AccountCode>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddVisible, setIsAddVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reveal, setReveal] = useState<{ account: AuthenticatorAccount; secret: string } | null>(null);
  const [exportItem, setExportItem] = useState<{ account: AuthenticatorAccount; uri: string } | null>(null);
  const [bulkExport, setBulkExport] = useState<BulkExportState | null>(null);
  const [editItem, setEditItem] = useState<AuthenticatorAccount | null>(null);
  const secretCache = useRef<Record<string, string>>({});

  const loadAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      setAccounts(await authenticatorRepository.getAllAccounts());
      setError(null);
    } catch {
      setError('Không thể tải dữ liệu mã xác thực.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const prepareBulkExport = useCallback(async () => {
    const authenticated = await biometricService.authenticate(t('exportAllBiometricReason'));
    if (!authenticated) return;
    try {
      const currentAccounts = await authenticatorRepository.getAllAccounts();
      const entries: MigrationExportEntry[] = [];
      let skippedCustomPeriods = 0;
      for (const account of currentAccounts) {
        if (account.type === 'TOTP' && account.period !== 30) {
          skippedCustomPeriods += 1;
          continue;
        }
        const secret = await secureCredentialStore.getSecret(account.credentialId);
        if (!secret) continue;
        try {
          if (decodeBase32(secret).length === 0) continue;
          entries.push({ account, secret });
        } catch {
          // Invalid or unavailable secrets are omitted without exposing them.
        }
      }
      const uris = buildGoogleAuthenticatorMigrationUris(entries);
      if (uris.length === 0) {
        Alert.alert(t('exportAllAccounts'), 'No compatible authenticator accounts are available to export.');
        return;
      }
      setBulkExport({ uris, currentIndex: 0, skippedCustomPeriods });
    } catch {
      Alert.alert(t('exportAllAccounts'), 'Could not prepare the authenticator export.');
    }
  }, [t]);

  const exportAllAccounts = useCallback(() => {
    if (isLoading) return;
    if (accounts.length === 0) {
      Alert.alert(t('exportAllAccounts'), 'There are no authenticator accounts to export.');
      return;
    }
    Alert.alert(t('exportAllTitle'), t('exportAllBody'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('exportAllAccounts'), onPress: () => void prepareBulkExport() },
    ]);
  }, [accounts.length, isLoading, prepareBulkExport, t]);

  useEffect(() => {
    if (!route.params?.openExport || isLoading) return;
    navigation.setParams({ openExport: undefined });
    exportAllAccounts();
  }, [exportAllAccounts, isLoading, navigation, route.params?.openExport]);

  const openAddOptions = useCallback(() => {
    Alert.alert(t('addAccount'), t('addAccountMethod'), [
      { text: t('addFromSetupKey'), onPress: () => setIsAddVisible(true) },
      { text: t('addFromQrCode'), onPress: () => navigation.navigate('Scan') },
      { text: t('cancel'), style: 'cancel' },
    ]);
  }, [navigation, t]);

  useEffect(() => {
    if (!route.params?.openAdd || isLoading) return;
    navigation.setParams({ openAdd: undefined });
    openAddOptions();
  }, [isLoading, navigation, openAddOptions, route.params?.openAdd]);

  useFocusEffect(
    useCallback(() => {
      void loadAccounts();
    }, [loadAccounts]),
  );

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    const refreshCodes = () => {
      const now = Date.now();
      const next: Record<string, AccountCode> = {};
      for (const account of accounts) {
        const secret = secretCache.current[account.id];
        if (!secret) continue;
        try {
          if (account.type === 'TOTP') {
            next[account.id] = {
              code: RfcTotpGenerator.generateTotp(secret, now, account.period, account.digits, account.algorithm),
              secondsRemaining: RfcTotpGenerator.getRemainingSeconds(now, account.period),
            };
          } else {
            next[account.id] = {
              code: RfcTotpGenerator.generateHotp(secret, account.counter ?? 0, account.digits, account.algorithm),
              secondsRemaining: 0,
            };
          }
        } catch {
          // Invalid secrets should not break the rest of the account list.
        }
      }
      if (!cancelled) setCodes(next);
    };

    const loadSecretsAndStartTimer = async () => {
      const nextSecrets: Record<string, string> = {};
      await Promise.all(accounts.map(async (account) => {
        const secret = await secureCredentialStore.getSecret(account.credentialId);
        if (secret) nextSecrets[account.id] = secret;
      }));
      if (cancelled) return;
      secretCache.current = nextSecrets;
      refreshCodes();
      timer = setInterval(refreshCodes, 1000);
    };

    void loadSecretsAndStartTimer();
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [accounts]);

  const deleteAccount = useCallback((account: AuthenticatorAccount) => {
    Alert.alert('Delete authenticator?', `${account.issuer} / ${account.accountName}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void authenticatorRepository.deleteAccount(account.id).then(() => loadAccounts());
        },
      },
    ]);
  }, [loadAccounts]);

  const manageAccount = useCallback((account: AuthenticatorAccount) => {
    Alert.alert(`${account.issuer} / ${account.accountName}`, 'Thao tác nhạy cảm cần xác thực thiết bị.', [
      { text: t('cancel'), style: 'cancel' },
      { text: t('editAccount'), onPress: () => setEditItem(account) },
      {
        text: t('revealSecret'),
        onPress: () => {
          void biometricService.authenticate('Authenticate to reveal secret').then(async (ok) => {
            if (!ok) return;
            const secret = await secureCredentialStore.getSecret(account.credentialId);
            if (secret) setReveal({ account, secret });
          });
        },
      },
      {
        text: t('exportQr'),
        onPress: () => {
          void biometricService.authenticate('Authenticate to export authenticator').then(async (ok) => {
            if (!ok) return;
            const secret = await secureCredentialStore.getSecret(account.credentialId);
            if (secret) setExportItem({ account, uri: makeOtpAuthUri(account, secret) });
          });
        },
      },
      { text: t('delete'), style: 'destructive', onPress: () => deleteAccount(account) },
    ]);
  }, [deleteAccount, t]);

  const openAuthenticatorImport = () => {
    navigation.navigate('Scan', { importAuthenticator: Date.now() });
  };

  const filteredAccounts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return accounts;
    return accounts.filter((account) => [account.issuer, account.accountName, account.label].some((value) => value.toLowerCase().includes(query)));
  }, [accounts, searchQuery]);

  const renderAccount = useCallback(({ item }: { item: AuthenticatorAccount }) => {
    const current = codes[item.id];
    const codeColor = item.type === 'TOTP'
      ? getOtpCountdownColor(current?.secondsRemaining ?? item.period, item.period, theme.primary, theme.danger)
      : theme.primary;
    return (
      <SwipeableRow
        direction="left"
        backgroundColor={theme.card}
        borderColor={theme.border}
        actions={[
          { key: 'edit', icon: 'edit', label: t('editAccount'), color: theme.primary, onPress: () => setEditItem(item) },
          { key: 'delete', icon: 'delete', label: t('delete'), color: theme.danger, onPress: () => deleteAccount(item) },
        ]}
      >
        <Pressable onLongPress={() => manageAccount(item)} style={styles.accountCard} accessibilityRole="button" accessibilityLabel={`${item.issuer} - ${item.accountName}; vuốt từ phải sang trái để sửa hoặc xóa`}>
          <View style={styles.accountHeader}>
            <Text style={[styles.accountTitle, { color: theme.text }]} numberOfLines={1}>{[item.issuer, item.accountName].filter(Boolean).join(' - ')}</Text>
            <Pressable onPress={() => manageAccount(item)} style={styles.moreButton} accessibilityRole="button" accessibilityLabel={`Tùy chọn ${item.accountName}`} hitSlop={8}>
              <AppIcon name="more" color={theme.textMuted} size={APP_ICON_SIZES.header} />
            </Pressable>
          </View>
          <View style={styles.codeRow}>
            <Pressable
              style={styles.codeButton}
              onPress={() => {
                if (!current?.code) return;
                Clipboard.setString(current.code);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Sao chép mã ${item.accountName}`}
            >
              <Text style={[styles.code, { color: codeColor }]}>{current?.code || '------'}</Text>
            </Pressable>
            {item.type === 'TOTP' ? <OtpRing remaining={current?.secondsRemaining ?? item.period} period={item.period} color={codeColor} trackColor={theme.border} /> : <Text style={[styles.hotpBadge, { color: theme.primary }]}>HOTP</Text>}
          </View>
        </Pressable>
      </SwipeableRow>
    );
  }, [codes, deleteAccount, manageAccount, t, theme]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {accounts.length > 0 ? (
        <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('searchAccounts')}
            placeholderTextColor={theme.textMuted}
            style={[styles.searchInput, { color: theme.text }]}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel={t('searchAccounts')}
            returnKeyType="search"
          />
          <Pressable onPress={exportAllAccounts} style={styles.exportButton} accessibilityRole="button" accessibilityLabel={t('exportAllAccounts')} hitSlop={6}>
            <AppIcon name="share" color={theme.primary} size={APP_ICON_SIZES.header} />
          </Pressable>
          {searchQuery ? <Pressable onPress={() => setSearchQuery('')} accessibilityRole="button" accessibilityLabel={t('clearSearch')} hitSlop={8}><Text style={[styles.clearSearch, { color: theme.textMuted }]}>×</Text></Pressable> : null}
        </View>
      ) : null}
      <FlatList
        style={styles.list}
        data={filteredAccounts}
        keyExtractor={(item) => item.id}
        renderItem={renderAccount}
        contentContainerStyle={[styles.listContent, filteredAccounts.length === 0 && styles.emptyListContent]}
        refreshing={isLoading}
        onRefresh={() => void loadAccounts()}
        ListEmptyComponent={
          accounts.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Image source={isDark ? brandAssets.logoMarkWhite : brandAssets.logoMark} style={styles.logoMark} resizeMode="contain" accessibilityLabel="QR Scan authenticator logo" />
              <Text style={[styles.title, { color: theme.text }]}>{t('noAccounts')}</Text>
              <Text style={[styles.body, { color: theme.textMuted }]}>{t('importFromGoogleAuthenticatorBody')}</Text>
              <TouchableOpacity style={[styles.importButton, { backgroundColor: theme.primary }]} onPress={openAuthenticatorImport} accessibilityRole="button" accessibilityLabel={t('importFromGoogleAuthenticator')}>
                <Text style={styles.addButtonText}>{t('importFromGoogleAuthenticator')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.noResultsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.noResultsTitle, { color: theme.text }]}>{t('noMatchingAccounts')}</Text>
              <Text style={[styles.body, { color: theme.textMuted }]}>{t('clearSearch')}</Text>
            </View>
          )
        }
        ListFooterComponent={error ? <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text> : undefined}
      />
      <AddAccountModal
        visible={isAddVisible}
        theme={theme}
        onClose={() => setIsAddVisible(false)}
        onSaved={async () => {
          setIsAddVisible(false);
          await loadAccounts();
        }}
      />
      <Modal visible={Boolean(reveal)} transparent animationType="fade" onRequestClose={() => setReveal(null)}>
        <DismissibleBackdrop style={styles.modalBackdrop} onDismiss={() => setReveal(null)}>
          <View style={[styles.modalCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{t('secretRevealed')}</Text>
            <Text style={[styles.warningText, { color: theme.warning }]}>{t('secretWarning')}</Text>
            <Text selectable style={[styles.secretText, { color: theme.text }]}>{reveal?.secret}</Text>
            <Pressable onPress={() => setReveal(null)} accessibilityRole="button" accessibilityLabel={t('close')}><Text style={[styles.cancelText, { color: theme.textMuted }]}>{t('close')}</Text></Pressable>
          </View>
        </DismissibleBackdrop>
      </Modal>
      <ExportQrModal exportItem={exportItem} theme={theme} onClose={() => setExportItem(null)} />
      <BulkExportModal exportState={bulkExport} theme={theme} onClose={() => setBulkExport(null)} onChangeIndex={(currentIndex) => setBulkExport((current) => current ? { ...current, currentIndex } : current)} />
      <EditAccountModal account={editItem} theme={theme} onClose={() => setEditItem(null)} onSaved={async () => { setEditItem(null); await loadAccounts(); }} />
    </View>
  );
};

const OtpRing: React.FC<{ remaining: number; period: number; color: string; trackColor: string }> = ({ remaining, period, color, trackColor }) => {
  const size = 32;
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, remaining / Math.max(1, period)));
  return (
    <View style={styles.otpRing} accessibilityLabel={`${remaining} seconds remaining`}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={circumference * (1 - progress)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </Svg>
      <Text style={[styles.otpRingText, { color }]}>{remaining}</Text>
    </View>
  );
};

const ExportQrModal: React.FC<{
  exportItem: { account: AuthenticatorAccount; uri: string } | null;
  theme: typeof colors.light;
  onClose: () => void;
}> = ({ exportItem, theme, onClose }) => {
  const qrRef = React.useRef<any>(null);
  const { t } = useLocale();
  if (!exportItem) return null;
  const shareQr = async () => {
    try {
      const uri = await captureRef(qrRef, { format: 'png', quality: 1, result: 'tmpfile' });
      await Share.share({ url: uri, message: 'Authenticator QR export' });
    } catch {
      Alert.alert('Không thể chia sẻ', 'Ảnh QR không thể được chia sẻ.');
    }
  };
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <DismissibleBackdrop style={styles.modalBackdrop} onDismiss={onClose}>
        <View style={[styles.modalCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>{t('exportAuthenticator')}</Text>
          <Text style={[styles.warningText, { color: theme.warning }]}>{t('exportWarning')}</Text>
          <View ref={qrRef} collapsable={false} style={styles.qrExport}><QRCode value={exportItem.uri} size={220} color="#061A2D" backgroundColor="#FFFFFF" /></View>
          <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.primary }]} onPress={() => void shareQr()} accessibilityRole="button" accessibilityLabel={t('shareQr')}><AppIcon name="share" color="#FFFFFF" size={APP_ICON_SIZES.action} /><Text style={styles.addButtonText}>{t('shareQr')}</Text></TouchableOpacity>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={t('close')}><Text style={[styles.cancelText, { color: theme.textMuted }]}>{t('close')}</Text></Pressable>
        </View>
      </DismissibleBackdrop>
    </Modal>
  );
};

const BulkExportModal: React.FC<{
  exportState: BulkExportState | null;
  theme: typeof colors.light;
  onClose: () => void;
  onChangeIndex: (index: number) => void;
}> = ({ exportState, theme, onClose, onChangeIndex }) => {
  const qrRef = React.useRef<any>(null);
  const { t } = useLocale();
  if (!exportState) return null;
  const total = exportState.uris.length;
  const index = Math.max(0, Math.min(exportState.currentIndex, total - 1));
  const batchLabel = t('exportBatch').replace('%s', String(index + 1)).replace('%s', String(total));
  const shareQr = async () => {
    try {
      const uri = await captureRef(qrRef, { format: 'png', quality: 1, result: 'tmpfile' });
      await Share.share({ url: uri, message: `Authenticator migration QR ${index + 1}/${total}` });
    } catch {
      Alert.alert('Không thể chia sẻ', 'Ảnh QR không thể được chia sẻ.');
    }
  };
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <DismissibleBackdrop style={styles.modalBackdrop} onDismiss={onClose}>
        <View style={[styles.modalCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>{t('exportAllAccounts')}</Text>
          <Text style={[styles.warningText, { color: theme.warning }]}>{t('exportWarning')}</Text>
          {exportState.skippedCustomPeriods > 0 ? <Text style={[styles.exportSkipped, { color: theme.danger }]}>{t('exportBatchWarning')}</Text> : null}
          <Text style={[styles.batchLabel, { color: theme.textMuted }]}>{batchLabel}</Text>
          <View ref={qrRef} collapsable={false} style={styles.qrExport}><QRCode value={exportState.uris[index]} size={220} color="#061A2D" backgroundColor="#FFFFFF" /></View>
          {total > 1 ? (
            <View style={styles.batchNav}>
              <Pressable disabled={index === 0} onPress={() => onChangeIndex(index - 1)} accessibilityRole="button" accessibilityLabel={t('previous')}>
                <Text style={[styles.batchNavText, { color: index === 0 ? theme.textMuted : theme.primary }]}>{t('previous')}</Text>
              </Pressable>
              <Text style={[styles.batchCount, { color: theme.textMuted }]}>{`${index + 1}/${total}`}</Text>
              <Pressable disabled={index === total - 1} onPress={() => onChangeIndex(index + 1)} accessibilityRole="button" accessibilityLabel={t('next')}>
                <Text style={[styles.batchNavText, { color: index === total - 1 ? theme.textMuted : theme.primary }]}>{t('next')}</Text>
              </Pressable>
            </View>
          ) : null}
          <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.primary }]} onPress={() => void shareQr()} accessibilityRole="button" accessibilityLabel={t('shareQr')}><AppIcon name="share" color="#FFFFFF" size={APP_ICON_SIZES.action} /><Text style={styles.addButtonText}>{t('shareQr')}</Text></TouchableOpacity>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={t('close')}><Text style={[styles.cancelText, { color: theme.textMuted }]}>{t('close')}</Text></Pressable>
        </View>
      </DismissibleBackdrop>
    </Modal>
  );
};

function makeOtpAuthUri(account: AuthenticatorAccount, secret: string): string {
  const type = account.type.toLowerCase();
  const label = encodeURIComponent(account.label || `${account.issuer}: ${account.accountName}`);
  const params = new URLSearchParams({ secret, issuer: account.issuer, algorithm: account.algorithm, digits: String(account.digits) });
  if (account.type === 'TOTP') params.set('period', String(account.period));
  if (account.type === 'HOTP') params.set('counter', String(account.counter ?? 0));
  return `otpauth://${type}/${label}?${params.toString()}`;
}

const AddAccountModal: React.FC<{
  visible: boolean;
  theme: typeof colors.light;
  onClose: () => void;
  onSaved: () => Promise<void>;
}> = ({ visible, theme, onClose, onSaved }) => {
  const { t } = useLocale();
  const [issuer, setIssuer] = useState('');
  const [accountName, setAccountName] = useState('');
  const [secret, setSecret] = useState('');
  const [digits, setDigits] = useState('6');
  const [period, setPeriod] = useState('30');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setIssuer(''); setAccountName(''); setSecret(''); setDigits('6'); setPeriod('30'); setError(null);
  };

  const save = async () => {
    const normalized = secret.replace(/\s+/g, '').toUpperCase();
    const digitCount = Number(digits);
    const periodSeconds = Number(period);
    try {
      const bytes = decodeBase32(normalized);
      if (!normalized || bytes.length < 10) throw new Error(t('invalidBase32'));
      if (![6, 8].includes(digitCount)) throw new Error(t('digitsError'));
      if (!Number.isInteger(periodSeconds) || periodSeconds < 5 || periodSeconds > 3600) throw new Error(t('periodError'));
      setIsSaving(true);
      await authenticatorRepository.saveAccount({
        type: 'TOTP', issuer: issuer.trim() || 'Authenticator', accountName: accountName.trim() || 'Account',
        label: `${issuer.trim() || 'Authenticator'}: ${accountName.trim() || 'Account'}`,
        algorithm: 'SHA1', digits: digitCount, period: periodSeconds, isFavorite: false, sortOrder: 0,
      }, normalized);
      reset();
      await onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Account could not be saved.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <DismissibleBackdrop style={styles.modalBackdrop} onDismiss={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}>
          <View style={[styles.modalCard, { backgroundColor: theme.card }]}>
            <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={styles.modalScrollContent}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{t('addTotp')}</Text>
              <TextInput value={issuer} onChangeText={setIssuer} placeholder={t('issuerOptional')} placeholderTextColor={theme.textMuted} style={[styles.input, { color: theme.text, borderColor: theme.border }]} autoCapitalize="words" accessibilityLabel={t('issuerOptional')} inputAccessoryViewID="qr-scan-auth-input-accessory" returnKeyType="next" />
              <TextInput value={accountName} onChangeText={setAccountName} placeholder={t('accountName')} placeholderTextColor={theme.textMuted} style={[styles.input, { color: theme.text, borderColor: theme.border }]} autoCapitalize="none" accessibilityLabel={t('accountName')} inputAccessoryViewID="qr-scan-auth-input-accessory" returnKeyType="next" />
              <TextInput value={secret} onChangeText={setSecret} placeholder={t('base32Key')} placeholderTextColor={theme.textMuted} style={[styles.input, { color: theme.text, borderColor: theme.border }]} autoCapitalize="characters" autoCorrect={false} secureTextEntry accessibilityLabel={t('base32Key')} inputAccessoryViewID="qr-scan-auth-input-accessory" returnKeyType="next" />
              <View style={styles.inlineInputs}>
                <TextInput value={digits} onChangeText={setDigits} keyboardType="number-pad" placeholder="Digits" placeholderTextColor={theme.textMuted} style={[styles.input, styles.smallInput, { color: theme.text, borderColor: theme.border }]} accessibilityLabel="OTP digits" inputAccessoryViewID="qr-scan-auth-input-accessory" returnKeyType="next" />
                <TextInput value={period} onChangeText={setPeriod} keyboardType="number-pad" placeholder="Period" placeholderTextColor={theme.textMuted} style={[styles.input, styles.smallInput, { color: theme.text, borderColor: theme.border }]} accessibilityLabel="OTP period in seconds" inputAccessoryViewID="qr-scan-auth-input-accessory" returnKeyType="done" onSubmitEditing={Keyboard.dismiss} />
              </View>
              {error ? <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text> : null}
              <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.primary }]} onPress={() => void save()} disabled={isSaving} accessibilityRole="button" accessibilityLabel={t('saveSecurely')}>
                <Text style={styles.addButtonText}>{isSaving ? t('saving') : t('saveSecurely')}</Text>
              </TouchableOpacity>
              <Pressable onPress={() => { reset(); onClose(); }} accessibilityRole="button" accessibilityLabel={t('cancel')}><Text style={[styles.cancelText, { color: theme.textMuted }]}>{t('cancel')}</Text></Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
        {Platform.OS === 'ios' ? <InputAccessoryView nativeID="qr-scan-auth-input-accessory"><View style={styles.inputAccessory}><Pressable onPress={Keyboard.dismiss} accessibilityRole="button" accessibilityLabel={t('done')}><Text style={[styles.doneText, { color: theme.primary }]}>{t('done')}</Text></Pressable></View></InputAccessoryView> : null}
      </DismissibleBackdrop>
    </Modal>
  );
};

const EditAccountModal: React.FC<{
  account: AuthenticatorAccount | null;
  theme: typeof colors.light;
  onClose: () => void;
  onSaved: () => Promise<void>;
}> = ({ account, theme, onClose, onSaved }) => {
  const { t } = useLocale();
  const [issuer, setIssuer] = useState('');
  const [accountName, setAccountName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    setIssuer(account?.issuer ?? '');
    setAccountName(account?.accountName ?? '');
    setError(null);
  }, [account]);

  const save = async () => {
    if (!account) return;
    const nextIssuer = issuer.trim() || 'Authenticator';
    const nextName = accountName.trim() || 'Account';
    setIsSaving(true);
    try {
      await authenticatorRepository.updateAccount(account.id, { issuer: nextIssuer, accountName: nextName, label: `${nextIssuer}: ${nextName}` });
      await onSaved();
    } catch {
      setError('Account details could not be updated.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={Boolean(account)} transparent animationType="slide" onRequestClose={onClose}>
      <DismissibleBackdrop style={styles.modalBackdrop} onDismiss={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}>
          <View style={[styles.modalCard, { backgroundColor: theme.card }]}>
            <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={styles.modalScrollContent}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{t('editAccount')}</Text>
              <TextInput value={issuer} onChangeText={setIssuer} placeholder={t('issuerOptional')} placeholderTextColor={theme.textMuted} style={[styles.input, { color: theme.text, borderColor: theme.border }]} autoCapitalize="words" accessibilityLabel={t('issuerOptional')} inputAccessoryViewID="qr-scan-auth-input-accessory" returnKeyType="next" />
              <TextInput value={accountName} onChangeText={setAccountName} placeholder={t('accountName')} placeholderTextColor={theme.textMuted} style={[styles.input, { color: theme.text, borderColor: theme.border }]} autoCapitalize="none" accessibilityLabel={t('accountName')} inputAccessoryViewID="qr-scan-auth-input-accessory" returnKeyType="done" onSubmitEditing={Keyboard.dismiss} />
              {error ? <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text> : null}
              <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.primary }]} onPress={() => void save()} disabled={isSaving} accessibilityRole="button" accessibilityLabel={t('saveChanges')}><Text style={styles.addButtonText}>{isSaving ? t('saving') : t('saveChanges')}</Text></TouchableOpacity>
              <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={t('cancel')}><Text style={[styles.cancelText, { color: theme.textMuted }]}>{t('cancel')}</Text></Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
        {Platform.OS === 'ios' ? <InputAccessoryView nativeID="qr-scan-auth-input-accessory"><View style={styles.inputAccessory}><Pressable onPress={Keyboard.dismiss} accessibilityRole="button" accessibilityLabel={t('done')}><Text style={[styles.doneText, { color: theme.primary }]}>{t('done')}</Text></Pressable></View></InputAccessoryView> : null}
      </DismissibleBackdrop>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 12, marginBottom: 4, borderWidth: 1, borderRadius: 11, paddingHorizontal: 12 },
  searchInput: { flex: 1, minHeight: 42, paddingVertical: 8, fontSize: 14 },
  exportButton: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
  clearSearch: { fontSize: 24, lineHeight: 26, paddingHorizontal: 4 },
  list: { flex: 1 },
  listContent: { padding: 16, paddingTop: 10, paddingBottom: 24, gap: 8 },
  emptyListContent: { flexGrow: 1, justifyContent: 'center' },
  emptyCard: { borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1 },
  logoMark: { width: 58, height: 58, marginBottom: 14 },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  body: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  importButton: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, marginTop: 16 },
  noResultsCard: { borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1 },
  noResultsTitle: { fontSize: 15, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  accountCard: { borderRadius: 13, paddingHorizontal: 13, paddingVertical: 9 },
  accountHeader: { flexDirection: 'row', alignItems: 'center', minHeight: 24 },
  accountTitle: { flex: 1, paddingRight: 8, fontSize: 14, fontWeight: '700' },
  moreButton: { width: 26, height: 24, alignItems: 'center', justifyContent: 'center' },
  codeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  codeButton: { flex: 1, alignItems: 'flex-start', paddingVertical: 1 },
  code: { fontSize: 25, fontWeight: '800', letterSpacing: 3 },
  otpRing: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  otpRingText: { position: 'absolute', fontSize: 9, fontWeight: '800' },
  hotpBadge: { minWidth: 32, marginLeft: 10, textAlign: 'right', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  addButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 30 },
  modalScrollContent: { paddingBottom: 8 },
  inputAccessory: { alignItems: 'flex-end', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#F4F7FA', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#CBD5E1' },
  doneText: { fontSize: 16, fontWeight: '700' },
  modalTitle: { fontSize: 22, fontWeight: '800', marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 11, fontSize: 15, marginBottom: 10 },
  inlineInputs: { flexDirection: 'row', gap: 10 },
  smallInput: { flex: 1 },
  saveButton: { borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingVertical: 13, marginTop: 4 },
  cancelText: { textAlign: 'center', paddingVertical: 15, fontWeight: '600' },
  errorText: { fontSize: 13, textAlign: 'center', marginVertical: 8 },
  warningText: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginBottom: 14 },
  exportSkipped: { fontSize: 12, lineHeight: 17, textAlign: 'center', marginBottom: 8 },
  batchLabel: { textAlign: 'center', fontSize: 13, fontWeight: '700' },
  batchNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, marginBottom: 8 },
  batchNavText: { fontSize: 14, fontWeight: '700', paddingVertical: 8 },
  batchCount: { fontSize: 13, fontWeight: '700' },
  secretText: { fontSize: 17, fontWeight: '700', letterSpacing: 1.2, textAlign: 'center', marginVertical: 16 },
  qrExport: { backgroundColor: '#FFFFFF', padding: 20, alignItems: 'center', marginVertical: 12 },
});
