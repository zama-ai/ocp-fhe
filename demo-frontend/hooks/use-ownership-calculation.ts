'use client';

import { useMemo } from 'react';
import { Company } from '@/lib/types/company';
import { useAccount } from '@/hooks/wagmi-viem-proxy/use-account';
import { useRole } from '@/hooks/use-role';
import {
  calculateOwnership,
  canDecryptInvestor,
  OwnershipCalculation,
  OwnershipData,
} from '@/lib/utils/ownership';

export interface OwnershipWithAccess extends OwnershipData {
  canAccess: boolean;
}

export interface UseOwnershipCalculationResult {
  ownership: OwnershipCalculation;
  investorsWithAccess: OwnershipWithAccess[];
}

export function useOwnershipCalculation(
  company: Company | null,
  companyAddress: string
): UseOwnershipCalculationResult {
  const { address: walletAddress } = useAccount();
  const { role } = useRole();

  // Calculate ownership data
  const ownership = useMemo(() => {
    return calculateOwnership(company);
  }, [company]);

  // Create investors with access control (no decryption needed)
  const investorsWithAccess = useMemo((): OwnershipWithAccess[] => {
    return ownership.investors.map(investor => {
      let canAccess = canDecryptInvestor(investor.address, walletAddress, role);
      if (
        role === 'FOUNDER' &&
        company?.founder.toLowerCase() != walletAddress?.toLowerCase()
      ) {
        canAccess = false;
      }

      return {
        ...investor,
        canAccess,
      };
    });
  }, [ownership.investors, walletAddress, role]);

  return {
    ownership,
    investorsWithAccess,
  };
}
