'use client';

import { useStoreSync } from '@/hooks/use-store-sync';

/**
 * Component that handles automatic clearing of the decryption store
 * when role or wallet account changes. This component should be rendered
 * once at the app level to ensure the synchronization works throughout
 * the application.
 */
export function StoreSync() {
  useStoreSync();
  return null; // This component doesn't render anything
}
