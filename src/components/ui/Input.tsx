import React, { forwardRef } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { borderRadius, spacing } from '@/theme/spacing';
import { fontSizes, fontWeights } from '@/theme/typography';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, hint, required, style, ...rest }, ref) => {
    const { colors } = useTheme();

    return (
      <View style={styles.wrapper}>
        {label && (
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {label}
            {required && (
              <Text style={{ color: colors.accent }}> *</Text>
            )}
          </Text>
        )}
        <TextInput
          ref={ref}
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              color: colors.textPrimary,
              borderColor: error ? colors.error : colors.border,
            },
            style,
          ]}
          placeholderTextColor={colors.textDisabled}
          {...rest}
        />
        {error ? (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
        ) : hint ? (
          <Text style={[styles.hintText, { color: colors.textDisabled }]}>
            {hint}
          </Text>
        ) : null}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    marginBottom: spacing.xs,
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSizes.md,
    minHeight: 50,
  },
  errorText: {
    fontSize: fontSizes.xs,
    marginTop: spacing.xs,
  },
  hintText: {
    fontSize: fontSizes.xs,
    marginTop: spacing.xs,
  },
});
