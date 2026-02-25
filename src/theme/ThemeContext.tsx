import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import { ColorTokens, ThemeMode } from '@/types';
import { lightColors, darkColors } from './colors';

interface ThemeContextValue {
  colors: ColorTokens;
  isDark: boolean;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
  savedMode?: ThemeMode;
  onThemeChange?: (mode: ThemeMode) => void;
}

export function ThemeProvider({
  children,
  savedMode = 'system',
  onThemeChange,
}: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>(savedMode);

  const resolvedDark =
    themeMode === 'system' ? systemScheme === 'dark' : themeMode === 'dark';

  const colors = resolvedDark ? darkColors : lightColors;

  const setThemeMode = useCallback(
    (mode: ThemeMode) => {
      setThemeModeState(mode);
      onThemeChange?.(mode);
    },
    [onThemeChange]
  );

  const toggleTheme = useCallback(() => {
    const next: ThemeMode = resolvedDark ? 'light' : 'dark';
    setThemeMode(next);
  }, [resolvedDark, setThemeMode]);

  // Re-sync when savedMode changes (e.g. after DB is loaded)
  useEffect(() => {
    setThemeModeState(savedMode);
  }, [savedMode]);

  return (
    <ThemeContext.Provider
      value={{ colors, isDark: resolvedDark, themeMode, toggleTheme, setThemeMode }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
