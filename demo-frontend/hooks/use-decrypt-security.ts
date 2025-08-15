'use client';

import { useCallback } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { toast } from 'sonner';
import { useDecryptionStore } from '@/stores/decryption-store';
import { useRoleStore } from '@/stores/role-store';
import { useFhevm } from '@/hooks/use-fhevm';
import { privateStockFacetAbi } from '@/lib/abi/privateStockFacetAbi';
import {
  clientToEthersTransport,
  clientToSigner,
} from '@/lib/wagmi-etheres-adapter';
import { useConnectorClient } from 'wagmi';
import { readContract } from '@wagmi/core';
import { config } from '@/config/wagmi';

export interface UseDecryptSecurityResult {
  decryptSecurity: (securityId: string) => Promise<void>;
  decryptAllPermitted: (
    securityIds: string[],
    investorAddresses: string[]
  ) => Promise<void>;
  isDecrypted: (securityId: string) => boolean;
  isLoading: (securityId: string) => boolean;
  getDecryptedData: (
    securityId: string
  ) => { quantity: number; sharePrice: number; investment: number } | null;
  clearDecrypted: (securityId?: string) => void;
}

interface PrivateStockPosition {
  stakeholder_address: string;
  stock_class_id: string;
  quantity: string; // encrypted bytes32
  share_price: string; // encrypted bytes32
}

export function useDecryptSecurity(
  companyAddress: string
): UseDecryptSecurityResult {
  const { address: walletAddress } = useAccount();
  const { data: client } = useConnectorClient();
  const { role } = useRoleStore();
  const { data: fhevmInstance } = useFhevm();

  const {
    setDecryptedData,
    setLoading,
    clearDecryptedData,
    isDecrypted,
    isLoading,
    getDecryptedData: getStoreData,
  } = useDecryptionStore();

  // Permission check helper
  const canDecrypt = useCallback(
    (investorAddress: string): boolean => {
      if (!walletAddress) return false;

      if (role === 'FOUNDER') return true;
      if (role === 'INVESTOR') {
        return walletAddress.toLowerCase() === investorAddress.toLowerCase();
      }
      return false; // PUBLIC role
    },
    [role, walletAddress]
  );

  // Get decrypted data with proper formatting
  const getDecryptedData = useCallback(
    (securityId: string) => {
      const data = getStoreData(companyAddress, securityId);
      if (!data) return null;

      return {
        quantity: data.quantity,
        sharePrice: data.sharePrice,
        investment: data.investment,
      };
    },
    [companyAddress, getStoreData]
  );

  // Check if security is decrypted
  const isSecurityDecrypted = useCallback(
    (securityId: string): boolean => {
      return isDecrypted(companyAddress, securityId);
    },
    [companyAddress, isDecrypted]
  );

  // Check if security is loading
  const isSecurityLoading = useCallback(
    (securityId: string): boolean => {
      return isLoading(companyAddress, securityId);
    },
    [companyAddress, isLoading]
  );

  // Clear decrypted data
  const clearDecrypted = useCallback(
    (securityId?: string) => {
      clearDecryptedData(companyAddress, securityId);
    },
    [companyAddress, clearDecryptedData]
  );

  // Main decryption function
  const decryptSecurity = useCallback(
    async (securityId: string) => {
      if (!walletAddress || !client || !fhevmInstance) {
        toast.error('Wallet not connected or FHEVM not initialized');
        return;
      }

      // Check if already decrypted
      if (isSecurityDecrypted(securityId)) {
        return;
      }

      // Check if already loading
      if (isSecurityLoading(securityId)) {
        return;
      }

      try {
        setLoading(companyAddress, securityId, true);

        // Fetch encrypted data from blockchain
        const position = await readContract(config, {
          address: companyAddress as `0x${string}`,
          abi: privateStockFacetAbi,
          functionName: 'getPrivateStockPosition',
          args: [securityId as `0x${string}`],
        });

        if (!position) {
          throw new Error('No position data found for this security');
        }

        const stockPosition = position as PrivateStockPosition;

        // Check permissions
        if (!canDecrypt(stockPosition.stakeholder_address)) {
          throw new Error(
            'You do not have permission to decrypt this security'
          );
        }

        // Perform FHE decryption
        const signer = clientToSigner(client);

        // Generate keypair
        const keypair = fhevmInstance.generateKeypair();

        // Prepare handles for decryption
        const handleContractPairs = [
          {
            handle: stockPosition.quantity,
            contractAddress: companyAddress,
          },
          {
            handle: stockPosition.share_price,
            contractAddress: companyAddress,
          },
        ];

        const startTimeStamp = Math.floor(Date.now() / 1000).toString();
        const durationDays = '10';
        const contractAddresses = [companyAddress];

        // Create EIP712 signature
        const eip712 = fhevmInstance.createEIP712(
          keypair.publicKey,
          contractAddresses,
          startTimeStamp,
          durationDays
        );

        console.log(signer);

        const signature = await signer.signTypedData(
          eip712.domain,
          {
            UserDecryptRequestVerification:
              eip712.types.UserDecryptRequestVerification,
          },
          eip712.message
        );

        // Decrypt the values
        const result = await fhevmInstance.userDecrypt(
          handleContractPairs,
          keypair.privateKey,
          keypair.publicKey,
          signature.replace('0x', ''),
          contractAddresses,
          signer.address,
          startTimeStamp,
          durationDays
        );

        // Extract decrypted values
        const quantity = parseInt(result[stockPosition.quantity].toString());
        const sharePrice = parseInt(
          result[stockPosition.share_price].toString()
        );
        const investment = quantity * sharePrice;

        // Store decrypted data
        setDecryptedData(companyAddress, securityId, {
          quantity,
          sharePrice,
          investment,
          timestamp: Date.now(),
        });

        toast.success('Security decrypted successfully');
      } catch (error) {
        console.error('Decryption error:', error);

        if (error instanceof Error) {
          if (error.message.includes('permission')) {
            toast.error('Access denied: You cannot decrypt this security');
          } else if (error.message.includes('network')) {
            toast.error(
              'Network error: Please check your connection and try again'
            );
          } else {
            toast.error(`Decryption failed: ${error.message}`);
          }
        } else {
          toast.error('Decryption failed: Unknown error occurred');
        }
      } finally {
        setLoading(companyAddress, securityId, false);
      }
    },
    [
      walletAddress,
      client,
      fhevmInstance,
      companyAddress,
      canDecrypt,
      isSecurityDecrypted,
      isSecurityLoading,
      setLoading,
      setDecryptedData,
    ]
  );

  // Decrypt all permitted securities
  const decryptAllPermitted = useCallback(
    async (securityIds: string[], investorAddresses: string[]) => {
      if (!walletAddress) {
        toast.error('Wallet not connected');
        return;
      }

      const permittedSecurities = securityIds.filter((_, index) => {
        const investorAddress = investorAddresses[index];
        return (
          canDecrypt(investorAddress) &&
          !isSecurityDecrypted(securityIds[index])
        );
      });

      if (permittedSecurities.length === 0) {
        toast.info('No securities available for decryption');
        return;
      }

      toast.info(`Decrypting ${permittedSecurities.length} securities...`);

      // Decrypt securities sequentially to avoid overwhelming the system
      for (const securityId of permittedSecurities) {
        try {
          await decryptSecurity(securityId);
          // Small delay between decryptions
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Failed to decrypt security ${securityId}:`, error);
          // Continue with other securities even if one fails
        }
      }

      toast.success('Bulk decryption completed');
    },
    [walletAddress, canDecrypt, isSecurityDecrypted, decryptSecurity]
  );

  return {
    decryptSecurity,
    decryptAllPermitted,
    isDecrypted: isSecurityDecrypted,
    isLoading: isSecurityLoading,
    getDecryptedData,
    clearDecrypted,
  };
}
