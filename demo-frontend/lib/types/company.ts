export interface Investor {
  address: string;
  name?: string;
  securityId?: string; // The on-chain security ID for this investment
}

export interface Investment {
  shareAmount: number; // Number of shares in this investment
  sharePrice: number; // Price per share in the smallest unit (e.g., wei)
  investor: Investor; // Investor information
}

export interface Round {
  id: string;
  round_id: string; // Unique bytes16 identifier for on-chain tracking
  type: string;
  date: string;
  investments: Investment[]; // Investments in this specific round with share amounts and prices
  preMoneyValuation: number; // Pre-money valuation for this round
  createdAt: string;
  isPubliclyVisible?: boolean; // Whether round metrics should be publicly visible
}

export interface Company {
  id: string;
  name: string;
  founder: string;
  contractAddress: string;
  createdAt: string;
  updatedAt: string;
  rounds: Round[];
  investors: Investor[]; // List of unique investor addresses (no duplicates)
}

export interface CompanyCreateData {
  name: string;
  founder: string;
  contractAddress: string;
  companyId?: string; // Optional bytes16 identifier for on-chain tracking
}

export interface CompanyFormData {
  name: string;
}

export interface RoundCreateData {
  type: string;
  date: string;
  round_id: string; // Unique bytes16 identifier for on-chain tracking
  preMoneyValuation: number; // Pre-money valuation for this round
  investments?: Investment[];
}
