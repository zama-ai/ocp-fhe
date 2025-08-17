'use client';

import { useMemo } from 'react';
import { useConnectorClient } from 'wagmi';
import { useRole } from './use-role';
import { clientToSigner } from '@/lib/wagmi-etheres-adapter';
import { Wallet } from 'ethers';

export function useSigner() {
  const { isOwnWallet, selectedWallet } = useRole();
  const { data: connectorClient } = useConnectorClient();

  return useMemo(() => {
    if (isOwnWallet) {
      // Use connected wallet via wagmi
      return connectorClient ? clientToSigner(connectorClient) : undefined;
    } else {
      // Use predefined wallet with private key
      if (selectedWallet?.privateKey) {
        return new Wallet(selectedWallet.privateKey);
      }
    }
    return undefined;
  }, [isOwnWallet, selectedWallet, connectorClient]);
}
