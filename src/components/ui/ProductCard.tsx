import React, { useCallback } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '@/types';
import { useTheme } from '@/theme/ThemeContext';
import { borderRadius, shadows, spacing } from '@/theme/spacing';
import { fontSizes, fontWeights } from '@/theme/typography';

interface ProductCardProps {
  product: Product;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onPress: (product: Product) => void;
  onLongPress?: (product: Product) => void;
}

export const ProductCard = React.memo(function ProductCard({
  product,
  isSelected = false,
  isSelectionMode = false,
  onPress,
  onLongPress,
}: ProductCardProps) {
  const { colors } = useTheme();

  const handlePress = useCallback(() => onPress(product), [onPress, product]);
  const handleLongPress = useCallback(
    () => onLongPress?.(product),
    [onLongPress, product]
  );

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          shadowColor: colors.shadow,
          borderColor: isSelected ? colors.primary : colors.border,
          borderWidth: isSelected ? 2 : 1,
        },
      ]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.85}
      delayLongPress={400}
    >
      {/* Product Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.image_uri }}
          style={styles.image}
          resizeMode="cover"
        />
        {/* Selection overlay */}
        {isSelectionMode && (
          <View
            style={[
              styles.selectionOverlay,
              { backgroundColor: isSelected ? colors.primary + 'CC' : 'transparent' },
            ]}
          >
            {isSelected && (
              <Ionicons name="checkmark-circle" size={28} color="#fff" />
            )}
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={[styles.info, { backgroundColor: colors.surface }]}>
        <Text
          style={[styles.code, { color: colors.primary }]}
          numberOfLines={1}
        >
          {product.product_code}
        </Text>
        <Text
          style={[styles.supplier, { color: colors.textPrimary }]}
          numberOfLines={2}
        >
          {product.supplier_name}
        </Text>
        {product.price > 0 && (
          <Text style={[styles.price, { color: colors.accent }]}>
            ${product.price.toFixed(2)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: spacing.xs,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  imageContainer: {
    aspectRatio: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  selectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    padding: spacing.sm,
  },
  code: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  supplier: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: 18,
  },
  price: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    marginTop: 2,
  },
});
