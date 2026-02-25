import React, { useCallback, useEffect, useState } from 'react';
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

export default function GalleryScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const numColumns = width >= 600 ? 3 : 2;

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
      // Error silencioso en background
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

  const handleSearch = useCallback((query: string) => {
    loadInitialProducts(query);
  }, [loadInitialProducts]);

  const handleProductPress = useCallback(
    (product: Product) => {
      if (isSelectionMode) {
        setSelectedIds((prev) => {
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

  const handleDeleteSelected = useCallback(async () => {
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

  const renderItem = useCallback(
    ({ item }: { item: Product }) => (
      <ProductCard
        product={item}
        isSelected={selectedIds.has(item.id)}
        isSelectionMode={isSelectionMode}
        onPress={handleProductPress}
        onLongPress={handleLongPress}
      />
    ),
    [selectedIds, isSelectionMode, handleProductPress, handleLongPress]
  );

  const keyExtractor = useCallback((item: Product) => String(item.id), []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header actions */}
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
        data={products}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={numColumns}
        key={numColumns} // re-mount when numColumns changes
        contentContainerStyle={[
          products.length === 0 ? styles.emptyList : styles.list,
          { paddingBottom: insets.bottom + spacing['2xl'] }
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
  list: {
    padding: spacing.xs,
    paddingBottom: spacing['2xl'],
  },
  emptyList: {
    flex: 1,
  },
});
