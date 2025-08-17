'use client';

import { useEffect, useRef } from 'react';
import { useAccount } from '@/hooks/wagmi-viem-proxy/use-account';
import { useRoleStore } from '@/stores/role-store';
import { useDecryptionStore } from '@/stores/decryption-store';

/**
 * Hook that monitors role and wallet account changes and clears the decryption store
 * when either changes. This ensures that decrypted data doesn't persist across
 * different user contexts.
 */
export function useStoreSync() {
  const { address } = useAccount();
  const role = useRoleStore(state => state.role);
  const clearAllDecryptedData = useDecryptionStore(
    state => state.clearAllDecryptedData
  );

  // Use refs to track previous values and distinguish initial load from changes
  const prevAddressRef = useRef<string | undefined>(undefined);
  const prevRoleRef = useRef<string | undefined>(undefined);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // On first render, just store the current values without clearing
    if (!isInitializedRef.current) {
      prevAddressRef.current = address;
      prevRoleRef.current = role;
      isInitializedRef.current = true;
      return;
    }

    // Check if wallet address changed
    const addressChanged = prevAddressRef.current !== address;

    // Check if role changed
    const roleChanged = prevRoleRef.current !== role;

    // Clear decryption store if either changed
    if (addressChanged || roleChanged) {
      clearAllDecryptedData();

      // Update refs with new values
      prevAddressRef.current = address;
      prevRoleRef.current = role;
    }
  }, [address, role, clearAllDecryptedData]);
}
