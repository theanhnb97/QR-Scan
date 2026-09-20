import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Clipboard from '@react-native-clipboard/clipboard';
import {
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  Share,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  Vibration,
  View,
  PanResponder,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useIsFocused } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { launchImageLibrary } from 'react-native-image-picker';
import { authenticatorRepository, historyRepository } from '../../data/appContainer';
import { toSafeHistoryInput } from '../../domain/history/HistorySanitizer';
import { DefaultContentParser } from '../../domain/parsers/ContentParser';
import { ScannedContent } from '../../domain/models/ScannedContent';
import { brandAssets } from '../assets';
import {
  CameraKitImageDecoder,
  CameraKitScanner,
  useCameraAccess,
} from '../../services/scanner/CameraKitAdapter';
import { colors } from '../theme/colors';
import { useAppSecurity } from '../state/AppSecurityContext';
import { nativeActionService } from '../../services/actions/NativeActionService';
import { useLocale } from '../i18n';
import { DismissibleBackdrop } from '../components/DismissibleBackdrop';
import { APP_ICON_SIZES, AppIcon } from '../components/AppIcon';
import { zoomFromGesture, zoomFromTrackPosition } from '../utils/zoomSlider';
import type { RootTabParamList } from '../navigation/RootNavigator';

const DEBOUNCE_MS = 1500;
const contentParser = new DefaultContentParser();

type ScanScreenProps = BottomTabScreenProps<RootTabParamList, 'Scan'>;

export const ScanScreen: React.FC<ScanScreenProps> = ({ route }) => {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const { settings } = useAppSecurity();
  const { t } = useLocale();
  const isFocused = useIsFocused();
  const permission = useCameraAccess();
  const imageDecoder = useMemo(() => new CameraKitImageDecoder(), []);
  const lastDetection = useRef<{ value: string; at: number } | null>(null);
  const historyId = useRef<string | null>(null);
  const [historyRecordId, setHistoryRecordId] = useState<string | null>(null);
  const [result, setResult] = useState<ScannedContent | null>(null);
  const [multipleResults, setMultipleResults] = useState<ScannedContent[]>([]);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [zoom, setZoom] = useState(1);
  const lastImportPrompt = useRef<number | null>(null);

  useEffect(() => {
    const request = route.params?.importAuthenticator;
    if (!request || lastImportPrompt.current === request) return;
    lastImportPrompt.current = request;
    Alert.alert(t('googleAuthenticatorImportTitle'), t('googleAuthenticatorImportBody'), [{ text: t('close') }]);
  }, [route.params?.importAuthenticator, t]);

  const recordAndPresent = useCallback(async (value: string, format: string, source: 'camera' | 'image_picker') => {
    const parsed = parseDetection(value, format);
    historyId.current = null;
    setHistoryRecordId(null);
    setResult(parsed);
    try {
      const historyItem = await historyRepository.add(toSafeHistoryInput(parsed, source));
      historyId.current = historyItem.id;
      setHistoryRecordId(historyItem.id);
    } catch {
      historyId.current = null;
      setHistoryRecordId(null);
      setCameraError(t('codeReadHistoryError'));
    }
  }, [t]);

  const recordParsedAndPresent = useCallback(async (parsed: ScannedContent, source: 'camera' | 'image_picker') => {
    historyId.current = null;
    setHistoryRecordId(null);
    setMultipleResults([]);
    setResult(parsed);
    try {
      const historyItem = await historyRepository.add(toSafeHistoryInput(parsed, source));
      historyId.current = historyItem.id;
      setHistoryRecordId(historyItem.id);
    } catch {
      historyId.current = null;
      setHistoryRecordId(null);
      setCameraError(t('codeReadHistoryError'));
    }
  }, [t]);

  const handleDetection = useCallback(
    (detection: { value: string; format: string }) => {
      const now = Date.now();
      if (
        lastDetection.current &&
        lastDetection.current.value === detection.value &&
        now - lastDetection.current.at < DEBOUNCE_MS
      ) {
        return;
      }

      lastDetection.current = { value: detection.value, at: now };
      try {
        Vibration.vibrate(45);
      } catch {
        // Haptic feedback must never block presenting a valid scan result.
      }
      void recordAndPresent(detection.value, detection.format, 'camera');
    },
    [recordAndPresent],
  );

  const handleImageScan = useCallback(async () => {
    setIsImageLoading(true);
    setCameraError(null);
    try {
      const response = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 });
      const asset = response.assets?.[0];
      const uri = asset?.originalPath || asset?.uri;
      if (response.didCancel || !uri) return;

      const detections = await imageDecoder.decode(uri);
      const parsed = detections.map((detection) => parseDetection(detection.value, detection.format));
      if (parsed.length === 1) {
        historyId.current = null;
        setHistoryRecordId(null);
        setResult(parsed[0]);
        try {
          const historyItem = await historyRepository.add(toSafeHistoryInput(parsed[0], 'image_picker'));
          historyId.current = historyItem.id;
          setHistoryRecordId(historyItem.id);
        } catch {
          historyId.current = null;
          setHistoryRecordId(null);
          setCameraError(t('codeReadHistoryError'));
        }
      } else if (parsed.length > 1) {
        setMultipleResults(parsed);
      } else {
        setCameraError(t('noCodeInImage'));
      }
    } catch {
      setCameraError(t('imageScanError'));
    } finally {
      setIsImageLoading(false);
    }
  }, [imageDecoder, t]);

  const closeResult = useCallback(() => {
    historyId.current = null;
    setHistoryRecordId(null);
    setResult(null);
    setMultipleResults([]);
  }, []);

  if (permission.hasPermission) {
    return (
      <View style={styles.cameraRoot}>
        <CameraKitScanner
          isActive={isFocused && result === null && multipleResults.length === 0}
          torchMode={torchOn ? 'on' : 'off'}
          zoom={zoom}
          onDetected={handleDetection}
          onError={() => setCameraError(t('cameraUnavailable'))}
        />

        <View pointerEvents="box-none" style={styles.cameraOverlay}>
          <View style={styles.cameraTopBar}>
            <Image
              source={isDark ? brandAssets.logoMarkWhite : brandAssets.logoMark}
              style={styles.cameraMark}
              resizeMode="contain"
              accessibilityLabel="QR Scan logo"
            />
            <View style={styles.autoChip}>
              <View style={styles.liveDot} />
              <Text style={styles.autoChipText}>{t('autoScan')}</Text>
            </View>
            <TouchableOpacity style={[styles.torchButton, torchOn && styles.torchButtonOn]} onPress={() => setTorchOn((current) => !current)} accessibilityRole="button" accessibilityLabel={torchOn ? t('flashOn') : t('flashOff')} accessibilityState={{ selected: torchOn }}>
              <AppIcon name="flash" color={torchOn ? '#F4A940' : '#FFFFFF'} size={APP_ICON_SIZES.header} />
            </TouchableOpacity>
          </View>
          <View style={styles.scanGuide} />
          <Text style={styles.cameraHelper}>{t('scanHint')}</Text>
          <ZoomSlider value={zoom} onChange={setZoom} label={t('zoom')} />
        </View>

        <View style={styles.cameraBottomBar}>
          <TouchableOpacity
            style={styles.imageButton}
            accessibilityRole="button"
            accessibilityLabel={t('scanFromImage')}
            onPress={handleImageScan}
            disabled={isImageLoading}
          >
            <AppIcon name="gallery" color="#FFFFFF" size={APP_ICON_SIZES.compact} />
            <Text style={styles.imageButtonText}>{isImageLoading ? t('scanning') : t('scanFromImage')}</Text>
          </TouchableOpacity>
        </View>

        {cameraError ? (
          <View style={styles.cameraError}>
            <Text style={styles.cameraErrorText}>{cameraError}</Text>
          </View>
        ) : null}

        <ResultModal content={result} theme={theme} onClose={closeResult} historyId={historyRecordId} linkBehavior={settings.linkBehavior} />
        <MultipleCodesModal contents={multipleResults} theme={theme} onSelect={(content) => void recordParsedAndPresent(content, 'image_picker')} onClose={closeResult} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Image
          source={isDark ? brandAssets.logoMarkWhite : brandAssets.logoMark}
          style={styles.logoMark}
          resizeMode="contain"
          accessibilityLabel="QR Scan logo"
        />
        <Image
          source={isDark ? brandAssets.logoPrimaryWhite : brandAssets.logoPrimary}
          style={styles.logoPrimary}
          resizeMode="contain"
          accessibilityLabel="QR Scan"
        />
        <Text style={[styles.title, { color: theme.text }]}>{t('scanTitle')}</Text>
        <Text style={[styles.body, { color: theme.textMuted }]}>{t('cameraOnly')}</Text>

        {permission.canRequestPermission ? (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            accessibilityLabel={t('enableCamera')}
            accessibilityRole="button"
            onPress={() => void permission.requestPermission()}
          >
            <Text style={styles.buttonText}>{t('enableCamera')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            accessibilityLabel={t('openSettings')}
            accessibilityRole="button"
            onPress={() => void Linking.openSettings()}
          >
            <Text style={styles.buttonText}>{t('openSettings')}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: theme.border }]}
          accessibilityLabel={t('scanFromImage')}
          accessibilityRole="button"
          onPress={handleImageScan}
          disabled={isImageLoading}
        >
          <AppIcon name="gallery" color={theme.primary} size={APP_ICON_SIZES.compact} />
          <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>
            {isImageLoading ? t('scanning') : t('scanFromImage')}
          </Text>
        </TouchableOpacity>
        {cameraError ? <Text style={[styles.errorText, { color: theme.danger }]}>{cameraError}</Text> : null}
      </View>
    </View>
  );
};

function parseDetection(value: string, format: string): ScannedContent {
  const parsed = contentParser.parse(value);
  const isQr = ['qr', 'qr-code'].includes(format.toLowerCase());
  if (parsed.type === 'text' && !isQr) {
    return { type: 'generic_barcode', rawPayload: value, format, code: value };
  }
  return parsed;
}

const ResultModal: React.FC<{
  content: ScannedContent | null;
  theme: typeof colors.light;
  onClose: () => void;
  historyId: string | null;
  linkBehavior: 'in_app' | 'external';
}> = ({ content, theme, onClose, historyId, linkBehavior }) => {
  const [browserOpen, setBrowserOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const { t } = useLocale();
  if (!content) return null;
  const title = getContentTitle(content);
  const detail = getContentDetail(content);
  const addAuthenticator = () => {
    if (content.type !== 'totp_provisioning' && content.type !== 'hotp_provisioning') return;
    Alert.alert('Add authenticator?', `${content.issuer} / ${content.accountName}\nThe secret will be stored in the secure device store.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Add securely',
        onPress: () => {
          void authenticatorRepository.saveAccount({
            type: content.type === 'totp_provisioning' ? 'TOTP' : 'HOTP',
            issuer: content.issuer,
            accountName: content.accountName,
            label: `${content.issuer}: ${content.accountName}`,
            algorithm: content.algorithm,
            digits: content.digits,
            period: content.type === 'totp_provisioning' ? content.period : 30,
            counter: content.type === 'hotp_provisioning' ? content.counter : undefined,
            isFavorite: false,
            sortOrder: 0,
          }, content.secret).then(async (account) => {
            if (historyId) await historyRepository.linkAuthenticator(historyId, account.id);
            onClose();
          }).catch(() => Alert.alert('Could not add account', 'Check the setup key and try again.'));
        },
      },
    ]);
  };

  const importAuthenticatorAccounts = () => {
    if (content.type !== 'totp_migration') return;
    const migration = content;
    Alert.alert(t('importAccountsTitle'), `${migration.accounts.length} accounts\n${t('importAccountsBody')}`, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('importSecurely'),
        onPress: () => {
          void (async () => {
            try {
              const existing = await authenticatorRepository.getAllAccounts();
              const known = new Set(existing.map((account) => `${account.type}:${account.issuer}:${account.accountName}`.toLowerCase()));
              let imported = 0;
              let skipped = 0;
              let failed = 0;
              for (const account of migration.accounts) {
                const key = `${account.type === 'totp_provisioning' ? 'TOTP' : 'HOTP'}:${account.issuer}:${account.accountName}`.toLowerCase();
                if (known.has(key)) {
                  skipped += 1;
                  continue;
                }
                try {
                  await authenticatorRepository.saveAccount({
                    type: account.type === 'totp_provisioning' ? 'TOTP' : 'HOTP',
                    issuer: account.issuer,
                    accountName: account.accountName,
                    label: `${account.issuer}: ${account.accountName}`,
                    algorithm: account.algorithm,
                    digits: account.digits,
                    period: account.type === 'totp_provisioning' ? account.period : 30,
                    counter: account.type === 'hotp_provisioning' ? account.counter : undefined,
                    isFavorite: false,
                    sortOrder: 0,
                  }, account.secret);
                  known.add(key);
                  imported += 1;
                } catch {
                  failed += 1;
                }
              }
              Alert.alert(t('importAccounts'), `Imported ${imported}; skipped ${skipped}; failed ${failed}.`, [{ text: t('close'), onPress: onClose }]);
            } catch {
              Alert.alert(t('importAccounts'), 'Could not read existing authenticator accounts. Nothing was imported.');
            }
          })();
        },
      },
    ]);
  };

  const copyContent = () => {
    Clipboard.setString(contentToCopy(content));
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  const handleAction = () => {
    switch (content.type) {
      case 'url':
        if (linkBehavior === 'external') void Linking.openURL(content.url).catch(() => Alert.alert('Unable to open link'));
        else setBrowserOpen(true);
        break;
      case 'text': Clipboard.setString(content.text); break;
      case 'email': void Linking.openURL(`mailto:${content.recipient}`).catch(() => undefined); break;
      case 'phone': void Linking.openURL(`tel:${content.phoneNumber}`).catch(() => undefined); break;
      case 'sms': void Linking.openURL(`sms:${content.phoneNumber}`).catch(() => undefined); break;
      case 'wifi': void nativeActionService.openWifiSettings().catch(() => Alert.alert('Unable to open Wi-Fi settings')); break;
      case 'contact': void nativeActionService.addContact(content).then((handled) => { if (!handled) void Share.share({ message: makeVCard(content) }); }).catch(() => void Share.share({ message: makeVCard(content) })); break;
      case 'calendar_event': void nativeActionService.addCalendarEvent(content).then((handled) => { if (!handled) void Share.share({ message: makeCalendarInvite(content) }); }).catch(() => void Share.share({ message: makeCalendarInvite(content) })); break;
      case 'location': void nativeActionService.openLocation(content.latitude, content.longitude).catch(() => Alert.alert('Unable to open maps')); break;
      case 'totp_provisioning':
      case 'hotp_provisioning': addAuthenticator(); break;
      case 'totp_migration': importAuthenticatorAccounts(); break;
      default: void Share.share({ message: detail }); break;
    }
  };

  const primaryLabel = content.type === 'url' ? (linkBehavior === 'external' ? t('openExternally') : t('openInApp')) : content.type === 'text' ? t('copy') : content.type === 'totp_provisioning' || content.type === 'hotp_provisioning' ? t('addAuthenticator') : content.type === 'totp_migration' ? t('importAccounts') : content.type === 'wifi' ? t('openWifi') : content.type === 'contact' ? 'Share contact card' : content.type === 'calendar_event' ? 'Share calendar invite' : t('takeAction');

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <DismissibleBackdrop style={styles.modalBackdrop} onDismiss={onClose}>
        <View style={[styles.resultSheet, { backgroundColor: theme.card }]}>
          <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
          <ScrollView style={styles.resultContent} contentContainerStyle={styles.resultContentInner} nestedScrollEnabled>
            <Text style={[styles.sheetEyebrow, { color: theme.primary }]}>{content.type.replace(/_/g, ' ').toUpperCase()}</Text>
            <Text style={[styles.sheetTitle, { color: theme.text }]}>{title}</Text>
            <Text selectable style={[styles.sheetDetail, { color: theme.textMuted }]}>{detail}</Text>
            {content.type === 'totp_migration' ? (
              <View style={styles.migrationList}>
                {content.accounts.map((account, index) => (
                  <View key={`${account.type}-${account.issuer}-${account.accountName}-${index}`} style={[styles.migrationRow, { borderColor: theme.border }]}>
                    <Text style={[styles.migrationIssuer, { color: theme.text }]} numberOfLines={1}>{account.issuer}</Text>
                    <Text style={[styles.migrationAccount, { color: theme.textMuted }]} numberOfLines={1}>{account.accountName}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </ScrollView>
          <View style={styles.resultActions}>
            <Pressable onPress={copyContent} accessibilityRole="button" accessibilityLabel={t('copyContent')}><Text style={[styles.closeText, { color: theme.primary }]}>{copied ? t('copied') : t('copyContent')}</Text></Pressable>
            <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleAction} accessibilityRole="button" accessibilityLabel={primaryLabel}>
              <Text style={styles.buttonText}>{primaryLabel}</Text>
            </TouchableOpacity>
            {content.type === 'text' ? <Pressable onPress={() => void Share.share({ message: content.text })} accessibilityRole="button" accessibilityLabel="Share text"><Text style={[styles.closeText, { color: theme.primary }]}>Share text</Text></Pressable> : null}
            {content.type === 'wifi' && content.password ? <Pressable onPress={() => Clipboard.setString(content.password || '')} accessibilityRole="button" accessibilityLabel="Copy Wi-Fi password"><Text style={[styles.closeText, { color: theme.primary }]}>Copy Wi-Fi password</Text></Pressable> : null}
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close result">
              <Text style={[styles.closeText, { color: theme.textMuted }]}>Close</Text>
            </Pressable>
          </View>
        </View>
      </DismissibleBackdrop>
      {browserOpen && content.type === 'url' ? (
        <Modal visible animationType="slide" onRequestClose={() => setBrowserOpen(false)}>
          <View style={styles.browserModal}>
            <Pressable onPress={() => setBrowserOpen(false)} accessibilityRole="button" accessibilityLabel="Close in-app browser"><Text style={[styles.closeText, { color: theme.primary }]}>Close browser</Text></Pressable>
            <WebView source={{ uri: content.url }} startInLoadingState style={styles.browser} />
          </View>
        </Modal>
      ) : null}
    </Modal>
  );
};

function contentToCopy(content: ScannedContent): string {
  switch (content.type) {
    case 'url': return content.url;
    case 'text': return content.text;
    case 'wifi': return `WIFI:S:${content.ssid};T:${content.encryption};P:${content.password ?? ''};;`;
    case 'email': return content.recipient;
    case 'phone': return content.phoneNumber;
    case 'sms': return [content.phoneNumber, content.message].filter(Boolean).join('\n');
    case 'contact': return makeVCard(content);
    case 'location': return `${content.latitude},${content.longitude}`;
    case 'calendar_event': return makeCalendarInvite(content);
    case 'totp_provisioning':
    case 'hotp_provisioning': return `${content.issuer} / ${content.accountName}`;
    case 'totp_migration': return `Authenticator import (${content.accounts.length} accounts)`;
    case 'product_barcode':
    case 'isbn':
    case 'generic_barcode': return content.code;
    case 'unsupported': return content.rawPayload;
  }
}

const MultipleCodesModal: React.FC<{
  contents: ScannedContent[];
  theme: typeof colors.light;
  onSelect: (content: ScannedContent) => void;
  onClose: () => void;
}> = ({ contents, theme, onSelect, onClose }) => {
  if (contents.length === 0) return null;
  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <DismissibleBackdrop style={styles.modalBackdrop} onDismiss={onClose}>
        <View style={[styles.resultSheet, { backgroundColor: theme.card }]}>
          <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
          <Text style={[styles.sheetTitle, { color: theme.text }]}>Multiple codes found</Text>
          {contents.map((content, index) => (
            <Pressable
              key={`${content.type}-${index}`}
              style={[styles.codeRow, { borderColor: theme.border }]}
              onPress={() => onSelect(content)}
              accessibilityRole="button"
              accessibilityLabel={`Select ${getContentTitle(content)}`}
            >
              <View style={styles.codeRowCopy}>
                <Text style={[styles.codeRowTitle, { color: theme.text }]}>{getContentTitle(content)}</Text>
                <Text style={[styles.codeRowDetail, { color: theme.textMuted }]}>{content.type.replace(/_/g, ' ')}</Text>
              </View>
              <AppIcon name="chevronRight" color={theme.primary} size={APP_ICON_SIZES.header} />
            </Pressable>
          ))}
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close multiple codes">
            <Text style={[styles.closeText, { color: theme.textMuted }]}>Close</Text>
          </Pressable>
        </View>
      </DismissibleBackdrop>
    </Modal>
  );
};

function getContentTitle(content: ScannedContent): string {
  switch (content.type) {
    case 'url': return content.domain;
    case 'text': return 'Text';
    case 'wifi': return content.ssid;
    case 'email': return content.recipient;
    case 'phone': return content.phoneNumber;
    case 'sms': return content.phoneNumber;
    case 'contact': return content.name;
    case 'location': return 'Location';
    case 'calendar_event': return content.title;
    case 'totp_provisioning':
    case 'hotp_provisioning': return content.issuer;
    case 'totp_migration': return `${content.accounts.length} authenticator accounts`;
    case 'product_barcode':
    case 'isbn':
    case 'generic_barcode': return content.code;
    case 'unsupported': return 'Unsupported code';
  }
}

function getContentDetail(content: ScannedContent): string {
  switch (content.type) {
    case 'url': return content.url;
    case 'text': return content.text;
    case 'wifi': return `Network: ${content.ssid}\nSecurity: ${content.encryption}`;
    case 'email': return [content.recipient, content.subject].filter(Boolean).join('\n');
    case 'phone': return content.phoneNumber;
    case 'sms': return [content.phoneNumber, content.message].filter(Boolean).join('\n');
    case 'contact': return [content.name, content.organization, content.phone, content.email].filter(Boolean).join('\n');
    case 'location': return `${content.latitude}, ${content.longitude}`;
    case 'calendar_event': return [content.title, content.startDate, content.location].filter(Boolean).join('\n');
    case 'totp_provisioning':
    case 'hotp_provisioning': return `${content.accountName}\nSecret stored only after confirmation.`;
    case 'totp_migration': return `${content.accounts.length} authenticator accounts found.\nReview the list before importing.`;
    case 'product_barcode':
    case 'isbn':
    case 'generic_barcode': return `${content.format}\n${content.code}`;
    case 'unsupported': return content.errorHint || 'This code format is not supported yet.';
  }
}

function makeVCard(content: Extract<ScannedContent, { type: 'contact' }>): string {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${escapeVCard(content.name)}`];
  if (content.organization) lines.push(`ORG:${escapeVCard(content.organization)}`);
  if (content.phone) lines.push(`TEL:${escapeVCard(content.phone)}`);
  if (content.email) lines.push(`EMAIL:${escapeVCard(content.email)}`);
  lines.push('END:VCARD');
  return lines.join('\n');
}

const ZoomSlider: React.FC<{ value: number; onChange: (value: number) => void; label: string }> = ({ value, onChange, label }) => {
  const trackWidth = useRef(0);
  const gestureStartValue = useRef(value);
  const updateFromGesture = useCallback((deltaX: number) => {
    onChange(zoomFromGesture(gestureStartValue.current, deltaX, trackWidth.current));
  }, [onChange]);
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderGrant: (event) => {
      const nextValue = zoomFromTrackPosition(event.nativeEvent.locationX, trackWidth.current);
      gestureStartValue.current = nextValue;
      onChange(nextValue);
    },
    onPanResponderMove: (_, gestureState) => updateFromGesture(gestureState.dx),
    onPanResponderTerminationRequest: () => false,
    onShouldBlockNativeResponder: () => true,
  }), [onChange, updateFromGesture]);
  const progress = (Math.max(1, Math.min(5, value)) - 1) / 4;

  return (
    <View style={styles.zoomSliderWrap} accessibilityLabel={`${label} ${value.toFixed(1)}x`} accessibilityRole="adjustable">
      <Text style={styles.zoomSliderLabel}>{label}</Text>
      <View
        style={styles.zoomTrack}
        onLayout={(event) => { trackWidth.current = event.nativeEvent.layout.width; }}
        {...responder.panHandlers}
      >
        <View pointerEvents="none" style={[styles.zoomTrackFill, { width: `${progress * 100}%` }]} />
        <View pointerEvents="none" style={[styles.zoomThumb, { left: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.zoomValue}>{value.toFixed(1)}x</Text>
    </View>
  );
};

function makeCalendarInvite(content: Extract<ScannedContent, { type: 'calendar_event' }>): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', `SUMMARY:${escapeVCard(content.title)}`];
  if (content.startDate) lines.push(`DTSTART:${content.startDate.replace(/[-:]/g, '')}`);
  if (content.endDate) lines.push(`DTEND:${content.endDate.replace(/[-:]/g, '')}`);
  if (content.location) lines.push(`LOCATION:${escapeVCard(content.location)}`);
  if (content.description) lines.push(`DESCRIPTION:${escapeVCard(content.description)}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\n');
}

function escapeVCard(value: string): string {
  return value.replace(/[\\;,\n]/g, (match) => match === '\n' ? '\\n' : `\\${match}`);
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 420, borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1 },
  logoMark: { width: 64, height: 64, marginBottom: 12 },
  logoPrimary: { width: 220, height: 80, marginBottom: 10 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  body: { fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  button: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10, width: '100%', alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  secondaryButton: { flexDirection: 'row', gap: 8, paddingVertical: 11, paddingHorizontal: 24, borderRadius: 10, width: '100%', alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginTop: 10 },
  secondaryButtonText: { fontSize: 15, fontWeight: '600' },
  errorText: { marginTop: 14, textAlign: 'center', fontSize: 13 },
  cameraRoot: { flex: 1, backgroundColor: '#05070B' },
  cameraOverlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  cameraTopBar: { position: 'absolute', top: 24, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cameraMark: { width: 34, height: 34 },
  autoChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(5, 7, 11, 0.7)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#34D399', marginRight: 7 },
  autoChipText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  torchButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(5, 7, 11, 0.7)', borderRadius: 21, borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)' },
  torchButtonOn: { backgroundColor: 'rgba(255, 196, 74, 0.22)', borderColor: '#F4A940' },
  scanGuide: { width: '72%', aspectRatio: 1, borderWidth: 2, borderColor: '#FFFFFF', borderRadius: 24, opacity: 0.9 },
  cameraHelper: { position: 'absolute', bottom: 178, color: '#FFFFFF', fontSize: 15, fontWeight: '500', textAlign: 'center', paddingHorizontal: 22 },
  zoomSliderWrap: { position: 'absolute', bottom: 126, left: 28, right: 28, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(5, 7, 11, 0.62)', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 9 },
  zoomSliderLabel: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  zoomTrack: { flex: 1, height: 24, justifyContent: 'center' },
  zoomTrackFill: { position: 'absolute', left: 0, height: 4, borderRadius: 2, backgroundColor: '#FFFFFF' },
  zoomThumb: { position: 'absolute', top: 5, width: 14, height: 14, marginLeft: -7, borderRadius: 7, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#5FD3B3' },
  zoomValue: { color: '#FFFFFF', fontSize: 12, minWidth: 30, textAlign: 'right', fontWeight: '700' },
  cameraBottomBar: { position: 'absolute', bottom: 28, left: 20, right: 20, alignItems: 'center' },
  imageButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20 },
  imageButtonText: { color: '#FFFFFF', fontWeight: '600' },
  cameraError: { position: 'absolute', top: 74, left: 20, right: 20, backgroundColor: 'rgba(240, 106, 106, 0.9)', borderRadius: 10, padding: 10 },
  cameraErrorText: { color: '#FFFFFF', textAlign: 'center', fontSize: 13 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  resultSheet: { width: '100%', maxHeight: '88%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 32 },
  resultContent: { flexShrink: 1 },
  resultContentInner: { paddingBottom: 8 },
  resultActions: { flexShrink: 0 },
  sheetHandle: { width: 42, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetEyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  sheetTitle: { fontSize: 24, fontWeight: '700', marginBottom: 12 },
  sheetDetail: { fontSize: 15, lineHeight: 22, marginBottom: 24 },
  closeText: { textAlign: 'center', paddingVertical: 16, fontSize: 15, fontWeight: '600' },
  codeRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 10 },
  codeRowCopy: { flex: 1 },
  codeRowTitle: { fontSize: 15, fontWeight: '600' },
  codeRowDetail: { fontSize: 12, marginTop: 4, textTransform: 'capitalize' },
  codeRowArrow: { fontSize: 28, fontWeight: '300', marginLeft: 12 },
  migrationList: { maxHeight: 240, marginBottom: 8 },
  migrationRow: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 8 },
  migrationIssuer: { fontSize: 14, fontWeight: '700' },
  migrationAccount: { fontSize: 12, marginTop: 2 },
  browserModal: { flex: 1, backgroundColor: '#FFFFFF', paddingTop: 20 },
  browser: { flex: 1 },
});
