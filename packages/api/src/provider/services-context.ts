'use client';

import { createContext, useContext } from 'react';
import type { Services } from '../services/create-services';

export const ServicesContext = createContext<Services | null>(null);

/** Low-level access to services; prefer the domain hooks (`useTasks`, …). */
export function useServices(): Services {
  const services = useContext(ServicesContext);
  if (!services) throw new Error('useServices must be used inside <ApiProvider>.');
  return services;
}
