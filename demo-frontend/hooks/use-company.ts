import { useQuery } from '@tanstack/react-query';
import { Company } from '@/lib/types/company';

interface ApiResponse {
  success: boolean;
  data?: Company;
  error?: string;
  message?: string;
}

async function fetchCompany(companyId: string): Promise<Company> {
  const response = await fetch(
    `/api/companies/${encodeURIComponent(companyId)}`
  );
  const result: ApiResponse = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.error || result.message || 'Failed to fetch company'
    );
  }

  if (!result.data) {
    throw new Error('No company data received');
  }

  // Transform backend Company data to frontend format
  const backendCompany = result.data;

  return backendCompany;
}

export function useCompany(companyId: string) {
  return useQuery({
    queryKey: ['company', companyId],
    queryFn: () => fetchCompany(companyId),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404 errors
      if (error.message.includes('Company not found')) {
        return false;
      }
      return failureCount < 3;
    },
  });
}
