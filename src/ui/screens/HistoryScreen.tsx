import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Image, Pressable, RefreshControl, Share, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { historyRepository } from '../../data/appContainer';
import { ScanHistoryItem } from '../../domain/models/ScanHistoryItem';
import { brandAssets } from '../assets';
import { colors } from '../theme/colors';
import { historyAsCsv, historyAsJson } from '../../services/history/HistoryExportService';
import { SwipeableRow } from '../components/SwipeableRow';
import { useLocale } from '../i18n';
import { APP_ICON_SIZES, AppIcon } from '../components/AppIcon';

type Filter = 'all' | 'favorites';

export const HistoryScreen: React.FC = () => {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const { t } = useLocale();
  const [items, setItems] = useState<ScanHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      setItems(await historyRepository.getAll());
      setError(null);
    } catch {
      setError('History could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void loadHistory(); }, [loadHistory]));

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filter === 'favorites' && !item.isFavorite) return false;
      if (!normalized) return true;
      return [item.displayTitle, item.displaySubtitle, item.safeValue, item.contentType].some((value) => value.toLowerCase().includes(normalized));
    });
  }, [filter, items, query]);

  const confirmClear = () => Alert.alert('Clear history?', 'All non-secret scan history will be removed.', [
    { text: t('cancel'), style: 'cancel' },
    { text: 'Clear', style: 'destructive', onPress: () => void historyRepository.clearAll().then(loadHistory) },
  ]);

  const toggleFavorite = async (id: string) => {
    await historyRepository.toggleFavorite(id);
    await loadHistory();
  };

  const deleteItem = (item: ScanHistoryItem) => Alert.alert('Xóa bản quét?', item.displayTitle, [
    { text: t('cancel'), style: 'cancel' },
    { text: t('delete'), style: 'destructive', onPress: () => void historyRepository.delete(item.id).then(loadHistory) },
  ]);

  const exportHistory = async (format: 'csv' | 'json') => {
    try {
      const message = format === 'csv' ? historyAsCsv(items) : historyAsJson(items);
      await Share.share({ title: `QR Scan history (${format.toUpperCase()})`, message });
    } catch {
      setError('History could not be exported.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <View style={styles.toolbar}>
        <TextInput value={query} onChangeText={setQuery} placeholder={t('searchScans')} placeholderTextColor={theme.textMuted} style={[styles.search, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} accessibilityLabel={t('searchScans')} />
        <View style={styles.filterRow}>
          <Pressable onPress={() => setFilter('all')} style={[styles.filterButton, { borderColor: filter === 'all' ? theme.primary : theme.border }]} accessibilityRole="button" accessibilityLabel={t('all')} accessibilityState={{ selected: filter === 'all' }}><Text style={{ color: filter === 'all' ? theme.primary : theme.textMuted }}>{t('all')}</Text></Pressable>
          <Pressable onPress={() => setFilter('favorites')} style={[styles.filterButton, { borderColor: filter === 'favorites' ? theme.primary : theme.border }]} accessibilityRole="button" accessibilityLabel={t('favorites')} accessibilityState={{ selected: filter === 'favorites' }}><Text style={{ color: filter === 'favorites' ? theme.primary : theme.textMuted }}>{t('favorites')}</Text></Pressable>
          {items.length ? <Pressable onPress={() => void exportHistory('json')} style={styles.exportButton} accessibilityRole="button" accessibilityLabel="Export history as JSON"><Text style={{ color: theme.primary }}>JSON</Text></Pressable> : null}
          {items.length ? <Pressable onPress={() => void exportHistory('csv')} style={styles.exportButton} accessibilityRole="button" accessibilityLabel="Export history as CSV"><Text style={{ color: theme.primary }}>CSV</Text></Pressable> : null}
          {items.length ? <Pressable onPress={confirmClear} style={styles.clearButton} accessibilityRole="button" accessibilityLabel={t('clear')}><Text style={{ color: theme.danger }}>{t('clear')}</Text></Pressable> : null}
        </View>
      </View>
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, filteredItems.length === 0 && styles.emptyListContent]}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => void loadHistory()} tintColor={theme.primary} />}
        ListEmptyComponent={
          <View style={[styles.emptyContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
            <Image source={isDark ? brandAssets.logoMarkWhite : brandAssets.logoMark} style={styles.logoMark} resizeMode="contain" accessibilityLabel="QR Scan logo" />
            <Text style={[styles.title, { color: theme.text }]}>{error || (items.length ? t('noMatchingScans') : t('noScans'))}</Text>
            <Text style={[styles.body, { color: theme.textMuted }]}>{error ? 'Kéo xuống để thử lại.' : t('historyEmptyBody')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <SwipeableRow
            direction="left"
            backgroundColor={theme.card}
            borderColor={theme.border}
            actions={[
              { key: 'favorite', icon: 'favorite', label: item.isFavorite ? t('unfavorite') : t('favorite'), color: theme.primary, onPress: () => void toggleFavorite(item.id) },
              { key: 'delete', icon: 'delete', label: t('delete'), color: theme.danger, onPress: () => deleteItem(item) },
            ]}
          >
          <View style={[styles.row, { backgroundColor: theme.card }]}>
            <View style={styles.rowCopy}>
              <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={1}>{item.displayTitle}</Text>
              <Text style={[styles.rowSubtitle, { color: theme.textMuted }]} numberOfLines={2}>{item.displaySubtitle}</Text>
              <Text style={[styles.rowDate, { color: theme.textMuted }]}>{new Date(item.createdAt).toLocaleString()}</Text>
            </View>
            {item.isFavorite ? <AppIcon name="favorite" color={theme.warning} size={APP_ICON_SIZES.compact} style={styles.favoriteMark} /> : null}
            <Text style={[styles.rowType, { color: theme.primary }]}>{item.contentType.replace(/_/g, ' ')}</Text>
          </View>
          </SwipeableRow>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  toolbar: { padding: 16, paddingBottom: 6 },
  search: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 11, fontSize: 15 },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  filterButton: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  clearButton: { marginLeft: 'auto', paddingHorizontal: 6, paddingVertical: 7 },
  exportButton: { paddingHorizontal: 4, paddingVertical: 7 },
  listContent: { padding: 16, paddingTop: 8, gap: 10 },
  emptyListContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { width: '100%', maxWidth: 420, borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1 },
  logoMark: { width: 56, height: 56, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  body: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  row: { borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'flex-start' },
  rowCopy: { flex: 1, paddingRight: 12 },
  rowTitle: { fontSize: 16, fontWeight: '700' },
  rowSubtitle: { fontSize: 13, marginTop: 5 },
  rowDate: { fontSize: 11, marginTop: 8 },
  rowType: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', maxWidth: 90, textAlign: 'right' },
  favoriteMark: { position: 'absolute', right: 14, bottom: 12 },
});
