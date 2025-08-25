import { Company, Round, Investment } from '@/lib/types/company';

export interface OwnershipData {
  address: string;
  name: string;
  totalShares: number;
  ownershipPercentage: number;
  rounds: string[]; // Round types the investor participated in
  securityIds: string[]; // Security IDs for decryption
}

export interface TreasuryData {
  shares: number;
  ownershipPercentage: number;
}

export interface OwnershipCalculation {
  treasury: TreasuryData;
  investors: OwnershipData[];
  totalShares: number;
  totalInvestorShares: number;
}

const TREASURY_SHARES = 10_000;

/**
 * Calculate ownership percentages for a company
 */
export function calculateOwnership(
  company: Company | null
): OwnershipCalculation {
  if (!company || !company.rounds) {
    return {
      treasury: {
        shares: TREASURY_SHARES,
        ownershipPercentage: 100,
      },
      investors: [],
      totalShares: TREASURY_SHARES,
      totalInvestorShares: 0,
    };
  }

  // Aggregate investor data across all rounds
  const investorMap = new Map<
    string,
    {
      name: string;
      totalShares: number;
      rounds: Set<string>;
      securityIds: string[];
    }
  >();

  let totalInvestorShares = 0;

  // Process all rounds and investments
  company.rounds.forEach((round: Round) => {
    if (!round.investments || !Array.isArray(round.investments)) {
      return;
    }

    round.investments.forEach((investment: Investment) => {
      const address = investment.investor.address.toLowerCase();
      const shares = investment.shareAmount || 0;

      totalInvestorShares += shares;

      if (!investorMap.has(address)) {
        investorMap.set(address, {
          name: investment.investor.name || 'Unknown Investor',
          totalShares: 0,
          rounds: new Set(),
          securityIds: [],
        });
      }

      const investorData = investorMap.get(address)!;
      investorData.totalShares += shares;
      investorData.rounds.add(round.type);

      // Add security ID if available
      if (investment.investor.securityId) {
        investorData.securityIds.push(investment.investor.securityId);
      }
    });
  });

  const totalShares = TREASURY_SHARES + totalInvestorShares;

  // Calculate treasury percentage
  const treasury: TreasuryData = {
    shares: TREASURY_SHARES,
    ownershipPercentage:
      totalShares > 0 ? (TREASURY_SHARES / totalShares) * 100 : 100,
  };

  // Convert investor map to array with ownership percentages
  const investors: OwnershipData[] = Array.from(investorMap.entries()).map(
    ([address, data]) => ({
      address,
      name: data.name,
      totalShares: data.totalShares,
      ownershipPercentage:
        totalShares > 0 ? (data.totalShares / totalShares) * 100 : 0,
      rounds: Array.from(data.rounds),
      securityIds: data.securityIds,
    })
  );

  // Sort investors by ownership percentage (descending)
  investors.sort((a, b) => b.ownershipPercentage - a.ownershipPercentage);

  return {
    treasury,
    investors,
    totalShares,
    totalInvestorShares,
  };
}

/**
 * Format ownership percentage for display
 */
export function formatOwnershipPercentage(percentage: number): string {
  if (percentage === 0) return '0%';
  if (percentage < 0.01) return '<0.01%';
  if (percentage >= 99.99) return '>99.99%';
  return `${percentage.toFixed(2)}%`;
}

/**
 * Format share count for display
 */
export function formatShares(shares: number): string {
  if (shares >= 1_000_000) {
    return `${(shares / 1_000_000).toFixed(1)}M`;
  }
  if (shares >= 1_000) {
    return `${(shares / 1_000).toFixed(1)}K`;
  }
  return shares.toLocaleString();
}

/**
 * Get unique security IDs that need decryption for a given wallet address and role
 */
export function getSecurityIdsForDecryption(
  ownership: OwnershipCalculation,
  walletAddress: string | undefined,
  role: string
): string[] {
  if (!walletAddress) return [];

  const securityIds: string[] = [];

  if (role === 'FOUNDER' || role === 'ADMIN') {
    // Founders and admins can decrypt all securities
    ownership.investors.forEach(investor => {
      securityIds.push(...investor.securityIds);
    });
  } else if (role === 'INVESTOR') {
    // Investors can only decrypt their own securities
    const investor = ownership.investors.find(
      inv => inv.address.toLowerCase() === walletAddress.toLowerCase()
    );
    if (investor) {
      securityIds.push(...investor.securityIds);
    }
  }

  // Remove duplicates
  return Array.from(new Set(securityIds));
}

/**
 * Check if an investor's data can be decrypted by the current user
 */
export function canDecryptInvestor(
  investorAddress: string,
  walletAddress: string | undefined,
  role: string
): boolean {
  if (!walletAddress) return false;

  if (role === 'FOUNDER' || role === 'ADMIN') return true;

  if (role === 'INVESTOR') {
    return walletAddress.toLowerCase() === investorAddress.toLowerCase();
  }

  return false; // PUBLIC role
}
