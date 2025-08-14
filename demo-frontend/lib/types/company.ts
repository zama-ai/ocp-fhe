export interface Investor {
    address: string;
    name?: string;
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
}

export interface RoundCreateData {
    type: string;
    date: string;
}