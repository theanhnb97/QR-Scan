import { CameraRoll, iosRequestAddOnlyGalleryPermission } from '@react-native-camera-roll/camera-roll';
import Clipboard from '@react-native-clipboard/clipboard';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PermissionsAndroid,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
  View,
} from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useHeaderHeight } from '@react-navigation/elements';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot/lib/index.js';
import { Svg, Rect } from 'react-native-svg';
import Code128B from 'jsbarcode/bin/barcodes/CODE128/CODE128B';
import { colors } from '../theme/colors';
import { useLocale } from '../i18n';
import { copyImageToClipboard } from '../../services/clipboard/ImageClipboardService';
import { generatedHistoryRepository } from '../../data/appContainer';
import type { GeneratedCodeHistoryItem } from '../../domain/models/GeneratedCodeHistoryItem';
import { DismissibleBackdrop } from '../components/DismissibleBackdrop';
import { APP_ICON_SIZES, AppIcon } from '../components/AppIcon';

type CreateScreenProps = BottomTabScreenProps<{ Scan: undefined; History: undefined; Auth: undefined; Create: { openHistory?: number } | undefined }, 'Create'>;
const INPUT_ACCESSORY_ID = 'qr-scan-create-input-accessory';

type GeneratorMode = 'qr' | 'barcode';
type QrKind = 'text' | 'url' | 'wifi' | 'email' | 'phone';

export const CreateScreen: React.FC<CreateScreenProps> = ({ route, navigation }) => {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const { t } = useLocale();
  const headerHeight = useHeaderHeight();
  const previewRef = useRef<any>(null);
  const [mode, setMode] = useState<GeneratorMode>('qr');
  const [kind, setKind] = useState<QrKind>('text');
  const [value, setValue] = useState('');
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [generatedPayload, setGeneratedPayload] = useState('');
  const [generatedBarcode, setGeneratedBarcode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [generatedHistory, setGeneratedHistory] = useState<GeneratedCodeHistoryItem[]>([]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const candidatePayload = useMemo(() => {
    if (mode === 'barcode') return value.trim();
    switch (kind) {
      case 'url': return value.trim();
      case 'wifi': return `WIFI:T:WPA;S:${escapeWifi(ssid)};P:${escapeWifi(password)};;`;
      case 'email': return `mailto:${value.trim()}`;
      case 'phone': return `tel:${value.trim()}`;
      case 'text': return value;
    }
  }, [kind, mode, password, ssid, value]);

  const candidateBarcode = useMemo(() => {
    if (mode !== 'barcode' || !candidatePayload) return null;
    try {
      return new Code128B(candidatePayload, { text: candidatePayload }).encode().data;
    } catch {
      return null;
    }
  }, [candidatePayload, mode]);

  const handleGenerate = () => {
    if (!candidatePayload || (mode === 'barcode' && !candidateBarcode)) {
      setError(mode === 'barcode' ? 'Nhập nội dung in được cho mã vạch Code 128.' : 'Nhập nội dung để tạo mã.');
      return;
    }
    setGeneratedPayload(candidatePayload);
    setGeneratedBarcode(candidateBarcode);
    setError(null);
    void generatedHistoryRepository.add({
      mode,
      kind: mode === 'qr' ? kind : null,
      // Wi-Fi passwords are intentionally excluded from ordinary SQLite data.
      payload: mode === 'qr' && kind === 'wifi' ? null : candidatePayload,
      displayValue: mode === 'qr' && kind === 'wifi' ? `Wi-Fi: ${ssid.trim()}` : candidatePayload,
    }).then((item) => setGeneratedHistory((current) => [item, ...current].slice(0, 50))).catch(() => undefined);
    Keyboard.dismiss();
  };

  const openGeneratedHistory = async () => {
    try {
      setGeneratedHistory(await generatedHistoryRepository.getAll());
    } catch {
      setGeneratedHistory([]);
    }
    setHistoryVisible(true);
  };

  useEffect(() => {
    if (!route.params?.openHistory) return;
    void openGeneratedHistory();
    navigation.setParams({ openHistory: undefined });
  }, [navigation, route.params?.openHistory]);

  const restoreGeneratedCode = (item: GeneratedCodeHistoryItem) => {
    if (!item.payload) {
      setHistoryVisible(false);
      setError(t('historyUnavailable'));
      return;
    }
    setMode(item.mode);
    setGeneratedPayload('');
    setGeneratedBarcode(null);
    if (item.mode === 'barcode') {
      setValue(item.payload);
    } else {
      switch (item.kind) {
        case 'email': setValue(item.payload.replace(/^mailto:/i, '')); break;
        case 'phone': setValue(item.payload.replace(/^tel:/i, '')); break;
        default: setValue(item.payload); break;
      }
      if (item.kind) setKind(item.kind);
    }
    setHistoryVisible(false);
    setError(null);
  };

  const shareOrSave = async (save: boolean) => {
    setError(null);
    if (!generatedPayload || (mode === 'barcode' && !generatedBarcode)) {
      setError('Hãy bấm Tạo trước khi chia sẻ hoặc lưu ảnh.');
      return;
    }
    try {
      const uri = await captureRef(previewRef, { format: 'png', quality: 1, result: 'tmpfile' });
      if (save) {
        if (Platform.OS === 'ios') {
          const status = await iosRequestAddOnlyGalleryPermission();
          if (status !== 'granted' && status !== 'limited') throw new Error('Photos permission denied');
        } else if (Platform.OS === 'android' && Platform.Version < 29) {
          const status = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
          if (status !== PermissionsAndroid.RESULTS.GRANTED) throw new Error('Photos permission denied');
        }
        await CameraRoll.saveAsset(uri, { type: 'photo' });
        Alert.alert(t('saved'), t('savedToPhotos'));
      } else {
        await Share.share({ url: uri, message: generatedPayload });
      }
    } catch {
      setError(save ? t('saveFailed') : t('shareFailed'));
    }
  };

  const copyImage = async () => {
    if (!generatedPayload || (mode === 'barcode' && !generatedBarcode)) {
      setError('Hãy bấm Tạo trước khi sao chép ảnh.');
      return;
    }
    try {
      const uri = await captureRef(previewRef, { format: 'png', quality: 1, result: 'tmpfile' });
      const copied = await copyImageToClipboard(uri);
      if (!copied) throw new Error('Image clipboard unavailable');
      Alert.alert(t('copied'), t('copyImage'));
    } catch {
      Clipboard.setString(generatedPayload);
      Alert.alert(t('copy'), 'Thiết bị không hỗ trợ clipboard ảnh; nội dung mã đã được sao chép thay thế.');
    }
  };

  const inputPlaceholder = mode === 'barcode' ? 'Code 128' : kind === 'wifi' ? 'Tên mạng' : kind === 'url' ? 'https://example.com' : kind === 'email' ? 'name@example.com' : kind === 'phone' ? '+84...' : 'Nội dung';

  return (
    <KeyboardAvoidingView style={[styles.keyboardRoot, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        >
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.modeRow}>
        {(['qr', 'barcode'] as GeneratorMode[]).map((item) => (
          <TouchableOpacity key={item} onPress={() => { setMode(item); setGeneratedPayload(''); setGeneratedBarcode(null); }} style={[styles.modeButton, { borderColor: theme.border, backgroundColor: mode === item ? theme.primary : theme.surface }]} accessibilityRole="button" accessibilityLabel={`${t('generate')} ${item}`} accessibilityState={{ selected: mode === item }}>
            <Text style={{ color: mode === item ? '#FFFFFF' : theme.text, fontWeight: '700' }}>{item === 'qr' ? t('qrCode') : t('barcode')}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {mode === 'qr' ? (
        <View style={styles.kindRow}>
          {(['text', 'url', 'wifi', 'email', 'phone'] as QrKind[]).map((item) => (
            <TouchableOpacity key={item} onPress={() => { setKind(item); setGeneratedPayload(''); setGeneratedBarcode(null); }} style={[styles.kindButton, { borderColor: kind === item ? theme.primary : theme.border }]} accessibilityRole="button" accessibilityLabel={`${t('generate')} ${item} QR`} accessibilityState={{ selected: kind === item }}>
              <Text style={{ color: kind === item ? theme.primary : theme.textMuted, fontSize: 12, fontWeight: '600' }}>{item.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
      <View style={styles.inputActionRow}>
        <TextInput value={mode === 'qr' && kind === 'wifi' ? ssid : value} onChangeText={mode === 'qr' && kind === 'wifi' ? setSsid : setValue} placeholder={inputPlaceholder} placeholderTextColor={theme.textMuted} style={[styles.input, styles.inputFlex, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]} multiline={mode === 'qr' && kind === 'text'} autoCapitalize={kind === 'url' ? 'none' : 'sentences'} autoCorrect={false} spellCheck={false} textContentType="none" accessibilityLabel={mode === 'qr' && kind === 'wifi' ? 'Tên mạng Wi-Fi' : inputPlaceholder} inputAccessoryViewID={INPUT_ACCESSORY_ID} returnKeyType="done" onSubmitEditing={Keyboard.dismiss} blurOnSubmit={!(mode === 'qr' && kind === 'text')} />
        {!(mode === 'qr' && kind === 'wifi') ? <Pressable onPress={handleGenerate} style={[styles.generateButton, { backgroundColor: theme.primary }]} accessibilityRole="button" accessibilityLabel={t('generate')}><Text style={styles.generateButtonText}>{t('generate')}</Text></Pressable> : null}
      </View>
      {mode === 'qr' && kind === 'wifi' ? <TextInput value={password} onChangeText={setPassword} placeholder="Mật khẩu Wi-Fi (không bắt buộc)" placeholderTextColor={theme.textMuted} style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]} secureTextEntry autoCorrect={false} spellCheck={false} textContentType="none" accessibilityLabel="Mật khẩu Wi-Fi" inputAccessoryViewID={INPUT_ACCESSORY_ID} returnKeyType="done" onSubmitEditing={Keyboard.dismiss} /> : null}
      {mode === 'qr' && kind === 'wifi' ? <Pressable onPress={handleGenerate} style={[styles.generateButton, styles.generateFull, { backgroundColor: theme.primary }]} accessibilityRole="button" accessibilityLabel={t('generate')}><Text style={styles.generateButtonText}>{t('generate')}</Text></Pressable> : null}
      {keyboardVisible ? <Pressable onPress={Keyboard.dismiss} style={styles.dismissKeyboard} accessibilityRole="button" accessibilityLabel="Hide keyboard"><Text style={[styles.dismissKeyboardText, { color: theme.primary }]}>Hide keyboard</Text></Pressable> : null}
      <View ref={previewRef} collapsable={false} style={[styles.preview, { backgroundColor: '#FFFFFF' }]} accessibilityLabel="Generated code preview">
        {mode === 'qr' && generatedPayload ? <QRCode value={generatedPayload} size={220} color="#061A2D" backgroundColor="#FFFFFF" /> : null}
        {mode === 'barcode' && generatedBarcode ? <BarcodeSvg data={generatedBarcode} /> : null}
        {!generatedPayload || (mode === 'barcode' && !generatedBarcode) ? <Text style={styles.previewHint}>Mã xem trước sẽ xuất hiện sau khi bấm Tạo</Text> : null}
        {mode === 'barcode' && generatedBarcode ? <Text style={styles.barcodeLabel}>{generatedPayload}</Text> : null}
      </View>
      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
      {generatedPayload && (mode !== 'barcode' || generatedBarcode) ? (
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.primary }]} onPress={() => void shareOrSave(false)} accessibilityRole="button" accessibilityLabel={t('share')}><AppIcon name="share" color="#FFFFFF" size={APP_ICON_SIZES.action} style={styles.actionIcon} /><Text style={styles.actionText}>{t('share')}</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.primaryHover }]} onPress={() => void shareOrSave(true)} accessibilityRole="button" accessibilityLabel={t('saveImage')}><Text style={styles.actionText}>{t('saveImage')}</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.navy }]} onPress={() => void copyImage()} accessibilityRole="button" accessibilityLabel={t('copyImage')}><AppIcon name="copy" color="#FFFFFF" size={APP_ICON_SIZES.action} style={styles.actionIcon} /><Text style={styles.actionText}>{t('copyImage')}</Text></TouchableOpacity>
        </View>
      ) : null}
    </View>
        </ScrollView>
      </TouchableWithoutFeedback>
      {Platform.OS === 'ios' ? (
        <InputAccessoryView nativeID={INPUT_ACCESSORY_ID}>
          <View style={styles.inputAccessory}>
            <Pressable onPress={Keyboard.dismiss} accessibilityRole="button" accessibilityLabel="Dismiss keyboard" hitSlop={8}>
              <Text style={[styles.doneText, { color: theme.primary }]}>{t('done')}</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      ) : null}
      <Modal visible={historyVisible} transparent animationType="slide" onRequestClose={() => setHistoryVisible(false)}>
        <DismissibleBackdrop style={styles.historyBackdrop} onDismiss={() => setHistoryVisible(false)}>
          <View style={[styles.historyModal, { backgroundColor: theme.surface }]}>
            <View style={styles.historyModalHeader}>
              <Text style={[styles.historyModalTitle, { color: theme.text }]}>{t('generatedHistory')}</Text>
              <Pressable onPress={() => setHistoryVisible(false)} accessibilityRole="button" accessibilityLabel={t('close')}>
                <AppIcon name="close" color={theme.primary} size={APP_ICON_SIZES.header} />
              </Pressable>
            </View>
            {generatedHistory.length === 0 ? (
              <View style={styles.historyEmpty}>
                <Text style={[styles.historyEmptyTitle, { color: theme.text }]}>{t('generatedHistoryEmpty')}</Text>
                <Text style={[styles.historyEmptyBody, { color: theme.textMuted }]}>{t('generatedHistoryHint')}</Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.historyList}>
                {generatedHistory.map((item) => (
                  <Pressable key={item.id} onPress={() => restoreGeneratedCode(item)} style={[styles.historyItem, { borderColor: theme.border }]} accessibilityRole="button" accessibilityLabel={`${t('useGeneratedCode')}: ${item.displayValue}`}>
                    <View style={styles.historyItemCopy}>
                      <Text style={[styles.historyItemKind, { color: theme.primary }]}>{item.mode === 'barcode' ? t('barcode') : t('qrCode')}</Text>
                      <Text numberOfLines={2} style={[styles.historyItemValue, { color: theme.text }]}>{item.displayValue}</Text>
                      <Text style={[styles.historyItemDate, { color: theme.textMuted }]}>{new Date(item.createdAt).toLocaleString()}</Text>
                    </View>
                    <AppIcon name="chevronRight" color={theme.primary} size={APP_ICON_SIZES.header} />
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        </DismissibleBackdrop>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const BarcodeSvg: React.FC<{ data: string }> = ({ data }) => {
  const moduleWidth = 2;
  const height = 120;
  return (
    <Svg width={data.length * moduleWidth} height={height} viewBox={`0 0 ${data.length * moduleWidth} ${height}`}>
      {data.split('').map((bit, index) => bit === '1' ? <Rect key={index} x={index * moduleWidth} y={0} width={moduleWidth} height={height} fill="#061A2D" /> : null)}
    </Svg>
  );
};

function escapeWifi(value: string): string {
  return value.replace(/([\\;,:\"])/g, '\\$1');
}

const styles = StyleSheet.create({
  keyboardRoot: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  container: { flex: 1, padding: 16 },
  modeRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  modeButton: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  kindRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  kindButton: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 7 },
  inputActionRow: { flexDirection: 'row', alignItems: 'stretch', gap: 8 },
  inputFlex: { flex: 1 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 12, minHeight: 48, marginBottom: 10, fontSize: 15 },
  generateButton: { minWidth: 74, minHeight: 48, borderRadius: 10, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  generateFull: { alignSelf: 'flex-end' },
  generateButtonText: { color: '#FFFFFF', fontWeight: '800' },
  dismissKeyboard: { alignSelf: 'flex-end', paddingVertical: 4, paddingHorizontal: 2, marginBottom: 4 },
  dismissKeyboardText: { fontSize: 13, fontWeight: '700' },
  preview: { minHeight: 280, borderRadius: 14, alignItems: 'center', justifyContent: 'center', padding: 20, marginTop: 8 },
  previewHint: { color: '#7A8792', fontSize: 13 },
  barcodeLabel: { color: '#061A2D', marginTop: 12, fontSize: 12 },
  error: { textAlign: 'center', fontSize: 13, marginTop: 10 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  actionButton: { flex: 1, minWidth: 92, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  actionIcon: { marginBottom: 4 },
  actionText: { color: '#FFFFFF', fontWeight: '700' },
  inputAccessory: { alignItems: 'flex-end', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#F4F7FA', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#CBD5E1' },
  doneText: { fontSize: 16, fontWeight: '700' },
  historyBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  historyModal: { maxHeight: '78%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 12 },
  historyModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  historyModalTitle: { fontSize: 20, fontWeight: '800' },
  historyList: { gap: 10, paddingBottom: 12 },
  historyItem: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 12 },
  historyItemCopy: { flex: 1 },
  historyItemKind: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginBottom: 3 },
  historyItemValue: { fontSize: 15, fontWeight: '600' },
  historyItemDate: { fontSize: 11, marginTop: 5 },
  historyEmpty: { alignItems: 'center', paddingVertical: 32 },
  historyEmptyTitle: { fontSize: 17, fontWeight: '700', marginBottom: 6 },
  historyEmptyBody: { fontSize: 13, textAlign: 'center' },
});
