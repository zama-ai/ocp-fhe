export interface InvestmentAllocation {
  shares: number | null; // null when encrypted, actual value when decrypted
  pricePerShare: number | null;
  investment: number | null; // calculated: shares × pricePerShare
  hasAccess: boolean; // true for investor's own investments
}

export interface InvestmentRound {
  id: string;
  companyId: string;
  companyName: string;
  roundType: string;
  date: string;
  allocation: InvestmentAllocation;
}
