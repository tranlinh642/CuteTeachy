'use client';

import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import type { ApiConfig } from '../config/api-config';
import { createHttpClient } from '../http/create-http-client';
import { createQueryClient } from '../query/query-client';
import { createServices } from '../services/create-services';
import { ServicesContext } from './services-context';

export interface ApiProviderProps {
  readonly config?: ApiConfig;
  /** Inject a client in tests; otherwise one is created per provider. */
  readonly queryClient?: QueryClient;
  readonly children: ReactNode;
}

/** Wrap each app root once (web `app/providers.tsx`, mobile `_layout.tsx`). */
export function ApiProvider({ config, queryClient, children }: ApiProviderProps) {
  const [services] = useState(() => createServices(createHttpClient(config)));
  const [client] = useState(() => queryClient ?? createQueryClient());

  return (
    <QueryClientProvider client={client}>
      <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>
    </QueryClientProvider>
  );
}
