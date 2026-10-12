'use client';

import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider, type PersistQueryClientOptions } from '@tanstack/react-query-persist-client';
import { useState, type ReactNode } from 'react';
import type { ApiConfig } from '@/config';
import { createHttpClient } from '@/lib/api/create-http-client';
import { createQueryClient } from '@/lib/query/query-client';
import { createServices } from '@/lib/api/services/create-services';
import { ServicesContext } from './services-context';

export interface ApiProviderProps {
  readonly config?: ApiConfig;
  /** Inject a client in tests; otherwise one is created per provider. */
  readonly queryClient?: QueryClient;
  readonly persistOptions?: Omit<PersistQueryClientOptions, 'queryClient'>;
  readonly children: ReactNode;
}

/** Wrap each app root once (web `app/providers.tsx`). */
export function ApiProvider({ config, queryClient, persistOptions, children }: ApiProviderProps) {
  const [services] = useState(() => createServices(createHttpClient(config)));
  const [client] = useState(() => queryClient ?? createQueryClient());

  if (persistOptions) {
    return (
      <PersistQueryClientProvider client={client} persistOptions={persistOptions}>
        <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>
      </PersistQueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={client}>
      <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>
    </QueryClientProvider>
  );
}
