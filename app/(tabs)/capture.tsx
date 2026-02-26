import React, { useCallback, useRef, useState } from 'react';
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
  ToastAndroid,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { getPhotoFromCamera, getPhotoFromGallery, saveImage, savePhotoToGallery } from '@/services/imageService';
import { createProduct, getProductByCode } from '@/repositories/productRepository';
import { previewNextProductCode, syncSequenceWithSkus } from '@/repositories/configRepository';
import { borderRadius, shadows, spacing } from '@/theme/spacing';
import { fontSizes, fontWeights } from '@/theme/typography';
import { CreateProductInput } from '@/types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormState {
  product_code: string; // Tarea 1: editable
  supplier_name: string;
  description: string;
  price: string;
  units_per_package: string;
  volume: string;
  weight: string;
  observations: string;
}

interface FormErrors {
  product_code?: string;
  supplier_name?: string;
  price?: string;
  units_per_package?: string;
  volume?: string;
  weight?: string;
  image?: string;
}

const INITIAL_FORM: FormState = {
  product_code: '',
  supplier_name: '',
  description: '',
  price: '',
  units_per_package: '',
  volume: '',
  weight: '',
  observations: '',
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function CaptureScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // ── State ──
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [fromCamera, setFromCamera] = useState(false); // tracks if photo came from camera
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  // ── Scroll + field refs (measureLayout approach) ──
  const scrollRef = useRef<ScrollView>(null);
  const codeRef = useRef<TextInput>(null);
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

  // ── Load auto-suggested code on focus ──
  const loadNextCode = useCallback(async () => {
    const code = await previewNextProductCode();
    setForm((f) => ({ ...f, product_code: code }));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNextCode();
    }, [loadNextCode])
  );

  // ── Image handlers ──
  const handleCameraPress = useCallback(async () => {
    const uri = await getPhotoFromCamera();
    if (uri) {
      setImageUri(uri);
      setFromCamera(true); // mark as camera capture
      setErrors((e) => ({ ...e, image: undefined }));
    } else {
      Alert.alert(
        'Permiso denegado',
        'Necesitamos acceso a la cámara. Por favor, actívalo en Ajustes del dispositivo.'
      );
    }
  }, []);

  const handleGalleryPress = useCallback(async () => {
    const uri = await getPhotoFromGallery();
    if (uri) {
      setImageUri(uri);
      setFromCamera(false); // gallery picks are NOT saved again to the gallery
      setErrors((e) => ({ ...e, image: undefined }));
    } else {
      Alert.alert(
        'Permiso denegado',
        'Necesitamos acceso a la galería. Por favor, actívalo en Ajustes del dispositivo.'
      );
    }
  }, []);

  // ── Field update ──
  const updateField = useCallback(<K extends keyof FormState>(key: K, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }, []);



  // ── Validation ──
  const validate = useCallback(async (): Promise<boolean> => {
    const newErrors: FormErrors = {};

    if (!imageUri) newErrors.image = 'La imagen del producto es obligatoria';

    // Tarea 1: validate editable product code
    const codeRaw = form.product_code.trim().toUpperCase();
    if (!codeRaw) {
      newErrors.product_code = 'El código del producto es obligatorio';
    } else {
      const existing = await getProductByCode(codeRaw);
      if (existing) {
        newErrors.product_code = `El código "${codeRaw}" ya existe en el inventario`;
      }
    }

    if (!form.supplier_name.trim())
      newErrors.supplier_name = 'El nombre del proveedor es obligatorio';
    if (form.price && isNaN(parseFloat(form.price)))
      newErrors.price = 'Ingresa un precio válido';
    if (form.price && parseFloat(form.price) < 0)
      newErrors.price = 'El precio no puede ser negativo';
    if (form.units_per_package && parseInt(form.units_per_package) < 1)
      newErrors.units_per_package = 'Las unidades por bulto deben ser ≥ 1';
    if (form.volume && parseFloat(form.volume) < 0)
      newErrors.volume = 'El cubicaje no puede ser negativo';
    if (form.weight && parseFloat(form.weight) < 0)
      newErrors.weight = 'El peso no puede ser negativo';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [imageUri, form]);

  // ── Save (Tarea 1: use form.product_code instead of consuming the sequence) ──
  const handleSave = useCallback(async () => {
    const isValid = await validate();
    if (!isValid) return;

    setIsSaving(true);
    try {
      const savedUri = await saveImage(imageUri!);
      const code = form.product_code.trim().toUpperCase();

      // ── Save to native gallery if photo was taken with camera (changes2.md) ──
      if (fromCamera) {
        const saved = await savePhotoToGallery(imageUri!, code);
        if (!saved) {
          Alert.alert(
            'Permiso de galería denegado',
            'La foto NO se guardó en tu galería de fotos. Podés habilitarlo en Ajustes > Privacidad. El producto se guardó igualmente en la app.',
            [{ text: 'Entendido' }]
          );
        }
      }

      const input: CreateProductInput = {
        supplier_name: form.supplier_name.trim(),
        description: form.description.trim() || null,
        price: parseFloat(form.price) || 0,
        units_per_package: parseInt(form.units_per_package) || 1,
        volume: parseFloat(form.volume) || 0,
        weight: parseFloat(form.weight) || 0,
        observations: form.observations.trim() || null,
        image_uri: savedUri,
      };

      await createProduct(input, code);
      await syncSequenceWithSkus(code);

      // Reset form but keep the supplier_name
      setImageUri(null);
      setFromCamera(false);
      setForm(prev => ({
        ...INITIAL_FORM,
        supplier_name: prev.supplier_name,
      }));
      await loadNextCode();

      if (Platform.OS === 'android') {
        ToastAndroid.show(`¡Producto ${code} guardado!`, ToastAndroid.SHORT);
      }
    } catch (err) {
      Alert.alert(
        'Error al guardar',
        err instanceof Error ? err.message : 'Ocurrió un error inesperado'
      );
    } finally {
      setIsSaving(false);
    }
  }, [form, imageUri, fromCamera, validate, loadNextCode]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(spacing['3xl'], insets.bottom + spacing.lg) }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Image Section ── */}
        <View
          style={[
            styles.imageSection,
            { backgroundColor: colors.surface, shadowColor: colors.shadow },
          ]}
        >
          {imageUri ? (
            <TouchableOpacity onPress={handleCameraPress} activeOpacity={0.9}>
              <Image
                source={{ uri: imageUri }}
                style={styles.previewImage}
                resizeMode="cover"
              />
              <View
                style={[
                  styles.changePhotoOverlay,
                  { backgroundColor: colors.overlay },
                ]}
              >
                <Ionicons name="camera" size={24} color="#fff" />
                <Text style={styles.changePhotoText}>Cambiar foto</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons
                name="image-outline"
                size={64}
                color={colors.primary + '50'}
              />
              {errors.image && (
                <Text style={[styles.imageError, { color: colors.error }]}>
                  {errors.image}
                </Text>
              )}
            </View>
          )}
          <View style={styles.imageButtons}>
            <Button
              label="Cámara"
              variant="primary"
              size="md"
              style={styles.imageBtn}
              leftIcon={
                <Ionicons name="camera-outline" size={18} color="#fff" />
              }
              onPress={handleCameraPress}
            />
            <Button
              label="Galería"
              variant="ghost"
              size="md"
              style={styles.imageBtn}
              leftIcon={
                <Ionicons
                  name="images-outline"
                  size={18}
                  color={colors.primary}
                />
              }
              onPress={handleGalleryPress}
            />
          </View>
        </View>

        {/* ── Form Section ── */}
        <View
          style={[
            styles.formCard,
            { backgroundColor: colors.surface, shadowColor: colors.shadow },
          ]}
        >
          {/* Editable product code */}
          <Input
            ref={codeRef}
            label="Código del Producto"
            required
            value={form.product_code}
            onChangeText={(t) => updateField('product_code', t.toUpperCase())}
            placeholder="Ej: EM0001"
            autoCapitalize="characters"
            error={errors.product_code}
            hint="Autogenerado, podés modificarlo si es necesario"
            onFocus={() => scrollToField(codeRef)}
          />

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
            style={styles.multilineInput}
            onFocus={() => scrollToField(descriptionRef)}
          />

          <View style={styles.row}>
            <View style={styles.halfField}>
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
            <View style={styles.halfField}>
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
            <View style={styles.halfField}>
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
            <View style={styles.halfField}>
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
            style={styles.multilineInput}
            onFocus={() => scrollToField(observationsRef)}
          />

          <Button
            label="Guardar Producto"
            variant="primary"
            size="lg"
            isLoading={isSaving}
            leftIcon={<Ionicons name="save-outline" size={20} color="#fff" />}
            onPress={handleSave}
            style={styles.saveButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
  imageSection: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  previewImage: {
    width: '100%',
    height: 220,
  },
  changePhotoOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  changePhotoText: {
    color: '#fff',
    fontWeight: fontWeights.semibold,
    fontSize: fontSizes.md,
  },
  imagePlaceholder: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  imageError: {
    fontSize: fontSizes.sm,
    textAlign: 'center',
  },
  imageButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  imageBtn: {
    flex: 1,
  },
  formCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfField: {
    flex: 1,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: spacing.sm,
  },
  saveButton: {
    marginTop: spacing.sm,
  },
});
