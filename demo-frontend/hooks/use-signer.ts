'use client';

import { useAccount, useConnectorClient } from 'wagmi';
import { useRole } from './use-role';
import { clientToSigner } from '@/lib/wagmi-etheres-adapter';
import { Wallet } from 'ethers';
import { useQuery } from '@tanstack/react-query';

export function useSigner() {
  const { isOwnWallet, selectedWallet } = useRole();
  const { data: connectorClient } = useConnectorClient();
  const { address: connectedAddress } = useAccount();

  return useQuery({
    queryKey: [
      'signer',
      isOwnWallet,
      selectedWallet ?? '0x',
      connectedAddress ?? '0x',
    ],
    queryFn: () => {
      if (isOwnWallet) {
        // Use connected wallet via wagmi
        return connectorClient ? clientToSigner(connectorClient) : null;
      } else {
        // Use predefined wallet with private key
        if (selectedWallet?.privateKey) {
          return new Wallet(selectedWallet.privateKey);
        }
      }
      return null;
    },
  });
}
