import { useAccount as useAccountWagmi } from 'wagmi';
import { useRole } from '../use-role';
import { useQuery } from '@tanstack/react-query';
import { PrivateKeyAccount } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
type UseAccountReturnType = {
  address: `0x${string}` | undefined;
  isConnected: boolean;
  chainId: number | undefined;
  proxyAccount?: PrivateKeyAccount;
};

export function useAccount(): UseAccountReturnType {
  const { selectedWallet, isOwnWallet } = useRole();
  const wagmiAccount = useAccountWagmi();

  const { data: accountData } = useQuery({
    queryKey: [
      'account-proxy',
      isOwnWallet,
      selectedWallet,
      wagmiAccount.address ?? '0x',
    ],
    queryFn: () => {
      if (isOwnWallet) {
        return wagmiAccount;
      }

      if (selectedWallet) {
        return {
          address: selectedWallet.address as `0x${string}`,
          isConnected: true,
          chainId: 11155111,
          proxyAccount: privateKeyToAccount(
            selectedWallet.privateKey as `0x${string}`
          ),
        } as UseAccountReturnType;
      }

      return {
        address: undefined,
        isConnected: false,
        chainId: undefined,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return (
    accountData || {
      address: undefined,
      isConnected: false,
      chainId: undefined,
    }
  );
}

// also used from wagmi:
// - useWriteContract
// - useWaitForTransactionReceipt
// - useConnectorClient
// - readContract (from wagmi/core)
