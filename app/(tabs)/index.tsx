import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
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
  const numColumns = width >= 600 ? 3 : 2;

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      const data = await getAllProducts();
      setProducts(data);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los productos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
      // Reset selection on focus change
      setIsSelectionMode(false);
      setSelectedIds(new Set());
    }, [loadProducts])
  );

  const handleSearch = useCallback(async (query: string) => {
    try {
      const data = query.trim()
        ? await searchProducts(query)
        : await getAllProducts();
      setProducts(data);
    } catch {
      Alert.alert('Error', 'Error al buscar productos');
    }
  }, []);

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
      await loadProducts();
    } catch {
      Alert.alert('Error', 'No se pudieron eliminar los productos seleccionados');
    } finally {
      setIsDeleting(false);
    }
  }, [selectedIds, loadProducts]);

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
        contentContainerStyle={products.length === 0 ? styles.emptyList : styles.list}
        onRefresh={loadProducts}
        refreshing={isLoading}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={5}
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
