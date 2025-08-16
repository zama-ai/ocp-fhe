export interface InvestmentRound {
  id: string; // Round ID (used as securityId)
  companyId: string; // Company identifier
  companyName: string; // Company name for display
  roundType: string; // Round type (Seed, Series A, etc.)
  date: string; // Investment date
  createdAt: string; // When the round was created
  investorAddress: string; // The investor's address
  investorName?: string; // Optional investor name
  securityId?: string; // The on-chain security ID for this investment
}
