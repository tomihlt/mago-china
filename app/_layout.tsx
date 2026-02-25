import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { ThemeProvider } from '@/theme/ThemeContext';
import { ThemeMode } from '@/types';
import { getDatabase } from '@/services/database';
import { getThemeMode, setThemeMode as saveThemeMode } from '@/repositories/configRepository';
import { useTheme } from '@/theme/ThemeContext';

function ThemedStack() {
  const { colors, isDark } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.textOnPrimary,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="product/[id]"
        options={{ title: 'Detalle del Producto' }}
      />
      <Stack.Screen
        name="product/edit/[id]"
        options={{ title: 'Editar Producto' }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    (async () => {
      await getDatabase();
      const mode = await getThemeMode();
      setThemeMode(mode);
      setDbReady(true);
    })();
  }, []);

  if (!dbReady) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider
          savedMode={themeMode}
          onThemeChange={saveThemeMode}
        >
          <ThemedStack />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
