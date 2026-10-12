'use client';

import { usePreferencesStore } from '@/stores';
import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: readonly string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePwaInstall() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const isDismissed = usePreferencesStore((state) => state.pwaInstallDismissed);
  const setPwaInstallDismissed = usePreferencesStore((state) => state.setPwaInstallDismissed);

  useEffect(() => {
    // 1. Kiểm tra xem app đã được cài đặt hoặc đang chạy ở chế độ standalone chưa
    const checkStandalone = () => {
      const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
      const isIosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      return isStandaloneMedia || isIosStandalone;
    };

    if (checkStandalone()) {
      setIsInstalled(true);
      return;
    }

    // 2. Nhận diện thiết bị iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !/crios|fxios/.test(userAgent);
    setIsIos(isIosDevice);

    // 3. Bắt sự kiện `beforeinstallprompt` trên Chromium/Android/Desktop
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setPromptEvent(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!promptEvent) return false;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setPromptEvent(null);
      return true;
    }
    return false;
  }, [promptEvent]);

  const dismiss = useCallback(() => {
    setPwaInstallDismissed(true);
  }, [setPwaInstallDismissed]);

  const canInstall = !isInstalled && !isDismissed && (promptEvent !== null || isIos);

  return {
    canInstall,
    isInstallable: canInstall,
    isInstalled,
    isIos,
    isDismissed,
    promptInstall,
    dismiss,
  };
}
