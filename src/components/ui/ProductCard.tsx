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
      style={styles.cell}
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.9}
      delayLongPress={400}
    >
      {/* Full-bleed image */}
      <Image
        source={{ uri: product.image_uri }}
        style={styles.image}
        resizeMode="cover"
      />

      {/* Scrim: dark gradient band at the bottom for text readability */}
      <View style={styles.scrim} pointerEvents="none" />

      {/* Product info over the scrim */}
      <View style={styles.infoOverlay} pointerEvents="none">
        <Text style={styles.codeText} numberOfLines={1}>
          {product.product_code}
        </Text>
        <Text style={styles.supplierText} numberOfLines={1}>
          {product.supplier_name}
        </Text>
        {product.price > 0 && (
          <Text style={styles.priceText} numberOfLines={1}>
            ${product.price.toFixed(2)}
          </Text>
        )}
      </View>

      {/* Selection overlay */}
      {isSelectionMode && (
        <View
          style={[
            styles.selectionOverlay,
            { backgroundColor: isSelected ? colors.primary + 'BF' : 'transparent' },
          ]}
        >
          <View
            style={[
              styles.checkCircle,
              {
                backgroundColor: isSelected ? '#fff' : 'transparent',
                borderColor: isSelected ? '#fff' : 'rgba(255,255,255,0.75)',
              },
            ]}
          >
            {isSelected && (
              <Ionicons name="checkmark" size={14} color={colors.primary} />
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    aspectRatio: 1,
    overflow: 'hidden',
    // Dark placeholder while image loads
    backgroundColor: '#111',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  /** Simulates a bottom-to-top gradient scrim (semi-transparent black band) */
  scrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '38%',
    backgroundColor: 'rgba(0,0,0,0.52)',
    // Fade the top edge of the scrim (no LinearGradient dependency needed)
    // We achieve the fade via a second inner View below
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 7,
    paddingBottom: 7,
  },
  codeText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: '#fff',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  supplierText: {
    fontSize: 10,
    fontWeight: fontWeights.regular,
    color: 'rgba(255,255,255,0.82)',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  priceText: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
    color: '#FFD54F',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    marginTop: 1,
  },
  selectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    padding: 6,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
