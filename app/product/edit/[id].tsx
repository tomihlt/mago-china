import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Product, UpdateProductInput } from '@/types';
import { useTheme } from '@/theme/ThemeContext';
import { getProductById, updateProduct } from '@/repositories/productRepository';
import { getPhotoFromCamera, getPhotoFromGallery, saveImage, deleteImage } from '@/services/imageService';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { borderRadius, shadows, spacing } from '@/theme/spacing';
import { fontSizes, fontWeights } from '@/theme/typography';

interface FormState {
  supplier_name: string;
  description: string;
  price: string;
  units_per_package: string;
  volume: string;
  weight: string;
  observations: string;
}

interface FormErrors {
  supplier_name?: string;
  price?: string;
  units_per_package?: string;
  volume?: string;
  weight?: string;
}

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [product, setProduct] = useState<Product | null>(null);
  const [newImageUri, setNewImageUri] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    supplier_name: '',
    description: '',
    price: '',
    units_per_package: '',
    volume: '',
    weight: '',
    observations: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  // ── Scroll + field refs (measureLayout) ──
  const scrollRef = useRef<ScrollView>(null);
  const supplierRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);
  const priceRef = useRef<TextInput>(null);
  const unitsRef = useRef<TextInput>(null);
  const volumeRef = useRef<TextInput>(null);
  const weightRef = useRef<TextInput>(null);
  const observationsRef = useRef<TextInput>(null);

  const scrollToField = useCallback((inputRef: React.RefObject<TextInput | null>) => {
    setTimeout(() => {
      if (!inputRef.current || !scrollRef.current) return;
      inputRef.current.measureLayout(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        scrollRef.current as any,
        (_x, y) => {
          scrollRef.current?.scrollTo({ y: Math.max(0, y - 80), animated: true });
        },
        () => {}
      );
    }, 200);
  }, []);

  useEffect(() => {
    if (!id) return;
    getProductById(Number(id))
      .then((p) => {
        if (!p) return;
        setProduct(p);
        setForm({
          supplier_name: p.supplier_name,
          description: p.description ?? '',
          price: p.price > 0 ? String(p.price) : '',
          units_per_package: p.units_per_package > 1 ? String(p.units_per_package) : '',
          volume: p.volume > 0 ? String(p.volume) : '',
          weight: p.weight > 0 ? String(p.weight) : '',
          observations: p.observations ?? '',
        });
      })
      .catch(() => Alert.alert('Error', 'No se pudo cargar el producto'));
  }, [id]);

  const updateField = useCallback(<K extends keyof FormState>(key: K, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }, []);

  const handleCameraPress = useCallback(async () => {
    const uri = await getPhotoFromCamera();
    if (uri) setNewImageUri(uri);
  }, []);

  const handleGalleryPress = useCallback(async () => {
    const uri = await getPhotoFromGallery();
    if (uri) setNewImageUri(uri);
  }, []);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.supplier_name.trim())
      newErrors.supplier_name = 'El nombre del proveedor es obligatorio';
    if (form.price && isNaN(parseFloat(form.price)))
      newErrors.price = 'Ingresa un precio válido';
    if (form.price && parseFloat(form.price) < 0)
      newErrors.price = 'El precio no puede ser negativo';
    if (form.units_per_package && parseInt(form.units_per_package) < 1)
      newErrors.units_per_package = 'Debe ser ≥ 1';
    if (form.volume && parseFloat(form.volume) < 0)
      newErrors.volume = 'No puede ser negativo';
    if (form.weight && parseFloat(form.weight) < 0)
      newErrors.weight = 'No puede ser negativo';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = useCallback(async () => {
    if (!product || !validate()) return;
    setIsSaving(true);
    try {
      let imageUri = product.image_uri;

      // Save new image and delete old one if changed
      if (newImageUri) {
        const savedUri = await saveImage(newImageUri);
        await deleteImage(product.image_uri);
        imageUri = savedUri;
      }

      const input: UpdateProductInput = {
        supplier_name: form.supplier_name.trim(),
        description: form.description.trim() || null,
        price: parseFloat(form.price) || 0,
        units_per_package: parseInt(form.units_per_package) || 1,
        volume: parseFloat(form.volume) || 0,
        weight: parseFloat(form.weight) || 0,
        observations: form.observations.trim() || null,
        image_uri: imageUri,
      };

      await updateProduct(product.id, input);
      Alert.alert('✓ Producto actualizado', 'Los cambios fueron guardados.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  }, [product, newImageUri, form, validate]);

  if (!product) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>Cargando...</Text>
      </View>
    );
  }

  const currentImage = newImageUri ?? product.image_uri;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(spacing['3xl'], insets.bottom + spacing.lg) }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Image */}
        <View style={[styles.imageCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Image source={{ uri: currentImage }} style={styles.image} resizeMode="cover" />
          <View style={styles.imageButtons}>
            <Button
              label="Cámara"
              variant="primary"
              size="md"
              style={styles.imageBtn}
              leftIcon={<Ionicons name="camera-outline" size={18} color="#fff" />}
              onPress={handleCameraPress}
            />
            <Button
              label="Galería"
              variant="ghost"
              size="md"
              style={styles.imageBtn}
              leftIcon={<Ionicons name="images-outline" size={18} color={colors.primary} />}
              onPress={handleGalleryPress}
            />
          </View>
        </View>

        {/* Form */}
        <View style={[styles.formCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          {/* Non-editable code */}
          <View style={[styles.codeBox, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
            <Ionicons name="lock-closed-outline" size={16} color={colors.textDisabled} />
            <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>Código (no editable):</Text>
            <Text style={[styles.codeValue, { color: colors.textPrimary }]}>
              {product.product_code}
            </Text>
          </View>

          <Input
            ref={supplierRef}
            label="Nombre del Proveedor"
            required
            value={form.supplier_name}
            onChangeText={(t) => updateField('supplier_name', t)}
            placeholder="Ej: Proveedor S.A."
            maxLength={200}
            error={errors.supplier_name}
            onFocus={() => scrollToField(supplierRef)}
          />

          <Input
            ref={descriptionRef}
            label="Descripción"
            value={form.description}
            onChangeText={(t) => updateField('description', t)}
            placeholder="Descripción del producto..."
            multiline
            numberOfLines={3}
            maxLength={1000}
            style={styles.multiline}
            onFocus={() => scrollToField(descriptionRef)}
          />

          <View style={styles.row}>
            <View style={styles.half}>
              <Input
                ref={priceRef}
                label="Precio"
                value={form.price}
                onChangeText={(t) => updateField('price', t)}
                placeholder="0.00"
                keyboardType="decimal-pad"
                error={errors.price}
                onFocus={() => scrollToField(priceRef)}
              />
            </View>
            <View style={styles.half}>
              <Input
                ref={unitsRef}
                label="Unidades/Bulto"
                value={form.units_per_package}
                onChangeText={(t) => updateField('units_per_package', t)}
                placeholder="1"
                keyboardType="number-pad"
                error={errors.units_per_package}
                onFocus={() => scrollToField(unitsRef)}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.half}>
              <Input
                ref={volumeRef}
                label="Cubicaje (m³)"
                value={form.volume}
                onChangeText={(t) => updateField('volume', t)}
                placeholder="0.000"
                keyboardType="decimal-pad"
                error={errors.volume}
                onFocus={() => scrollToField(volumeRef)}
              />
            </View>
            <View style={styles.half}>
              <Input
                ref={weightRef}
                label="Peso (kg)"
                value={form.weight}
                onChangeText={(t) => updateField('weight', t)}
                placeholder="0.00"
                keyboardType="decimal-pad"
                error={errors.weight}
                onFocus={() => scrollToField(weightRef)}
              />
            </View>
          </View>

          <Input
            ref={observationsRef}
            label="Observaciones"
            value={form.observations}
            onChangeText={(t) => updateField('observations', t)}
            placeholder="Notas adicionales..."
            multiline
            numberOfLines={4}
            maxLength={2000}
            style={styles.multiline}
            onFocus={() => scrollToField(observationsRef)}
          />

          <View style={styles.actions}>
            <Button
              label="Cancelar"
              variant="ghost"
              size="lg"
              style={styles.actionBtn}
              onPress={() => router.back()}
            />
            <Button
              label="Guardar Cambios"
              variant="primary"
              size="lg"
              style={styles.actionBtn}
              isLoading={isSaving}
              leftIcon={<Ionicons name="save-outline" size={18} color="#fff" />}
              onPress={handleSave}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.lg, paddingBottom: spacing['3xl'], gap: spacing.md },
  imageCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  image: { width: '100%', height: 200 },
  imageButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  imageBtn: { flex: 1 },
  formCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  codeLabel: { fontSize: fontSizes.sm, fontWeight: fontWeights.medium },
  codeValue: { fontSize: fontSizes.md, fontWeight: fontWeights.bold, marginLeft: 'auto' },
  row: { flexDirection: 'row', gap: spacing.sm },
  half: { flex: 1 },
  multiline: { height: 80, textAlignVertical: 'top', paddingTop: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  actionBtn: { flex: 1 },
});
