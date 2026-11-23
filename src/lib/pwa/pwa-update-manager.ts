export type PwaUpdateCheckStatus = 'idle' | 'checking' | 'up_to_date' | 'update_available' | 'unsupported';

export interface PwaUpdateSnapshot {
  readonly hasUpdate: boolean;
  readonly isDismissed: boolean;
  readonly isUpdating: boolean;
  readonly checkStatus: PwaUpdateCheckStatus;
}

const UPDATE_CHECK_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const VISIBILITY_THROTTLE_MS = 60 * 1000; // 1 minute
const RELOAD_FALLBACK_TIMEOUT_MS = 4_000;
const INSTALLING_WAIT_TIMEOUT_MS = 6_000;

export interface PwaUpdateEnvironment {
  readonly serviceWorker?: Pick<
    ServiceWorkerContainer,
    'register' | 'getRegistration' | 'addEventListener' | 'removeEventListener' | 'controller'
  >;
  readonly reload?: () => void;
  readonly now?: () => number;
}

export class PwaUpdateManager {
  private snapshot: PwaUpdateSnapshot = {
    hasUpdate: false,
    isDismissed: false,
    isUpdating: false,
    checkStatus: 'idle',
  };

  private readonly listeners = new Set<() => void>();
  private registration: ServiceWorkerRegistration | null = null;
  private initialized = false;
  private awaitingControllerReload = false;
  private reloading = false;
  private lastCheckAt = 0;
  private cleanupFns: (() => void)[] = [];

  constructor(private readonly env?: PwaUpdateEnvironment) {}

  private getServiceWorkerContainer() {
    if (this.env?.serviceWorker !== undefined) {
      return this.env.serviceWorker;
    }
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      return navigator.serviceWorker;
    }
    return undefined;
  }

  private reloadPage() {
    if (this.reloading) return;
    this.reloading = true;
    if (this.env?.reload) {
      this.env.reload();
      return;
    }
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  private getNow() {
    return this.env?.now ? this.env.now() : Date.now();
  }

  private setSnapshot(patch: Partial<PwaUpdateSnapshot>) {
    const next: PwaUpdateSnapshot = { ...this.snapshot, ...patch };
    if (
      next.hasUpdate === this.snapshot.hasUpdate &&
      next.isDismissed === this.snapshot.isDismissed &&
      next.isUpdating === this.snapshot.isUpdating &&
      next.checkStatus === this.snapshot.checkStatus
    ) {
      return;
    }
    this.snapshot = next;
    this.listeners.forEach((listener) => listener());
  }

  getSnapshot = (): PwaUpdateSnapshot => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private markUpdateAvailable() {
    this.setSnapshot({
      hasUpdate: true,
      isDismissed: false,
      checkStatus: 'update_available',
    });
  }

  private watchRegistration(reg: ServiceWorkerRegistration) {
    this.registration = reg;
    const sw = this.getServiceWorkerContainer();

    if (reg.waiting && sw?.controller) {
      this.markUpdateAvailable();
    }

    const handleInstalling = (worker: ServiceWorker | null) => {
      if (!worker) return;
      const onStateChange = () => {
        if (worker.state === 'installed' && this.getServiceWorkerContainer()?.controller) {
          this.markUpdateAvailable();
        }
      };
      worker.addEventListener('statechange', onStateChange);
      onStateChange();
    };

    if (reg.installing) {
      handleInstalling(reg.installing);
    }

    const onUpdateFound = () => {
      handleInstalling(reg.installing);
    };
    reg.addEventListener('updatefound', onUpdateFound);
    this.cleanupFns.push(() => reg.removeEventListener('updatefound', onUpdateFound));
  }

  async init(options?: { readonly register?: boolean }): Promise<void> {
    if (this.initialized) return;
    const sw = this.getServiceWorkerContainer();
    if (!sw) return;

    this.initialized = true;

    const onControllerChange = () => {
      if (this.awaitingControllerReload) {
        this.reloadPage();
      }
    };
    sw.addEventListener('controllerchange', onControllerChange);
    this.cleanupFns.push(() => sw.removeEventListener('controllerchange', onControllerChange));

    try {
      const shouldRegister = options?.register ?? process.env.NODE_ENV === 'production';
      const reg = shouldRegister
        ? await sw.register('/sw.js', { updateViaCache: 'none' })
        : ((await sw.getRegistration?.()) ?? null);

      if (reg) {
        this.watchRegistration(reg);
      }
    } catch (err) {
      console.warn('[PWA] Service worker registration failed:', err);
    }

    if (typeof document !== 'undefined' && typeof window !== 'undefined') {
      const triggerBackgroundCheck = () => {
        if (document.visibilityState !== 'visible') return;
        const now = this.getNow();
        if (now - this.lastCheckAt < VISIBILITY_THROTTLE_MS) return;
        this.lastCheckAt = now;
        void this.registration?.update().catch(() => {});
      };

      const onOnline = () => {
        void this.registration?.update().catch(() => {});
      };

      document.addEventListener('visibilitychange', triggerBackgroundCheck);
      window.addEventListener('online', onOnline);
      const intervalId = window.setInterval(() => {
        if (document.visibilityState === 'visible') {
          void this.registration?.update().catch(() => {});
        }
      }, UPDATE_CHECK_INTERVAL_MS);

      this.cleanupFns.push(() => {
        document.removeEventListener('visibilitychange', triggerBackgroundCheck);
        window.removeEventListener('online', onOnline);
        window.clearInterval(intervalId);
      });
    }
  }

  async checkForUpdate(): Promise<PwaUpdateCheckStatus> {
    const sw = this.getServiceWorkerContainer();
    if (!sw) {
      this.setSnapshot({ checkStatus: 'unsupported' });
      return 'unsupported';
    }

    this.setSnapshot({ checkStatus: 'checking' });

    try {
      let reg = this.registration;
      if (!reg && typeof sw.getRegistration === 'function') {
        reg = (await sw.getRegistration()) ?? null;
        if (reg) {
          this.watchRegistration(reg);
        }
      }

      if (!reg) {
        this.setSnapshot({ checkStatus: 'unsupported' });
        return 'unsupported';
      }

      this.lastCheckAt = this.getNow();
      await reg.update();

      if (reg.waiting && sw.controller) {
        this.markUpdateAvailable();
        return 'update_available';
      }

      if (reg.installing) {
        const installingWorker = reg.installing;
        const installed = await new Promise<boolean>((resolve) => {
          const timer = setTimeout(() => {
            installingWorker.removeEventListener('statechange', onState);
            resolve(false);
          }, INSTALLING_WAIT_TIMEOUT_MS);

          const onState = () => {
            if (installingWorker.state === 'installed') {
              clearTimeout(timer);
              installingWorker.removeEventListener('statechange', onState);
              resolve(true);
            } else if (installingWorker.state === 'redundant') {
              clearTimeout(timer);
              installingWorker.removeEventListener('statechange', onState);
              resolve(false);
            }
          };
          installingWorker.addEventListener('statechange', onState);
          onState();
        });

        if (installed && (reg.waiting || sw.controller)) {
          this.markUpdateAvailable();
          return 'update_available';
        }
      }

      this.setSnapshot({ checkStatus: 'up_to_date' });
      return 'up_to_date';
    } catch (err) {
      console.warn('[PWA] Manual update check failed:', err);
      this.setSnapshot({ checkStatus: 'up_to_date' });
      return 'up_to_date';
    }
  }

  async applyUpdate(): Promise<void> {
    if (this.snapshot.isUpdating) return;
    this.setSnapshot({ isUpdating: true });
    this.awaitingControllerReload = true;

    const sw = this.getServiceWorkerContainer();
    let waiting = this.registration?.waiting ?? null;

    if (!waiting && sw && typeof sw.getRegistration === 'function') {
      try {
        const reg = await sw.getRegistration();
        waiting = reg?.waiting ?? null;
      } catch {
        // Ignore lookup error and fallback to reload
      }
    }

    if (waiting && typeof waiting.postMessage === 'function') {
      waiting.postMessage({ type: 'SKIP_WAITING' });
      setTimeout(() => {
        this.reloadPage();
      }, RELOAD_FALLBACK_TIMEOUT_MS);
      return;
    }

    this.reloadPage();
  }

  dismiss(): void {
    this.setSnapshot({ isDismissed: true });
  }

  dispose(): void {
    this.cleanupFns.forEach((fn) => fn());
    this.cleanupFns = [];
    this.initialized = false;
    this.registration = null;
  }
}

export const pwaUpdateManager = new PwaUpdateManager();
