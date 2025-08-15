import { InvestmentAllocation } from '@/lib/types/investment';

// Generate consistent mock data based on address + round for demo purposes
export function generateMockAllocation(
  investorAddress: string,
  roundId: string
): InvestmentAllocation {
  // Create a simple hash from address + roundId for consistent mock data
  const seed = hashString(investorAddress + roundId);

  // Generate mock values that would normally come from the blockchain (encrypted)
  const shares = 1000 + (seed % 50000); // 1,000 - 51,000 shares
  const pricePerShare = 0.5 + (seed % 100) / 10; // $0.50 - $10.50 per share
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const investment = shares * pricePerShare;

  return {
    shares: null, // Encrypted by default - will show actual values when decrypted
    pricePerShare: null,
    investment: null,
    hasAccess: true, // Investor can decrypt their own data
  };
}

// Get the actual decrypted values for display (simulates blockchain decryption)
export function getDecryptedValues(
  investorAddress: string,
  roundId: string
): { shares: number; pricePerShare: number; investment: number } {
  const seed = hashString(investorAddress + roundId);

  const shares = 1000 + (seed % 50000);
  const pricePerShare = 0.5 + (seed % 100) / 10;
  const investment = shares * pricePerShare;

  return {
    shares,
    pricePerShare,
    investment,
  };
}

// Simple string hash function for consistent mock data
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
