'use client';
import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { useAccount } from '@/hooks/wagmi-viem-proxy/use-account';
import {
  createInstance,
  initSDK,
  SepoliaConfig,
} from '@zama-fhe/relayer-sdk/bundle';
import { clientToEthersTransport } from '@/lib/wagmi-etheres-adapter';

const sepoliaChainId = 11155111; // Sepolia testnet chain ID

export function useFhevm() {
  const { address, chainId } = useAccount();

  const client = usePublicClient({
    chainId: sepoliaChainId,
  });

  return useQuery({
    queryKey: ['fhevm', address, chainId],
    queryFn: async () => {
      if (!address || !chainId || !client) {
        throw new Error('Address or chainId is not available');
      }
      if (chainId !== sepoliaChainId) {
        throw new Error('FHEVM is only available on Sepolia testnet');
      }
      await initSDK();

      const network = clientToEthersTransport(client);

      const instance = await createInstance({
        ...SepoliaConfig,
        network,
      });
      console.log('FHEVM instance created:', instance);
      return instance;
    },
    enabled: !!address && !!chainId && !!client,
    // do not refresh automatically
    staleTime: Infinity,
  });
}
