import redis, { KEY_PREFIXES, generateKey } from '../redis';
import {
  Company,
  CompanyCreateData,
  RoundCreateData,
  Investment,
  Round,
} from '../types/company';

export class CompanyService {
  /**
   * 1. Create a new company
   */
  async createCompany(companyData: CompanyCreateData): Promise<Company> {
    try {
      const companyId = companyData.contractAddress;
      const now = new Date().toISOString();

      const company: Company = {
        id: companyId,
        name: companyData.name,
        founder: companyData.founder,
        contractAddress: companyData.contractAddress,
        createdAt: now,
        updatedAt: now,
        rounds: [],
        investors: [],
      };

      // Store company data as individual fields
      const companyKey = generateKey(KEY_PREFIXES.COMPANY, companyId);
      await redis.hset(companyKey, {
        id: company.id,
        name: company.name,
        founder: company.founder,
        contractAddress: company.contractAddress,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
        rounds: JSON.stringify([]),
        investors: JSON.stringify([]),
      });

      // Index by founder
      const founderKey = generateKey(
        KEY_PREFIXES.COMPANY_BY_FOUNDER,
        companyData.founder
      );
      await redis.sadd(founderKey, companyId);

      return company;
    } catch (error) {
      console.error('Error creating company:', error);
      throw new Error('Failed to create company');
    }
  }

  /**
   * 2. Get all companies
   */
  async getAllCompanies(): Promise<Company[]> {
    try {
      // Get all company keys
      const companyKeys = await redis.keys(`${KEY_PREFIXES.COMPANY}:*`);

      if (companyKeys.length === 0) {
        return [];
      }

      // Fetch all companies in parallel
      const companies = await Promise.all(
        companyKeys.map(async (key: string) => {
          const companyId = key.split(':')[1];
          console.log('companyId', companyId);
          return await this.getCompanyById(companyId);
        })
      );

      // Filter out null values and sort by creation date
      return companies
        .filter(
          (company: Company | null): company is Company => company !== null
        )
        .sort(
          (a: Company, b: Company) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    } catch (error) {
      console.error('Error fetching all companies:', error);
      throw new Error('Failed to fetch companies');
    }
  }

  /**
   * 3. Get companies by founder address
   */
  async getCompaniesByFounder(founderAddress: string): Promise<Company[]> {
    try {
      const founderKey = generateKey(
        KEY_PREFIXES.COMPANY_BY_FOUNDER,
        founderAddress
      );
      const companyIds = await redis.smembers(founderKey);

      if (companyIds.length === 0) {
        return [];
      }

      const companies = await Promise.all(
        companyIds.map((id: string) => this.getCompanyById(id))
      );

      return companies.filter(
        (company: Company | null): company is Company => company !== null
      );
    } catch (error) {
      console.error('Error fetching companies by founder:', error);
      throw new Error('Failed to fetch companies by founder');
    }
  }

  /**
   * 4. Get companies by investor address
   */
  async getCompaniesByInvestor(investorAddress: string): Promise<Company[]> {
    try {
      const investorKey = generateKey(
        KEY_PREFIXES.COMPANY_BY_INVESTOR,
        investorAddress
      );
      const companyIds = await redis.smembers(investorKey);

      if (companyIds.length === 0) {
        return [];
      }

      const companies = await Promise.all(
        companyIds.map((id: string) => this.getCompanyById(id))
      );

      return companies.filter(
        (company: Company | null): company is Company => company !== null
      );
    } catch (error) {
      console.error('Error fetching companies by investor:', error);
      throw new Error('Failed to fetch companies by investor');
    }
  }

  /**
   * 5. Get company by name (slug)
   */
  async getCompanyByName(companyName: string): Promise<Company | null> {
    try {
      // Get all companies and find by name
      const companies = await this.getAllCompanies();
      const company = companies.find(
        c => c.name.toLowerCase() === companyName.toLowerCase()
      );
      return company || null;
    } catch (error) {
      console.error('Error fetching company by name:', error);
      return null;
    }
  }

  /**
   * 6. Get company by ID (helper method)
   */
  async getCompanyById(companyId: string): Promise<Company | null> {
    try {
      const companyKey = generateKey(KEY_PREFIXES.COMPANY, companyId);
      const companyData = await redis.hgetall(companyKey);

      if (!companyData || Object.keys(companyData).length === 0) {
        return null;
      }
      return {
        id: companyId,
        name: (companyData.name as string) || '',
        founder: (companyData.founder as string) || '',
        contractAddress: (companyData.contractAddress as string) || '',
        createdAt: (companyData.createdAt as string) || '',
        updatedAt: (companyData.updatedAt as string) || '',
        rounds: (() => {
          try {
            if (Array.isArray(companyData.rounds)) {
              // Convert any rounds with investors to investments structure
              return companyData.rounds.map((round: Round) => {
                if (round.investments) {
                  return round; // Already in new format
                }
                // If neither investments nor investors exist, initialize with empty array
                return {
                  ...round,
                  investments: [],
                };
              });
            }
            if (
              typeof companyData.rounds === 'string' &&
              companyData.rounds !== ''
            ) {
              const parsedRounds = JSON.parse(companyData.rounds);
              // Convert any rounds with investors to investments structure
              return parsedRounds.map((round: Round) => {
                if (round.investments) {
                  return round; // Already in new format
                }
                // If neither investments nor investors exist, initialize with empty array
                return {
                  ...round,
                  investments: [],
                };
              });
            }
            return [];
          } catch (error) {
            console.error('Error fetching company by ID:', error);
            return [];
          }
        })(),
        investors: (() => {
          try {
            if (Array.isArray(companyData.investors)) {
              return companyData.investors;
            }
            if (
              typeof companyData.investors === 'string' &&
              companyData.investors !== ''
            ) {
              return JSON.parse(companyData.investors);
            }
            return [];
          } catch {
            return [];
          }
        })(),
      };
    } catch (error) {
      console.error('Error fetching company by ID:', error);
      return null;
    }
  }

  /**
   * 7. Add a new round to a company
   */
  async addRound(
    companyId: string,
    roundData: RoundCreateData
  ): Promise<Company> {
    try {
      const company = await this.getCompanyById(companyId);
      if (!company) throw new Error('Company not found');

      const companyKey = generateKey(KEY_PREFIXES.COMPANY, companyId);

      const rounds = company.rounds || [];
      const newRound = {
        id: `${companyId}_round_${rounds.length + 1}`,
        round_id: roundData.round_id,
        type: roundData.type,
        date: roundData.date,
        investments: roundData.investments || [],
        preMoneyValuation: roundData.preMoneyValuation,
        createdAt: new Date().toISOString(),
      };

      rounds.push(newRound);

      // Update company's global investors list (avoid duplicates)
      const existingInvestors = company.investors || [];
      const newInvestors = [...existingInvestors];

      if (roundData.investments) {
        // Store round-specific investment security IDs
        const roundInvestmentsKey = generateKey(
          KEY_PREFIXES.ROUND_INVESTMENTS,
          newRound.id
        );
        const securityIds: string[] = [];

        roundData.investments.forEach(investment => {
          const exists = newInvestors.some(
            existing => existing.address === investment.investor.address
          );
          if (!exists) {
            newInvestors.push(investment.investor);

            // Index company by investor for lookup
            const investorKey = generateKey(
              KEY_PREFIXES.COMPANY_BY_INVESTOR,
              investment.investor.address
            );
            redis.sadd(investorKey, companyId).catch(console.error);
          }

          // Collect security IDs for this round
          if (investment.investor.securityId) {
            securityIds.push(investment.investor.securityId);
          }
        });

        // Store security IDs for this round
        if (securityIds.length > 0) {
          redis.sadd(roundInvestmentsKey, securityIds).catch(console.error);
        }
      }

      await redis.hset(companyKey, {
        rounds: JSON.stringify(rounds),
        investors: JSON.stringify(newInvestors),
        updatedAt: new Date().toISOString(),
      });

      return (await this.getCompanyById(companyId)) as Company;
    } catch (error) {
      console.error('Error adding round:', error);
      throw new Error('Failed to add round');
    }
  }

  /**
   * 8. Add investor to the last round (allows multiple investments from same investor)
   */
  async addInvestorToLastRound(
    companyId: string,
    investor: { address: string; name?: string },
    shareAmount: number,
    sharePrice: number
  ): Promise<Company> {
    try {
      const company = await this.getCompanyById(companyId);
      if (!company) throw new Error('Company not found');

      if (company.rounds.length === 0) {
        throw new Error('No rounds exist for this company');
      }

      company.rounds[company.rounds.length - 1].investments.push({
        investor: investor,
        shareAmount: shareAmount,
        sharePrice: sharePrice,
      });

      company.investors.push(investor);
      const companyKey = generateKey(KEY_PREFIXES.COMPANY, companyId);
      company.updatedAt = new Date().toISOString();
      await redis.hset(companyKey, {
        rounds: JSON.stringify(company.rounds),
        investors: JSON.stringify(company.investors),
        updatedAt: company.updatedAt,
      });

      // Only index company by investor if not already indexed (unique lookup)
      const investorKey = generateKey(
        KEY_PREFIXES.COMPANY_BY_INVESTOR,
        investor.address
      );
      await redis.sadd(investorKey, companyId); // Set automatically handles duplicates

      return (await this.getCompanyById(companyId)) as Company;
    } catch (error) {
      console.error('Error adding investor to last round:', error);
      throw new Error('Failed to add investor to last round');
    }
  }

  /**
   * 9. Get all security IDs for a specific round
   */
  async getRoundSecurityIds(roundId: string): Promise<string[]> {
    try {
      const roundInvestmentsKey = generateKey(
        KEY_PREFIXES.ROUND_INVESTMENTS,
        roundId
      );
      const securityIds = await redis.smembers(roundInvestmentsKey);
      return securityIds;
    } catch (error) {
      console.error('Error fetching round security IDs:', error);
      throw new Error('Failed to fetch round security IDs');
    }
  }

  /**
   * 10. Update round visibility
   */
  async updateRoundVisibility(
    companyId: string,
    roundId: string,
    isPubliclyVisible: boolean
  ): Promise<Company> {
    try {
      const company = await this.getCompanyById(companyId);
      if (!company) throw new Error('Company not found');

      // Find and update the specific round
      const roundIndex = company.rounds.findIndex(
        round => round.id === roundId
      );
      if (roundIndex === -1) {
        throw new Error('Round not found');
      }

      // Update the round's visibility
      company.rounds[roundIndex].isPubliclyVisible = isPubliclyVisible;

      // Save updated company data
      const companyKey = generateKey(KEY_PREFIXES.COMPANY, companyId);
      await redis.hset(companyKey, {
        rounds: JSON.stringify(company.rounds),
        updatedAt: new Date().toISOString(),
      });

      return (await this.getCompanyById(companyId)) as Company;
    } catch (error) {
      console.error('Error updating round visibility:', error);
      throw new Error('Failed to update round visibility');
    }
  }
}

export const companyService = new CompanyService();
