'use client';

import { useQuery } from '@tanstack/react-query';

interface RoundSecurityIdsResponse {
  roundId: string;
  roundType: string;
  roundDate: string;
  securityIds: string[];
  investmentCount: number;
}

interface ApiResponse {
  success: boolean;
  data: RoundSecurityIdsResponse;
  error?: string;
}

export function useRoundSecurityIds(companyId: string, roundId: string) {
  return useQuery({
    queryKey: ['round-security-ids', companyId, roundId],
    queryFn: async (): Promise<RoundSecurityIdsResponse> => {
      const response = await fetch(
        `/api/companies/${companyId}/rounds/${roundId}/security-ids`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || 'Failed to fetch round security IDs'
        );
      }

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch round security IDs');
      }

      return result.data;
    },
    enabled: !!companyId && !!roundId,
  });
}
