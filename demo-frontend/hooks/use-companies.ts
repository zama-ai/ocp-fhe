import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Company, CompanyCreateData } from '@/lib/types/company';

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

// Create company mutation
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
