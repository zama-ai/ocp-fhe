import { useQuery } from '@tanstack/react-query';
import { InvestmentRound } from '@/lib/types/investment';
import { Company } from '@/lib/types/company';
import { generateMockAllocation } from '@/lib/utils/investment-mocks';

async function fetchInvestorCompanies(
  investorAddress: string
): Promise<InvestmentRound[]> {
  const response = await fetch(`/api/companies/investor/${investorAddress}`);

  if (!response.ok) {
    throw new Error('Failed to fetch investor companies');
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch investor companies');
  }

  // Transform company data into investment rounds
  const investmentRounds: InvestmentRound[] = [];

  data.data.forEach((company: Company) => {
    company.rounds.forEach(round => {
      // Check if the investor is in this round
      const isInvestorInRound = round.investors.some(
        investor =>
          investor.address.toLowerCase() === investorAddress.toLowerCase()
      );

      if (isInvestorInRound) {
        investmentRounds.push({
          id: `${company.id}_${round.id}`,
          companyId: company.id,
          companyName: company.name,
          roundType: round.type,
          date: round.date,
          allocation: generateMockAllocation(investorAddress, round.id),
        });
      }
    });
  });

  // Sort by date (newest first)
  return investmentRounds.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function useInvestments(investorAddress?: string) {
  return useQuery({
    queryKey: ['investments', investorAddress],
    queryFn: () => fetchInvestorCompanies(investorAddress!),
    enabled: !!investorAddress,
  });
}
