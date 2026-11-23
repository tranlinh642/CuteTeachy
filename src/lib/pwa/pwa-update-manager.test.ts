import { describe, expect, it, vi } from 'vitest';
import { PwaUpdateManager } from './pwa-update-manager';

function createEventTargetMock() {
  const listeners = new Map<string, Set<() => void>>();
  return {
    addEventListener(type: string, cb: () => void) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(cb);
    },
    removeEventListener(type: string, cb: () => void) {
      listeners.get(type)?.delete(cb);
    },
    emit(type: string) {
      listeners.get(type)?.forEach((cb) => cb());
    },
  };
}

describe('PwaUpdateManager', () => {
  it('detects a waiting Service Worker on init and posts SKIP_WAITING + reloads on controllerchange when applyUpdate is called', async () => {
    const swEvents = createEventTargetMock();
    const regEvents = createEventTargetMock();
    const postMessage = vi.fn();
    const reload = vi.fn();

    const waitingWorker = {
      state: 'installed',
      postMessage,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as ServiceWorker;

    const registration = {
      waiting: waitingWorker,
      installing: null,
      update: vi.fn().mockResolvedValue(undefined),
      addEventListener: regEvents.addEventListener,
      removeEventListener: regEvents.removeEventListener,
    } as unknown as ServiceWorkerRegistration;

    const swContainer = {
      controller: {} as ServiceWorker,
      register: vi.fn().mockResolvedValue(registration),
      getRegistration: vi.fn().mockResolvedValue(registration),
      addEventListener: swEvents.addEventListener,
      removeEventListener: swEvents.removeEventListener,
    } as unknown as ServiceWorkerContainer;

    const manager = new PwaUpdateManager({ serviceWorker: swContainer, reload });

    await manager.init({ register: true });

    expect(swContainer.register).toHaveBeenCalledWith('/sw.js', { updateViaCache: 'none' });
    expect(manager.getSnapshot().hasUpdate).toBe(true);
    expect(manager.getSnapshot().checkStatus).toBe('update_available');

    // Dismissing hides banner without losing hasUpdate
    manager.dismiss();
    expect(manager.getSnapshot().isDismissed).toBe(true);
    expect(manager.getSnapshot().hasUpdate).toBe(true);

    // Applying update sends SKIP_WAITING and reloads once controllerchange fires
    await manager.applyUpdate();
    expect(postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    expect(manager.getSnapshot().isUpdating).toBe(true);
    expect(reload).not.toHaveBeenCalled();

    swEvents.emit('controllerchange');
    expect(reload).toHaveBeenCalledTimes(1);

    manager.dispose();
  });

  it('detects newly installed worker via updatefound and reports up_to_date when no update exists', async () => {
    const swEvents = createEventTargetMock();
    const regEvents = createEventTargetMock();
    const workerEvents = createEventTargetMock();

    const installingWorker = {
      state: 'installing',
      postMessage: vi.fn(),
      addEventListener: workerEvents.addEventListener,
      removeEventListener: workerEvents.removeEventListener,
    };

    const registration = {
      waiting: null as ServiceWorker | null,
      installing: null as unknown as ServiceWorker | null,
      update: vi.fn().mockResolvedValue(undefined),
      addEventListener: regEvents.addEventListener,
      removeEventListener: regEvents.removeEventListener,
    };

    const swContainer = {
      controller: {} as ServiceWorker,
      register: vi.fn().mockResolvedValue(registration),
      getRegistration: vi.fn().mockResolvedValue(registration),
      addEventListener: swEvents.addEventListener,
      removeEventListener: swEvents.removeEventListener,
    } as unknown as ServiceWorkerContainer;

    const manager = new PwaUpdateManager({ serviceWorker: swContainer, reload: vi.fn() });
    await manager.init({ register: true });

    expect(manager.getSnapshot().hasUpdate).toBe(false);

    const statusBefore = await manager.checkForUpdate();
    expect(statusBefore).toBe('up_to_date');
    expect(manager.getSnapshot().checkStatus).toBe('up_to_date');

    // Simulate new SW arriving
    registration.installing = installingWorker as unknown as ServiceWorker;
    regEvents.emit('updatefound');
    expect(manager.getSnapshot().hasUpdate).toBe(false);

    installingWorker.state = 'installed';
    workerEvents.emit('statechange');
    expect(manager.getSnapshot().hasUpdate).toBe(true);
    expect(manager.getSnapshot().checkStatus).toBe('update_available');

    manager.dispose();
  });
});
