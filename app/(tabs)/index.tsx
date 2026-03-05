import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Product } from '@/types';
import { useTheme } from '@/theme/ThemeContext';
import { getAllProducts, deleteProducts, searchProducts } from '@/repositories/productRepository';
import { ProductCard } from '@/components/ui/ProductCard';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { spacing } from '@/theme/spacing';
import { fontSizes, fontWeights } from '@/theme/typography';

// ─── Types for the sectioned flat list ───────────────────────────────────────

type DateHeaderItem = {
  type: 'header';
  label: string;
  key: string;
};

type ProductRowItem = {
  type: 'row';
  products: Product[];
  key: string;
};

type ListItem = DateHeaderItem | ProductRowItem;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateLabel(dateStr: string): string {
  // dateStr is 'YYYY-MM-DD' (the key extracted from created_at).
  // ⚠️ IMPORTANT: new Date('YYYY-MM-DD') is parsed as UTC midnight by the
  // ECMAScript spec, which shifts the date backwards in negative-offset
  // timezones (e.g. UTC-3 → the previous calendar day at 21:00 local).
  // To avoid this, we construct the date with the local-time constructor.
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day); // always local midnight

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return 'Hoy';
  if (sameDay(date, yesterday)) return 'Ayer';

  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function extractDateKey(dateStr: string): string {
  // Returns 'YYYY-MM-DD' regardless of time component
  return dateStr.split('T')[0].split(' ')[0];
}

/**
 * Transforms a flat array of products (ordered by created_at DESC)
 * into a flat list of DateHeader + ProductRow items suitable for FlatList.
 * Each row holds up to `numColumns` products.
 */
const CELL_GAP = 3; // px — separación entre celdas estilo Google Photos

function buildListItems(products: Product[], numColumns: number): ListItem[] {
  if (products.length === 0) return [];

  const sections: Map<string, Product[]> = new Map();

  for (const product of products) {
    const key = extractDateKey(product.created_at ?? '');
    if (!sections.has(key)) sections.set(key, []);
    sections.get(key)!.push(product);
  }

  const items: ListItem[] = [];

  for (const [dateKey, group] of sections) {
    const label = formatDateLabel(dateKey);
    items.push({ type: 'header', label, key: `header-${dateKey}` });

    for (let i = 0; i < group.length; i += numColumns) {
      const rowProducts = group.slice(i, i + numColumns);
      items.push({
        type: 'row',
        products: rowProducts,
        key: `row-${dateKey}-${i}`,
      });
    }
  }

  return items;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GalleryScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const numColumns = width >= 600 ? 4 : 3;

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const PAGE_SIZE = 20;

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Data fetching ────────────────────────────────────────────────────────

  const loadInitialProducts = useCallback(async (query: string = '') => {
    setIsLoading(true);
    setSearchQuery(query);
    try {
      const data = query.trim()
        ? await searchProducts(query, PAGE_SIZE, 0)
        : await getAllProducts(PAGE_SIZE, 0);
      setProducts(data);
      setPage(2);
      setHasMore(data.length === PAGE_SIZE);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los productos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMoreProducts = useCallback(async () => {
    if (!hasMore || isLoading || isFetchingMore) return;
    setIsFetchingMore(true);
    try {
      const offset = (page - 1) * PAGE_SIZE;
      const data = searchQuery.trim()
        ? await searchProducts(searchQuery, PAGE_SIZE, offset)
        : await getAllProducts(PAGE_SIZE, offset);
      setProducts(prev => [...prev, ...data]);
      setPage(prev => prev + 1);
      setHasMore(data.length === PAGE_SIZE);
    } catch {
      // Error silencioso en background fetch
    } finally {
      setIsFetchingMore(false);
    }
  }, [hasMore, isLoading, isFetchingMore, page, searchQuery]);

  useFocusEffect(
    useCallback(() => {
      const refreshCurrentData = async () => {
        try {
          const quantity = Math.max(products.length, PAGE_SIZE);
          const data = searchQuery.trim()
            ? await searchProducts(searchQuery, quantity, 0)
            : await getAllProducts(quantity, 0);
          setProducts(data);
        } catch {
          // ignorar
        }
      };

      if (products.length === 0 && isLoading) {
        loadInitialProducts(searchQuery);
      } else if (products.length > 0) {
        refreshCurrentData();
      }

      setIsSelectionMode(false);
      setSelectedIds(new Set());
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery])
  );

  // ── Grouped list data ────────────────────────────────────────────────────

  const listItems = useMemo(
    () => buildListItems(products, numColumns),
    [products, numColumns]
  );

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSearch = useCallback(
    (query: string) => { loadInitialProducts(query); },
    [loadInitialProducts]
  );

  const handleProductPress = useCallback(
    (product: Product) => {
      if (isSelectionMode) {
        setSelectedIds(prev => {
          const next = new Set(prev);
          if (next.has(product.id)) next.delete(product.id);
          else next.add(product.id);
          return next;
        });
      } else {
        router.push(`/product/${product.id}`);
      }
    },
    [isSelectionMode]
  );

  const handleLongPress = useCallback((product: Product) => {
    setIsSelectionMode(true);
    setSelectedIds(new Set([product.id]));
  }, []);

  const handleCancelSelection = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    setDeleteModalVisible(true);
  }, [selectedIds]);

  const confirmDelete = useCallback(async () => {
    setDeleteModalVisible(false);
    setIsDeleting(true);
    try {
      await deleteProducts(Array.from(selectedIds));
      setIsSelectionMode(false);
      setSelectedIds(new Set());
      await loadInitialProducts(searchQuery);
    } catch {
      Alert.alert('Error', 'No se pudieron eliminar los productos seleccionados');
    } finally {
      setIsDeleting(false);
    }
  }, [selectedIds, loadInitialProducts, searchQuery]);

  // ── Render helpers ───────────────────────────────────────────────────────

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === 'header') {
        return (
          <View style={[styles.sectionHeader, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionHeaderText, { color: colors.textSecondary }]}>
              {item.label}
            </Text>
          </View>
        );
      }

      // Product row — fill up to numColumns slots
      return (
        <View style={styles.row}>
          {item.products.map(product => (
            <View key={String(product.id)} style={[styles.cellWrapper, { margin: CELL_GAP / 2 }]}>
              <ProductCard
                product={product}
                isSelected={selectedIds.has(product.id)}
                isSelectionMode={isSelectionMode}
                onPress={handleProductPress}
                onLongPress={handleLongPress}
              />
            </View>
          ))}
          {/* Phantom cells to keep grid alignment on last row */}
          {Array.from({ length: numColumns - item.products.length }).map((_, i) => (
            <View key={`phantom-${i}`} style={[styles.phantomCell, { margin: CELL_GAP / 2 }]} />
          ))}
        </View>
      );
    },
    [colors, selectedIds, isSelectionMode, handleProductPress, handleLongPress, numColumns]
  );

  const keyExtractor = useCallback((item: ListItem) => item.key, []);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header: selection bar or search */}
      {isSelectionMode ? (
        <View style={[styles.selectionBar, { backgroundColor: colors.primary }]}>
          <TouchableOpacity onPress={handleCancelSelection} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={24} color={colors.textOnPrimary} />
          </TouchableOpacity>
          <Text style={[styles.selectionText, { color: colors.textOnPrimary }]}>
            {selectedIds.size} seleccionado{selectedIds.size !== 1 ? 's' : ''}
          </Text>
          <TouchableOpacity
            onPress={handleDeleteSelected}
            disabled={isDeleting || selectedIds.size === 0}
          >
            <Ionicons
              name="trash"
              size={24}
              color={selectedIds.size > 0 ? colors.accent : colors.textDisabled}
            />
          </TouchableOpacity>
        </View>
      ) : (
        <SearchBar onSearch={handleSearch} />
      )}

      <FlatList
        data={listItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          listItems.length === 0 ? styles.emptyList : null,
          { paddingBottom: insets.bottom + spacing['2xl'] },
        ]}
        onRefresh={() => loadInitialProducts(searchQuery)}
        refreshing={isLoading && products.length === 0}
        onEndReached={loadMoreProducts}
        onEndReachedThreshold={0.5}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={5}
        ListFooterComponent={
          isFetchingMore ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ margin: spacing.md }} />
          ) : null
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="cube-outline"
              title="Sin productos"
              description="Ve a la pestaña Captura para registrar tu primer producto"
            />
          ) : null
        }
      />

      <ConfirmModal
        visible={deleteModalVisible}
        title="Eliminar productos"
        message={`¿Estás seguro de que deseas eliminar ${selectedIds.size} producto${selectedIds.size !== 1 ? 's' : ''}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  selectionText: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
  },
  emptyList: {
    flex: 1,
  },
  /** Date section header — pill/badge with surface background for contrast */
  sectionHeader: {
    marginTop: 16,
    marginBottom: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  sectionHeaderText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.2,
  },
  /** Each grid row — no horizontal padding so photos reach edges */
  row: {
    flexDirection: 'row',
    marginHorizontal: CELL_GAP / 2,
  },
  cellWrapper: {
    flex: 1,
  },
  phantomCell: {
    flex: 1,
  },
});
