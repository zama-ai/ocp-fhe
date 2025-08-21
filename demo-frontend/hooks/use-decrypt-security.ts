'use client';

import { useCallback } from 'react';
import { useAccount } from '@/hooks/wagmi-viem-proxy/use-account';
import { toast } from 'sonner';
import { useDecryptionStore } from '@/stores/decryption-store';
import { useRoleStore } from '@/stores/role-store';
import { useFhevm } from '@/hooks/use-fhevm';
import { privateStockFacetAbi } from '@/lib/abi/privateStockFacetAbi';
import { readContract } from '@wagmi/core';
import { config } from '@/config/wagmi';
import { useSigner } from './use-signer';

export interface UseDecryptSecurityResult {
  decryptSecurities: (securityIds: string[]) => Promise<void>;
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
  const { data: signer } = useSigner();
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
      if (role === 'ADMIN') return true; // Admins can decrypt all data

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

  // Main batch decryption function
  const decryptSecurities = useCallback(
    async (securityIds: string[]) => {
      if (!walletAddress || !signer || !fhevmInstance) {
        toast.error('Wallet not connected or FHEVM not initialized');
        return;
      }

      // Filter out already decrypted or loading securities
      const securitiesToDecrypt = securityIds.filter(
        securityId =>
          !isSecurityDecrypted(securityId) && !isSecurityLoading(securityId)
      );

      if (securitiesToDecrypt.length === 0) {
        return;
      }

      try {
        // Set loading state for all securities
        securitiesToDecrypt.forEach(securityId => {
          setLoading(companyAddress, securityId, true);
        });

        // Batch fetch encrypted data from blockchain
        const positionPromises = securitiesToDecrypt.map(securityId =>
          readContract(config, {
            address: companyAddress as `0x${string}`,
            abi: privateStockFacetAbi,
            functionName: 'getPrivateStockPosition',
            args: [securityId as `0x${string}`],
          }).then(position => ({ securityId, position }))
        );

        const positionResults = await Promise.all(positionPromises);

        // Filter out securities without positions and check permissions
        const validSecurities: Array<{
          securityId: string;
          position: PrivateStockPosition;
        }> = [];

        for (const { securityId, position } of positionResults) {
          if (!position) {
            console.error(`No position data found for security ${securityId}`);
            continue;
          }

          const stockPosition = position as PrivateStockPosition;

          // Check permissions
          if (!canDecrypt(stockPosition.stakeholder_address)) {
            console.error(
              `No permission to decrypt security ${securityId} for ${stockPosition.stakeholder_address}`
            );
            continue;
          }

          validSecurities.push({ securityId, position: stockPosition });
        }

        if (validSecurities.length === 0) {
          throw new Error('No securities available for decryption');
        }

        // Perform FHE decryption

        // Generate keypair
        const keypair = fhevmInstance.generateKeypair();

        // Prepare handles for batch decryption
        const handleContractPairs: Array<{
          handle: string;
          contractAddress: string;
        }> = [];

        // Build mapping of handles to securities for result parsing
        const handleToSecurity: Record<string, string> = {};

        validSecurities.forEach(({ securityId, position }) => {
          // Add quantity handle
          handleContractPairs.push({
            handle: position.quantity,
            contractAddress: companyAddress,
          });
          handleToSecurity[position.quantity] = securityId;

          // Add share_price handle
          handleContractPairs.push({
            handle: position.share_price,
            contractAddress: companyAddress,
          });
          handleToSecurity[position.share_price] = securityId;
        });

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

        const signature = await signer.signTypedData(
          eip712.domain,
          {
            UserDecryptRequestVerification:
              eip712.types.UserDecryptRequestVerification,
          },
          eip712.message
        );

        // Decrypt all values in a single call
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
        // // mock decryption, wait for 2 seconds
        // await new Promise(resolve => setTimeout(resolve, 2000));
        // const result: Record<string, bigint | boolean | string> = {};
        // validSecurities.forEach(({ securityId, position }) => {
        //   result[position.quantity] = BigInt(1000); // Mock quantity
        //   result[position.share_price] = BigInt(50); // Mock share price
        // });

        // Parse results and store decrypted data
        const decryptedSecurities: Record<
          string,
          { quantity: number; sharePrice: number }
        > = {};

        // Group results by security
        validSecurities.forEach(({ securityId, position }) => {
          const quantity = parseInt(result[position.quantity].toString());
          const sharePrice = parseInt(result[position.share_price].toString());

          decryptedSecurities[securityId] = { quantity, sharePrice };
        });

        // Store all decrypted data
        Object.entries(decryptedSecurities).forEach(
          ([securityId, { quantity, sharePrice }]) => {
            const investment = quantity * sharePrice;

            setDecryptedData(companyAddress, securityId, {
              quantity,
              sharePrice,
              investment,
              timestamp: Date.now(),
            });
          }
        );

        const successCount = Object.keys(decryptedSecurities).length;
        if (successCount === 1) {
          toast.success('Security decrypted successfully');
        } else {
          toast.success(`${successCount} securities decrypted successfully`);
        }
      } catch (error) {
        console.error('Batch decryption error:', error);

        if (error instanceof Error) {
          if (error.message.includes('permission')) {
            toast.error('Access denied: You cannot decrypt these securities');
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
        // Clear loading state for all securities
        securitiesToDecrypt.forEach(securityId => {
          setLoading(companyAddress, securityId, false);
        });
      }
    },
    [
      walletAddress,
      signer,
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

      // Use the new batch decryption function
      await decryptSecurities(permittedSecurities);

      toast.success('Bulk decryption completed');
    },
    [walletAddress, canDecrypt, isSecurityDecrypted, decryptSecurities]
  );

  return {
    decryptSecurities,
    decryptAllPermitted,
    isDecrypted: isSecurityDecrypted,
    isLoading: isSecurityLoading,
    getDecryptedData,
    clearDecrypted,
  };
}
