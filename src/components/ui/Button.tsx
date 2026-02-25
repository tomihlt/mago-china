import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { borderRadius, spacing } from '@/theme/spacing';
import { fontSizes, fontWeights } from '@/theme/typography';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  style?: ViewStyle;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  style,
  disabled,
  ...rest
}: ButtonProps) {
  const { colors } = useTheme();

  const containerStyles: ViewStyle[] = [
    styles.base,
    sizeStyles[size],
    {
      backgroundColor:
        variant === 'primary'
          ? colors.primary
          : variant === 'danger'
          ? colors.error
          : variant === 'secondary'
          ? colors.surfaceVariant
          : 'transparent',
      borderWidth: variant === 'ghost' ? 1.5 : 0,
      borderColor: variant === 'ghost' ? colors.primary : 'transparent',
      opacity: disabled || isLoading ? 0.6 : 1,
    },
    style as ViewStyle,
  ];

  const textColor =
    variant === 'primary' || variant === 'danger'
      ? colors.textOnPrimary
      : variant === 'secondary'
      ? colors.textPrimary
      : colors.primary;

  return (
    <TouchableOpacity
      style={containerStyles}
      disabled={disabled || isLoading}
      activeOpacity={0.75}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? '#fff' : colors.primary}
        />
      ) : (
        <>
          {leftIcon}
          <Text
            style={[
              styles.label,
              { color: textColor, fontSize: fontSizes[size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'] },
              leftIcon ? { marginLeft: spacing.sm } : undefined,
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  label: {
    fontWeight: fontWeights.semibold,
  },
});

const sizeStyles: Record<ButtonSize, ViewStyle> = {
  sm: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, minHeight: 36 },
  md: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: 48 },
  lg: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, minHeight: 56 },
};
