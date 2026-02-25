import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import { borderRadius, spacing } from '@/theme/spacing';
import { fontSizes, fontWeights } from '@/theme/typography';
import { Button } from './Button';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableOpacity
        style={[styles.backdrop, { backgroundColor: colors.overlay }]}
        activeOpacity={1}
        onPress={onCancel}
      >
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, shadowColor: colors.shadow },
          ]}
        >
          <View style={styles.header}>
            <View
              style={[
                styles.iconBg,
                {
                  backgroundColor:
                    variant === 'danger'
                      ? colors.errorSurface
                      : colors.primaryLight + '22',
                },
              ]}
            >
              <Ionicons
                name={variant === 'danger' ? 'trash' : 'information-circle'}
                size={24}
                color={variant === 'danger' ? colors.error : colors.primary}
              />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {title}
            </Text>
          </View>

          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {message}
          </Text>

          <View style={styles.actions}>
            <Button
              label={cancelLabel}
              variant="ghost"
              size="md"
              style={styles.actionBtn}
              onPress={onCancel}
            />
            <Button
              label={confirmLabel}
              variant={variant}
              size="md"
              style={styles.actionBtn}
              onPress={onConfirm}
            />
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    flex: 1,
  },
  message: {
    fontSize: fontSizes.md,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
  },
});
