'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAccount } from '@/hooks/wagmi-viem-proxy/use-account';
import { Company } from '@/lib/types/company';

interface UpdateVisibilityParams {
  companyId: string;
  roundId: string;
  isPubliclyVisible: boolean;
}

interface UseRoundVisibilityResult {
  updateVisibility: (params: UpdateVisibilityParams) => Promise<void>;
  isUpdating: boolean;
}

export function useRoundVisibility(): UseRoundVisibilityResult {
  const { address: walletAddress } = useAccount();
  const queryClient = useQueryClient();

  const updateVisibilityMutation = useMutation({
    mutationFn: async ({
      companyId,
      roundId,
      isPubliclyVisible,
    }: UpdateVisibilityParams) => {
      if (!walletAddress) {
        throw new Error('Wallet not connected');
      }

      const response = await fetch(
        `/api/companies/${companyId}/rounds/${roundId}/visibility`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            isPubliclyVisible,
            founderAddress: walletAddress,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update visibility');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Update the company data in the cache
      queryClient.setQueryData(
        ['company', variables.companyId],
        (oldData: Company | undefined) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            rounds: oldData.rounds.map(round =>
              round.id === variables.roundId
                ? { ...round, isPubliclyVisible: variables.isPubliclyVisible }
                : round
            ),
          };
        }
      );

      // Also update company by name cache if it exists
      queryClient.invalidateQueries({
        queryKey: ['company-by-name'],
      });

      toast.success(
        variables.isPubliclyVisible
          ? 'Round metrics are now publicly visible'
          : 'Round metrics are now private'
      );
    },
    onError: (error: Error) => {
      console.error('Error updating round visibility:', error);

      if (error.message.includes('Only company founder')) {
        toast.error(
          'Access denied: Only company founders can change visibility'
        );
      } else if (error.message.includes('Wallet not connected')) {
        toast.error('Please connect your wallet to continue');
      } else {
        toast.error(`Failed to update visibility: ${error.message}`);
      }
    },
  });

  const updateVisibility = useCallback(
    async (params: UpdateVisibilityParams) => {
      await updateVisibilityMutation.mutateAsync(params);
    },
    [updateVisibilityMutation]
  );

  return {
    updateVisibility,
    isUpdating: updateVisibilityMutation.isPending,
  };
}
