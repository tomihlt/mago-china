// ─── Domain Models ───────────────────────────────────────────────────────────

export interface Product {
  id: number;
  supplier_name: string;
  product_code: string;
  description: string | null;
  price: number;
  units_per_package: number;
  volume: number;
  weight: number;
  observations: string | null;
  image_uri: string;
  created_at: string;
  updated_at: string;
}

export type CreateProductInput = Omit<
  Product,
  'id' | 'product_code' | 'created_at' | 'updated_at'
>;

export type UpdateProductInput = Partial<
  Omit<Product, 'id' | 'product_code' | 'created_at' | 'updated_at'>
>;

export interface SystemConfig {
  id: number;
  config_key: string;
  config_value: string;
  updated_at: string;
}

// ─── Theme ───────────────────────────────────────────────────────────────────

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ColorTokens {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  accent: string;
  accentLight: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  textPrimary: string;
  textSecondary: string;
  textDisabled: string;
  textOnPrimary: string;
  textOnAccent: string;
  border: string;
  divider: string;
  error: string;
  errorSurface: string;
  success: string;
  successSurface: string;
  warning: string;
  shadow: string;
  overlay: string;
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export type RootStackParamList = {
  '(tabs)': undefined;
  'product/[id]': { id: number };
  'product/edit/[id]': { id: number };
};
