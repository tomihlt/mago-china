import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Product } from '@/types';
import { useTheme } from '@/theme/ThemeContext';
import { getProductById, deleteProduct } from '@/repositories/productRepository';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { borderRadius, shadows, spacing } from '@/theme/spacing';
import { fontSizes, fontWeights } from '@/theme/typography';

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string | null | undefined;
}) {
  const { colors } = useTheme();
  if (!value && value !== '0') return null;
  return (
    <View style={[styles.detailRow, { borderBottomColor: colors.divider }]}>
      <View style={[styles.detailIconBg, { backgroundColor: colors.primary + '15' }]}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <View style={styles.detailContent}>
        <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{value}</Text>
      </View>
    </View>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [product, setProduct] = useState<Product | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      getProductById(Number(id))
        .then(setProduct)
        .catch(() => Alert.alert('Error', 'No se pudo cargar el producto'));
    }, [id])
  );

  const handleEdit = useCallback(() => {
    router.push(`/product/edit/${id}`);
  }, [id]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!product) return;
    setIsDeleting(true);
    setDeleteModalVisible(false);
    try {
      await deleteProduct(product.id);
      router.replace('/(tabs)/');
    } catch {
      Alert.alert('Error', 'No se pudo eliminar el producto');
    } finally {
      setIsDeleting(false);
    }
  }, [product]);

  if (!product) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(spacing['2xl'], insets.bottom + spacing.lg) }}
      >
        {/* Product Image */}
        <Image source={{ uri: product.image_uri }} style={styles.image} resizeMode="cover" />

        {/* Header Card */}
        <View style={[styles.headerCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <View style={[styles.codeBadge, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="barcode-outline" size={14} color={colors.primary} />
            <Text style={[styles.codeText, { color: colors.primary }]}>
              {product.product_code}
            </Text>
          </View>
          <Text style={[styles.supplierName, { color: colors.textPrimary }]}>
            {product.supplier_name}
          </Text>
          {product.price > 0 && (
            <Text style={[styles.price, { color: colors.accent }]}>
              ${product.price.toFixed(2)}
            </Text>
          )}
        </View>

        {/* Details Card */}
        <View style={[styles.detailsCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Información del Producto
          </Text>
          <DetailRow icon="document-text-outline" label="Descripción" value={product.description} />
          <DetailRow icon="cube-outline" label="Unidades por Bulto" value={String(product.units_per_package)} />
          <DetailRow icon="resize-outline" label="Cubicaje (m³)" value={product.volume > 0 ? product.volume.toFixed(3) : null} />
          <DetailRow icon="barbell-outline" label="Peso (kg)" value={product.weight > 0 ? product.weight.toFixed(2) : null} />
          <DetailRow icon="chatbubble-outline" label="Observaciones" value={product.observations} />
          <DetailRow icon="calendar-outline" label="Fecha de Registro" value={formatDate(product.created_at)} />
          {product.updated_at !== product.created_at && (
            <DetailRow icon="pencil-outline" label="Última Modificación" value={formatDate(product.updated_at)} />
          )}
        </View>

        <View style={styles.actions}>
          <Button
            label="Editar"
            variant="primary"
            size="lg"
            style={styles.actionBtn}
            leftIcon={<Ionicons name="pencil" size={18} color="#fff" />}
            onPress={handleEdit}
          />
          <Button
            label="Eliminar"
            variant="danger"
            size="lg"
            style={styles.actionBtn}
            isLoading={isDeleting}
            leftIcon={<Ionicons name="trash-outline" size={18} color="#fff" />}
            onPress={() => setDeleteModalVisible(true)}
          />
        </View>
      </ScrollView>

      <ConfirmModal
        visible={deleteModalVisible}
        title="Eliminar producto"
        message={`¿Deseas eliminar el producto ${product.product_code}? Esta acción eliminará también la imagen y no puede deshacerse.`}
        confirmLabel="Eliminar"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: 280,
  },
  headerCard: {
    margin: spacing.lg,
    marginTop: -spacing.xl,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.lg,
  },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  codeText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.8,
  },
  supplierName: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold,
    marginBottom: spacing.xs,
  },
  price: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
  },
  detailsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  detailIconBg: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: fontSizes.md,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    margin: spacing.lg,
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
  },
});
