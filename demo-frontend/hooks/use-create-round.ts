'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useAccount } from '@/hooks/wagmi-viem-proxy/use-account';
import { useFhevm } from './use-fhevm';
import { privateStockFacetAbi } from '@/lib/abi/privateStockFacetAbi';
import {
  generateBytes16Id,
  convertPriceToInteger,
  convertSharesToBigInt,
  STOCK_CLASS_ID,
} from '@/lib/utils/round';
import { RoundCreateData } from '@/lib/types/company';
import { PREDEFINED_WALLETS } from '@/lib/constants/wallets';

export interface InvestorFormData {
  name: string;
  address: string;
  shares: string;
  pricePerShare: string;
}

export interface CreateRoundFormData {
  roundName: string;
  roundDate: string;
  investors: InvestorFormData[];
}

interface EncryptedInvestorData {
  address: string;
  name: string;
  shares: number;
  pricePerShare: number;
  encryptedShares: string;
  encryptedPrice: string;
  id: `0x${string}`;
}

type CreateRoundStep =
  | 'idle'
  | 'encrypting'
  | 'contract'
  | 'saving'
  | 'complete';

export function useCreateRound(companyId: string, contractAddress: string) {
  const { address, proxyAccount } = useAccount();
  const queryClient = useQueryClient();
  const { data: fhevmInstance, isLoading: isFhevmLoading } = useFhevm();

  const [step, setStep] = useState<CreateRoundStep>('idle');
  const [encryptedData, setEncryptedData] = useState<EncryptedInvestorData[]>(
    []
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [inputProof, setInputProof] = useState<string>('');

  // Smart contract interaction
  const {
    writeContract,
    data: hash,
    isPending,
    error: contractError,
  } = useWriteContract();

  // Wait for transaction confirmation
  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({
    hash,
  });

  // Backend API call mutation
  const saveRoundMutation = useMutation({
    mutationFn: async (roundData: RoundCreateData): Promise<void> => {
      const response = await fetch(`/api/companies/${companyId}/rounds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roundData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create round');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setStep('complete');
    },
  });

  // Watch for contract confirmation and proceed to saving
  useEffect(() => {
    if (isConfirmed && step === 'contract') {
      setStep('saving');
    }
  }, [isConfirmed, step]);

  const encryptInvestorData = async (
    investors: InvestorFormData[]
  ): Promise<{
    encryptedInvestors: EncryptedInvestorData[];
    proof: string;
  }> => {
    if (!fhevmInstance || !address) {
      throw new Error('FHEVM instance or wallet not available');
    }

    // Create encrypted input buffer
    const buffer = fhevmInstance.createEncryptedInput(
      contractAddress as `0x${string}`,
      address
    );

    const encryptedInvestors: EncryptedInvestorData[] = [];

    // Add all investor data to the buffer
    for (const investor of investors) {
      const shares = parseFloat(investor.shares);
      const pricePerShare = parseFloat(investor.pricePerShare);

      if (shares <= 0 || pricePerShare <= 0) {
        throw new Error(
          `Invalid shares or price for investor ${investor.name}`
        );
      }

      const sharesBigInt = convertSharesToBigInt(shares);
      const priceBigInt = convertPriceToInteger(pricePerShare);

      // Add encrypted values to buffer
      buffer.add64(sharesBigInt);
      buffer.add64(priceBigInt);

      encryptedInvestors.push({
        address: investor.address,
        name: investor.name,
        shares,
        pricePerShare,
        encryptedShares: '', // Will be filled after encryption
        encryptedPrice: '', // Will be filled after encryption
        id: generateBytes16Id(),
      });
    }

    // Encrypt all values
    const ciphertexts = await buffer.encrypt();

    // Map encrypted handles back to investors (2 handles per investor: shares + price)
    for (let i = 0; i < encryptedInvestors.length; i++) {
      const sharesIndex = i * 2;
      const priceIndex = i * 2 + 1;

      // Convert Uint8Array handles to hex strings
      encryptedInvestors[i].encryptedShares =
        `0x${Buffer.from(ciphertexts.handles[sharesIndex]).toString('hex')}`;
      encryptedInvestors[i].encryptedPrice =
        `0x${Buffer.from(ciphertexts.handles[priceIndex]).toString('hex')}`;
    }

    return {
      encryptedInvestors,
      proof: `0x${Buffer.from(ciphertexts.inputProof).toString('hex')}`,
    };
  };

  const createRound = async (formData: CreateRoundFormData) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    if (!fhevmInstance) {
      throw new Error('FHEVM not initialized');
    }

    try {
      // Step 1: Encrypt investor data
      setStep('encrypting');
      const { encryptedInvestors, proof } = await encryptInvestorData(
        formData.investors
      );

      setEncryptedData(encryptedInvestors);
      setInputProof(proof);

      // Step 2: Prepare contract parameters
      const issueParams = encryptedInvestors.map(investor => ({
        id: investor.id,
        stock_class_id: STOCK_CLASS_ID,
        share_price: investor.encryptedPrice as `0x${string}`,
        quantity: investor.encryptedShares as `0x${string}`,
        stakeholder_address: investor.address as `0x${string}`,
        security_id: investor.id,
        custom_id: '',
        stock_legend_ids_mapping: '',
        security_law_exemptions_mapping: '',
        admin_viewer: PREDEFINED_WALLETS[5].address as `0x${string}`,
      }));

      // Step 3: Call smart contract
      setStep('contract');
      writeContract({
        account: proxyAccount,
        address: contractAddress as `0x${string}`,
        abi: privateStockFacetAbi,
        functionName: 'issuePrivateStocks',
        args: [issueParams, proof as `0x${string}`],
      });
    } catch (error) {
      setStep('idle');
      throw error;
    }
  };

  const saveToDatabase = async (roundName: string, roundDate: string) => {
    if (step !== 'saving') {
      throw new Error('Cannot save to database at this step');
    }

    // Prepare API payload with security IDs for database storage
    const apiInvestors = encryptedData.map(investor => ({
      address: investor.address,
      name: investor.name,
      securityId: investor.id, // Include the security ID for database storage
    }));

    await saveRoundMutation.mutateAsync({
      type: roundName,
      date: roundDate,
      investors: apiInvestors,
    });
  };

  const reset = () => {
    setStep('idle');
    setEncryptedData([]);
    setInputProof('');
  };

  return {
    createRound,
    saveToDatabase,
    reset,
    step,
    hash,
    receipt,
    isPending,
    isConfirming,
    isConfirmed,
    isSaving: saveRoundMutation.isPending,
    isEncrypting: step === 'encrypting',
    isFhevmLoading,
    error: contractError || saveRoundMutation.error,
    canProceed: {
      encrypt: !isFhevmLoading && !!fhevmInstance && !!address,
      contract: step === 'contract' && !isPending,
      save: step === 'saving' && !saveRoundMutation.isPending,
    },
  };
}
