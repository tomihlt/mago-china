import { Stack } from 'expo-router';
import { Appearance } from 'react-native';

export default function RootLayout() {

  const colorScheme = Appearance.getColorScheme();
  const themeScheme = colorScheme === 'dark' ? 'dark' : 'light';

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found"/>
    </Stack>
  );
}
