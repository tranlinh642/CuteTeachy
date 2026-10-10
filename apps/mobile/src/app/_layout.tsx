import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { selectIsAuthenticated, useSessionStore } from '@cute-teachy/core';
import { AppProviders, useAppBootstrap } from '@/providers';
import { colors } from '@/theme';

void SplashScreen.preventAutoHideAsync();

/** Modal dạng bottom sheet: nền trong suốt, sheet tự vẽ lớp phủ. */
const SHEET_OPTIONS = { presentation: 'transparentModal', animation: 'fade' } as const;

function RootNavigator() {
  const isAuthenticated = useSessionStore(selectIsAuthenticated);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      {/* Đã đăng nhập: tabs + các modal tạo mới */}
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="new-task" options={SHEET_OPTIONS} />
        <Stack.Screen name="new-note" options={{ presentation: 'modal' }} />
        <Stack.Screen name="new-tag" options={SHEET_OPTIONS} />
      </Stack.Protected>
      {/* Chưa đăng nhập: chỉ màn hình login */}
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const ready = useAppBootstrap();
  if (!ready) return null; // splash vẫn hiển thị

  return (
    <AppProviders>
      <StatusBar style="dark" />
      <RootNavigator />
    </AppProviders>
  );
}
