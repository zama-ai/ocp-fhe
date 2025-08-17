import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useAccount } from '@/hooks/wagmi-viem-proxy/use-account';
import { useState, useEffect, useMemo } from 'react';
import { parseEventLogs } from 'viem';
import {
  Company,
  CompanyCreateData,
  CompanyFormData,
} from '@/lib/types/company';
import { privateCapTableFactoryAbi } from '@/lib/abi/capTableFactoryAbi';
import { generateCompanyId } from '@/lib/utils/company';

// Fetch all companies
export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    queryFn: async (): Promise<Company[]> => {
      const response = await fetch('/api/companies');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch companies');
      }

      return data.data;
    },
  });
}

// Fetch companies by founder address
export function useFounderCompanies(founderAddress?: string) {
  return useQuery({
    queryKey: ['companies', 'founder', founderAddress],
    queryFn: async (): Promise<Company[]> => {
      if (!founderAddress) return [];

      const response = await fetch(`/api/companies/founder/${founderAddress}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch founder companies');
      }

      return data.data;
    },
    enabled: !!founderAddress,
  });
}

// Contract interaction hook for creating cap table
export function useCreateCompanyContract(companyId?: `0x${string}`) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { proxyAccount } = useAccount();

  // Wait for transaction confirmation and get receipt
  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({
    hash,
  });

  // Parse contract address from transaction receipt
  const contractAddress = useMemo(() => {
    if (!receipt || !companyId) return null;

    try {
      const logs = parseEventLogs({
        abi: privateCapTableFactoryAbi,
        eventName: 'CapTableCreated',
        logs: receipt.logs,
        args: { issuerId: companyId },
      });

      return (logs[0]?.args.capTable as string) || null;
    } catch (error) {
      console.error('Failed to parse CapTableCreated event:', error);
      return null;
    }
  }, [receipt, companyId]);

  const createCapTable = (companyId: `0x${string}`) => {
    const factoryAddress = process.env.NEXT_PUBLIC_FACTORY_ADDRESS;
    if (!factoryAddress) {
      throw new Error('Factory address not configured');
    }

    writeContract({
      account: proxyAccount,
      address: factoryAddress as `0x${string}`,
      abi: privateCapTableFactoryAbi,
      functionName: 'createCapTable',
      args: [companyId, BigInt(1)], // 1 for initialSharesAuthorized
    });
  };

  return {
    createCapTable,
    hash,
    receipt,
    contractAddress,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

// Create company mutation (saves to database after contract creation)
export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (companyData: CompanyCreateData): Promise<Company> => {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(companyData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create company');
      }

      return data.data;
    },
    onSuccess: () => {
      // Invalidate and refetch companies data
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
}

// Combined hook for the full company creation flow
export function useCreateCompanyFlow() {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const [companyId, setCompanyId] = useState<`0x${string}` | undefined>(
    undefined
  );
  const [step, setStep] = useState<'idle' | 'contract' | 'saving' | 'complete'>(
    'idle'
  );

  const contractHook = useCreateCompanyContract(companyId);
  const saveCompanyMutation = useCreateCompany();

  // Watch for contract confirmation and address from receipt
  useEffect(() => {
    if (
      contractHook.isConfirmed &&
      contractHook.contractAddress &&
      step === 'contract'
    ) {
      setStep('saving');
    }
  }, [contractHook.isConfirmed, contractHook.contractAddress, step]);

  const createCompany = async (formData: CompanyFormData) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    // Generate company ID and start contract creation
    const newCompanyId = generateCompanyId();
    setCompanyId(newCompanyId);
    setStep('contract');

    // Call smart contract
    contractHook.createCapTable(newCompanyId);

    return { companyId: newCompanyId, name: formData.name };
  };

  const saveToDatabase = async (name: string) => {
    if (!address || !contractHook.contractAddress || !companyId) {
      throw new Error('Missing required data for saving');
    }

    await saveCompanyMutation.mutateAsync({
      name,
      founder: address,
      contractAddress: contractHook.contractAddress,
      companyId,
    });

    setStep('complete');
    queryClient.invalidateQueries({ queryKey: ['companies'] });
  };

  const reset = () => {
    setCompanyId(undefined);
    setStep('idle');
  };

  return {
    createCompany,
    saveToDatabase,
    reset,
    step,
    companyId,
    contractAddress: contractHook.contractAddress,
    hash: contractHook.hash,
    isPending: contractHook.isPending,
    isConfirming: contractHook.isConfirming,
    isConfirmed: contractHook.isConfirmed,
    isSaving: saveCompanyMutation.isPending,
    error: contractHook.error || saveCompanyMutation.error,
  };
}
