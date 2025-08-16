import { useQuery } from '@tanstack/react-query';
import { Company } from '@/lib/types/company';
import { InvestmentRound } from '@/lib/types/investment';

async function fetchInvestorRounds(
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

  const investmentRounds: InvestmentRound[] = [];

  data.data.forEach((company: Company) => {
    // Filter rounds where the investor participated
    const investorRounds = company.rounds.filter(round =>
      round.investors.some(
        investor =>
          investor.address.toLowerCase() === investorAddress.toLowerCase()
      )
    );

    // Transform each round into an InvestmentRound
    investorRounds.forEach(round => {
      // Find the investor's data in this round
      const investorData = round.investors.find(
        investor =>
          investor.address.toLowerCase() === investorAddress.toLowerCase()
      );

      investmentRounds.push({
        id: round.id,
        companyId: company.id,
        companyName: company.name,
        roundType: round.type,
        date: round.date,
        createdAt: round.createdAt,
        investorAddress: investorAddress,
        investorName: investorData?.name,
        securityId: investorData?.securityId,
      });
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
    queryFn: () => fetchInvestorRounds(investorAddress!),
    enabled: !!investorAddress,
  });
}
