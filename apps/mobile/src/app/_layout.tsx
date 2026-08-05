import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import {
  useFonts,
  Quicksand_300Light,
  Quicksand_400Regular,
  Quicksand_500Medium,
  Quicksand_600SemiBold,
  Quicksand_700Bold,
} from '@expo-google-fonts/quicksand';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    // Ánh xạ tên Quicksand chung để dùng được cho các thiết bị
    Quicksand: Quicksand_500Medium, 
    'Quicksand-Bold': Quicksand_700Bold,
    'Quicksand-SemiBold': Quicksand_600SemiBold,
    'Quicksand-Medium': Quicksand_500Medium,
    'Quicksand-Regular': Quicksand_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
