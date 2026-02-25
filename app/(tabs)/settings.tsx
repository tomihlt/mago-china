import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { getAllProducts } from '@/repositories/productRepository';
import {
  getPrefix,
  getSequence,
  previewNextProductCode,
  setPrefix,
  setSequence,
} from '@/repositories/configRepository';
import { exportToExcel, shareExcel } from '@/services/excelService';
import { borderRadius, shadows, spacing } from '@/theme/spacing';
import { fontSizes, fontWeights } from '@/theme/typography';
import { ThemeMode } from '@/types';

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIconBg, { backgroundColor: colors.primary + '18' }]}>
          <Ionicons name={icon} size={20} color={colors.primary} />
        </View>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const { colors, isDark, themeMode, setThemeMode } = useTheme();

  const [prefix, setPrefixState] = useState('EM');
  const [sequence, setSequenceState] = useState('1');
  const [preview, setPreview] = useState('EM0001');
  const [prefixError, setPrefixError] = useState('');
  const [sequenceError, setSequenceError] = useState('');
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const loadConfig = useCallback(async () => {
    const p = await getPrefix();
    const s = await getSequence();
    setPrefixState(p.replace(/-$/, ''));
    setSequenceState(String(s));
    const pv = await previewNextProductCode();
    setPreview(pv);
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Live preview update
  useEffect(() => {
    const clean = prefix.toUpperCase().trim();
    const pfx = clean.endsWith('-') ? clean : `${clean}-`;
    const seq = parseInt(sequence) || 1;
    setPreview(`${pfx}${String(seq).padStart(4, '0')}`);
  }, [prefix, sequence]);

  const handleSaveConfig = useCallback(async () => {
    setPrefixError('');
    setSequenceError('');
    let valid = true;

    if (!prefix.trim() || prefix.trim().length < 2 || prefix.trim().length > 5) {
      setPrefixError('El prefijo debe tener entre 2 y 5 caracteres');
      valid = false;
    }
    const seq = parseInt(sequence);
    if (isNaN(seq) || seq < 1) {
      setSequenceError('Debe ser un número mayor a 0');
      valid = false;
    }
    if (!valid) return;

    setIsSavingConfig(true);
    try {
      await setPrefix(prefix.trim());
      await setSequence(seq);
      await loadConfig();
      Alert.alert('✓ Configuración guardada', 'Los cambios fueron aplicados correctamente.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Error al guardar la configuración');
    } finally {
      setIsSavingConfig(false);
    }
  }, [prefix, sequence, loadConfig]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const products = await getAllProducts();
      if (products.length === 0) {
        Alert.alert('Sin datos', 'No hay productos para exportar.');
        return;
      }
      const { fileUri, filename } = await exportToExcel(products);
      Alert.alert(
        `Excel generado`,
        `${filename}\n${products.length} productos exportados`,
        [
          { text: 'Compartir', onPress: () => shareExcel(fileUri) },
          { text: 'Cerrar', style: 'cancel' },
        ]
      );
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo generar el Excel');
    } finally {
      setIsExporting(false);
    }
  }, []);

  const handleThemeToggle = useCallback(() => {
    const next: ThemeMode = isDark ? 'light' : 'dark';
    setThemeMode(next);
  }, [isDark, setThemeMode]);

  const handleSystemTheme = useCallback(() => {
    setThemeMode('system');
  }, [setThemeMode]);

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Theme Section */}
        <SectionCard title="Apariencia" icon="moon-outline">
          <View style={[styles.settingRow, { borderBottomColor: colors.divider, borderBottomWidth: 1 }]}>
            <View style={styles.settingInfo}>
              <Ionicons
                name={isDark ? 'moon' : 'sunny'}
                size={20}
                color={isDark ? colors.primary : colors.accent}
              />
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                Modo oscuro
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={handleThemeToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={isDark ? colors.accent : colors.surface}
            />
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="phone-portrait-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                Usar tema del sistema
              </Text>
            </View>
            <Switch
              value={themeMode === 'system'}
              onValueChange={(val) => val ? handleSystemTheme() : handleThemeToggle()}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={themeMode === 'system' ? colors.accent : colors.surface}
            />
          </View>
        </SectionCard>

        {/* Code Config Section */}
        <SectionCard title="Codificación de Productos" icon="barcode-outline">
          <Input
            label="Prefijo del código"
            value={prefix}
            onChangeText={(t) => {
              setPrefixState(t.toUpperCase());
              setPrefixError('');
            }}
            placeholder="EM"
            maxLength={5}
            autoCapitalize="characters"
            error={prefixError}
            hint="2 a 5 caracteres alfanuméricos"
          />
          <Input
            label="Próximo número secuencial"
            value={sequence}
            onChangeText={(t) => {
              setSequenceState(t);
              setSequenceError('');
            }}
            keyboardType="number-pad"
            placeholder="1"
            error={sequenceError}
            hint="Número mayor a 0 (soporta más de 4 dígitos)"
          />
          <View style={[styles.previewBox, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
            <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
              Vista previa del próximo código:
            </Text>
            <Text style={[styles.previewValue, { color: colors.primary }]}>
              {preview}
            </Text>
          </View>
          <Button
            label="Guardar configuración"
            variant="primary"
            size="md"
            isLoading={isSavingConfig}
            leftIcon={<Ionicons name="save-outline" size={18} color="#fff" />}
            onPress={handleSaveConfig}
          />
        </SectionCard>

        {/* Export Section */}
        <SectionCard title="Exportar Inventario" icon="download-outline">
          <Text style={[styles.exportDesc, { color: colors.textSecondary }]}>
            Genera un archivo Excel (.xlsx) con todos los productos, ordenados por proveedor y código.
          </Text>
          <Button
            label="Exportar a Excel"
            variant="primary"
            size="lg"
            isLoading={isExporting}
            leftIcon={<Ionicons name="document-text-outline" size={20} color="#fff" />}
            onPress={handleExport}
          />
        </SectionCard>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appInfoText, { color: colors.textDisabled }]}>
            Inventario El Mago v2.1.0
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing['3xl'], gap: spacing.md },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  cardIconBg: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  settingLabel: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
  },
  previewBox: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewLabel: {
    fontSize: fontSizes.sm,
    flex: 1,
  },
  previewValue: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    letterSpacing: 1,
  },
  exportDesc: {
    fontSize: fontSizes.md,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  appInfoText: {
    fontSize: fontSizes.xs,
  },
});
