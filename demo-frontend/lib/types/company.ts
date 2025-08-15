export interface Investor {
  address: string;
  name?: string;
  securityId?: string; // The on-chain security ID for this investment
}

export interface Round {
  id: string;
  type: string;
  date: string;
  investors: Investor[]; // Investors in this specific round
  createdAt: string;
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
  investors?: Investor[];
}
