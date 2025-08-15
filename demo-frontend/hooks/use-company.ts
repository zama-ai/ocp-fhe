import { useQuery } from '@tanstack/react-query';
import { Company } from '@/lib/types/company';
import { Round as FrontendRound } from '@/components/round-card';

interface CompanyData {
  id: string;
  name: string;
  founder: string;
  contractAddress: string;
  createdAt: string;
  updatedAt: string;
  rounds: FrontendRound[];
}

interface ApiResponse {
  success: boolean;
  data?: Company;
  error?: string;
  message?: string;
}

async function fetchCompany(companyId: string): Promise<CompanyData> {
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
  const frontendRounds: FrontendRound[] = backendCompany.rounds.map(
    backendRound => ({
      id: backendRound.id,
      name: backendRound.type, // Backend uses 'type', frontend expects 'name'
      date: backendRound.date,
      investors: backendRound.investors.map((investor, index) => ({
        id: `${backendRound.id}-investor-${index}`,
        name: investor.name || 'Unknown',
        address: investor.address,
        shares: null, // Encrypted on-chain, not available in backend
        pricePerShare: null, // Encrypted on-chain, not available in backend
        investment: null, // Encrypted on-chain, not available in backend
        hasAccess: true, // For demo purposes - in real app this would depend on user role/permissions
      })),
    })
  );

  console.log(`Transformed company data for ${companyId}:`, {
    id: backendCompany.id,
    name: backendCompany.name,
    founder: backendCompany.founder,
    contractAddress: backendCompany.contractAddress,
    createdAt: backendCompany.createdAt,
    updatedAt: backendCompany.updatedAt,
    rounds: backendCompany.rounds,
    frontendRounds,
  });

  return {
    id: backendCompany.id,
    name: backendCompany.name,
    founder: backendCompany.founder,
    contractAddress: backendCompany.contractAddress,
    createdAt: backendCompany.createdAt,
    updatedAt: backendCompany.updatedAt,
    rounds: frontendRounds,
  };
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
