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

export interface UseDecryptRoundResult {
  decryptRoundData: (roundId: string) => Promise<void>;
  isRoundDecrypted: (roundId: string) => boolean;
  isRoundLoading: (roundId: string) => boolean;
  getRoundDecryptedData: (roundId: string) => {
    preMoneyValuation: number;
    totalAmount: number;
    postMoneyValuation: number;
  } | null;
  clearRoundDecrypted: (roundId?: string) => void;
}

export function useDecryptRound(companyAddress: string): UseDecryptRoundResult {
  const { address: walletAddress } = useAccount();
  const { data: signer } = useSigner();
  const { role } = useRoleStore();
  const { data: fhevmInstance } = useFhevm();

  const {
    setDecryptedRoundData,
    setRoundLoading,
    clearDecryptedRoundData,
    isRoundDecrypted,
    isRoundLoading,
    getDecryptedRoundData: getStoreRoundData,
  } = useDecryptionStore();

  // Permission check helper - only founders/admins can decrypt round data
  const canDecryptRound = useCallback((): boolean => {
    if (!walletAddress) return false;
    if (role === 'ADMIN') return true; // Admins can decrypt all data
    if (role === 'FOUNDER') return true; // Founders can decrypt round data
    if (role === 'INVESTOR') return true;
    return false; // Investors and public cannot decrypt round totals
  }, [role, walletAddress]);

  // Get decrypted round data with proper formatting
  const getRoundDecryptedData = useCallback(
    (roundId: string) => {
      const data = getStoreRoundData(companyAddress, roundId);
      if (!data) return null;

      return {
        preMoneyValuation: data.preMoneyValuation,
        totalAmount: data.totalAmount,
        postMoneyValuation: data.postMoneyValuation,
      };
    },
    [companyAddress, getStoreRoundData]
  );

  // Check if round is decrypted
  const isRoundDecryptedCheck = useCallback(
    (roundId: string): boolean => {
      return isRoundDecrypted(companyAddress, roundId);
    },
    [companyAddress, isRoundDecrypted]
  );

  // Check if round is loading
  const isRoundLoadingCheck = useCallback(
    (roundId: string): boolean => {
      return isRoundLoading(companyAddress, roundId);
    },
    [companyAddress, isRoundLoading]
  );

  // Clear decrypted round data
  const clearRoundDecrypted = useCallback(
    (roundId?: string) => {
      clearDecryptedRoundData(companyAddress, roundId);
    },
    [companyAddress, clearDecryptedRoundData]
  );

  // Main round decryption function
  const decryptRoundData = useCallback(
    async (roundId: string) => {
      if (!walletAddress || !signer || !fhevmInstance) {
        toast.error('Wallet not connected or FHEVM not initialized');
        return;
      }

      if (!canDecryptRound()) {
        toast.error('Access denied: You cannot decrypt round data');
        return;
      }

      // Check if already decrypted or loading
      if (isRoundDecryptedCheck(roundId) || isRoundLoadingCheck(roundId)) {
        return;
      }

      try {
        // Set loading state
        setRoundLoading(companyAddress, roundId, true);

        // Fetch encrypted data from blockchain
        const [preMoneyValuationEncrypted, totalAmountEncrypted] =
          await Promise.all([
            readContract(config, {
              address: companyAddress as `0x${string}`,
              abi: privateStockFacetAbi,
              functionName: 'getRoundPreMoneyValuation',
              args: [roundId as `0x${string}`],
            }),
            readContract(config, {
              address: companyAddress as `0x${string}`,
              abi: privateStockFacetAbi,
              functionName: 'getRoundTotalAmount',
              args: [roundId as `0x${string}`],
            }),
          ]);

        if (!preMoneyValuationEncrypted || !totalAmountEncrypted) {
          throw new Error('No encrypted round data found');
        }

        // Perform FHE decryption
        // Generate keypair
        const keypair = fhevmInstance.generateKeypair();

        // Prepare handles for batch decryption
        const handleContractPairs: Array<{
          handle: string;
          contractAddress: string;
        }> = [
          {
            handle: preMoneyValuationEncrypted as string,
            contractAddress: companyAddress,
          },
          {
            handle: totalAmountEncrypted as string,
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

        // // Mock decryption for testing - uncomment for development
        // await new Promise(resolve => setTimeout(resolve, 2000));
        // const result: Record<string, bigint | boolean | string> = {};
        // result[preMoneyValuationEncrypted as string] = BigInt(5000000); // Mock $5M pre-money
        // result[totalAmountEncrypted as string] = BigInt(1000000); // Mock $1M total

        // Parse results
        const preMoneyValuation = parseInt(
          result[preMoneyValuationEncrypted as string].toString()
        );
        const totalAmount = parseInt(
          result[totalAmountEncrypted as string].toString()
        );

        // Calculate post-money valuation
        const postMoneyValuation = preMoneyValuation + totalAmount;

        // Store decrypted data
        setDecryptedRoundData(companyAddress, roundId, {
          preMoneyValuation,
          totalAmount,
          postMoneyValuation,
          timestamp: Date.now(),
        });

        toast.success('Round data decrypted successfully');
      } catch (error) {
        console.error('Round decryption error:', error);

        if (error instanceof Error) {
          if (error.message.includes('permission')) {
            toast.error('Access denied: You cannot decrypt round data');
          } else if (error.message.includes('network')) {
            toast.error(
              'Network error: Please check your connection and try again'
            );
          } else {
            toast.error(`Round decryption failed: ${error.message}`);
          }
        } else {
          toast.error('Round decryption failed: Unknown error occurred');
        }
      } finally {
        // Clear loading state
        setRoundLoading(companyAddress, roundId, false);
      }
    },
    [
      walletAddress,
      signer,
      fhevmInstance,
      companyAddress,
      canDecryptRound,
      isRoundDecryptedCheck,
      isRoundLoadingCheck,
      setRoundLoading,
      setDecryptedRoundData,
    ]
  );

  return {
    decryptRoundData,
    isRoundDecrypted: isRoundDecryptedCheck,
    isRoundLoading: isRoundLoadingCheck,
    getRoundDecryptedData,
    clearRoundDecrypted,
  };
}
