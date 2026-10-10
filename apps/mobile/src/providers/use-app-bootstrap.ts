import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { initClientStores } from '@cute-teachy/core';
import { asyncStorageAdapter } from '@/lib/async-storage-adapter';
import { fontAssets } from '@/theme';

/**
 * Chuẩn bị app trước khi render: tải font Quicksand + khôi phục store (session, ngôn ngữ)
 * từ AsyncStorage. Giữ splash screen cho tới khi xong.
 */
export function useAppBootstrap(): boolean {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const [storesReady, setStoresReady] = useState(false);

  useEffect(() => {
    let active = true;
    initClientStores(asyncStorageAdapter)
      .catch(() => undefined) // lỗi đọc storage → dùng trạng thái mặc định
      .finally(() => {
        if (active) setStoresReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const ready = (fontsLoaded || fontError !== null) && storesReady;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  return ready;
}
