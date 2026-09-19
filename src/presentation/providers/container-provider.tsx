import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { createContainer, type Container } from '@/infrastructure/di/container';

const ContainerContext = createContext<Container | null>(null);

/**
 * Injects the composition root into the React tree.
 *
 * Screens and hooks consume use cases through this context — never importing
 * infrastructure directly. In tests, pass a `container` with test doubles to
 * exercise an entire screen without network, GPS or Firebase.
 */
export function ContainerProvider({
  children,
  container,
}: {
  children: ReactNode;
  container?: Container;
}) {
  const value = useMemo(() => container ?? createContainer(), [container]);

  return <ContainerContext.Provider value={value}>{children}</ContainerContext.Provider>;
}

export function useContainer(): Container {
  const container = useContext(ContainerContext);

  if (!container) {
    throw new Error('useContainer precisa estar dentro de <ContainerProvider>.');
  }

  return container;
}

/** Shortcut for the most common case: getting the use cases. */
export function useUseCases(): Container['useCases'] {
  return useContainer().useCases;
}
