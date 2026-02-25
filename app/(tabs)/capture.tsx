import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/theme/ThemeContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { getPhotoFromCamera, getPhotoFromGallery, saveImage } from '@/services/imageService';
import { createProduct } from '@/repositories/productRepository';
import {
  consumeNextProductCode,
  previewNextProductCode,
} from '@/repositories/configRepository';
import { borderRadius, shadows, spacing } from '@/theme/spacing';
import { fontSizes, fontWeights } from '@/theme/typography';
import { CreateProductInput } from '@/types';

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
  image?: string;
}

const INITIAL_FORM: FormState = {
  supplier_name: '',
  description: '',
  price: '',
  units_per_package: '',
  volume: '',
  weight: '',
  observations: '',
};

export default function CaptureScreen() {
  const { colors } = useTheme();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [nextCode, setNextCode] = useState('');
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const loadNextCode = useCallback(async () => {
    const code = await previewNextProductCode();
    setNextCode(code);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNextCode();
    }, [loadNextCode])
  );

  const handleCameraPress = useCallback(async () => {
    const uri = await getPhotoFromCamera();
    if (uri) {
      setImageUri(uri);
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
      setErrors((e) => ({ ...e, image: undefined }));
    } else {
      Alert.alert(
        'Permiso denegado',
        'Necesitamos acceso a la galería. Por favor, actívalo en Ajustes del dispositivo.'
      );
    }
  }, []);

  const updateField = useCallback(
    <K extends keyof FormState>(key: K, value: string) => {
      setForm((f) => ({ ...f, [key]: value }));
      setErrors((e) => ({ ...e, [key]: undefined }));
    },
    []
  );

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!imageUri) newErrors.image = 'La imagen del producto es obligatoria';
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
  };

  const handleSave = useCallback(async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      const savedUri = await saveImage(imageUri!);
      const code = await consumeNextProductCode();
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

      // Reset form
      setImageUri(null);
      setForm(INITIAL_FORM);
      await loadNextCode();

      Alert.alert('¡Producto guardado!', `Código: ${code}`, [
        { text: 'Ver Galería', onPress: () => router.replace('/(tabs)/') },
        { text: 'Agregar otro', style: 'cancel' },
      ]);
    } catch (err) {
      Alert.alert(
        'Error al guardar',
        err instanceof Error ? err.message : 'Ocurrió un error inesperado'
      );
    } finally {
      setIsSaving(false);
    }
  }, [form, imageUri, validate, loadNextCode]);

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Image Section */}
        <View style={[styles.imageSection, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          {imageUri ? (
            <TouchableOpacity onPress={handleCameraPress} activeOpacity={0.9}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
              <View style={[styles.changePhotoOverlay, { backgroundColor: colors.overlay }]}>
                <Ionicons name="camera" size={24} color="#fff" />
                <Text style={styles.changePhotoText}>Cambiar foto</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={64} color={colors.primary + '50'} />
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

        {/* Form Section */}
        <View style={[styles.formCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          {/* Auto-generated code */}
          <View style={[styles.codeBox, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
            <Ionicons name="barcode-outline" size={18} color={colors.primary} />
            <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>
              Código a asignar:
            </Text>
            <Text style={[styles.codeValue, { color: colors.primary }]}>
              {nextCode}
            </Text>
          </View>

          <Input
            label="Nombre del Proveedor"
            required
            value={form.supplier_name}
            onChangeText={(t) => updateField('supplier_name', t)}
            placeholder="Ej: Proveedor S.A."
            maxLength={200}
            error={errors.supplier_name}
          />

          <Input
            label="Descripción"
            value={form.description}
            onChangeText={(t) => updateField('description', t)}
            placeholder="Descripción del producto..."
            multiline
            numberOfLines={3}
            maxLength={1000}
            style={styles.multilineInput}
          />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Input
                label="Precio"
                value={form.price}
                onChangeText={(t) => updateField('price', t)}
                placeholder="0.00"
                keyboardType="decimal-pad"
                error={errors.price}
              />
            </View>
            <View style={styles.halfField}>
              <Input
                label="Unidades/Bulto"
                value={form.units_per_package}
                onChangeText={(t) => updateField('units_per_package', t)}
                placeholder="1"
                keyboardType="number-pad"
                error={errors.units_per_package}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Input
                label="Cubicaje (m³)"
                value={form.volume}
                onChangeText={(t) => updateField('volume', t)}
                placeholder="0.000"
                keyboardType="decimal-pad"
                error={errors.volume}
              />
            </View>
            <View style={styles.halfField}>
              <Input
                label="Peso (kg)"
                value={form.weight}
                onChangeText={(t) => updateField('weight', t)}
                placeholder="0.00"
                keyboardType="decimal-pad"
                error={errors.weight}
              />
            </View>
          </View>

          <Input
            label="Observaciones"
            value={form.observations}
            onChangeText={(t) => updateField('observations', t)}
            placeholder="Notas adicionales..."
            multiline
            numberOfLines={4}
            maxLength={2000}
            style={styles.multilineInput}
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
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  codeLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
  },
  codeValue: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    letterSpacing: 1,
    marginLeft: 'auto',
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
