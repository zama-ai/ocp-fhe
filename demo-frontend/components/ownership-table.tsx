'use client';

import React from 'react';
import { Company } from '@/lib/types/company';
import {
  useOwnershipCalculation,
  OwnershipWithAccess,
} from '@/hooks/use-ownership-calculation';
import { OwnershipPercentageCell } from '@/components/ui/ownership-percentage-cell';
import { RoundPills } from '@/components/ui/round-pills';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatOwnershipPercentage, formatShares } from '@/lib/utils/ownership';
import { useAccount } from '@/hooks/wagmi-viem-proxy/use-account';
import { useRole } from '@/hooks/use-role';

interface OwnershipTableProps {
  company: Company | null;
  companyAddress: string;
  className?: string;
}

function shortAddr(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function OwnershipTable({
  company,
  companyAddress,
  className = '',
}: OwnershipTableProps) {
  const { address: walletAddress } = useAccount();
  const { role } = useRole();
  const { ownership, investorsWithAccess } = useOwnershipCalculation(
    company,
    companyAddress
  );

  // Check if current user is the company founder
  const isCompanyFounder =
    walletAddress && company?.founder
      ? walletAddress.toLowerCase() === company.founder.toLowerCase()
      : false;

  // Treasury data is only accessible to founders who own the company
  const canAccessTreasury =
    (role === 'FOUNDER' && isCompanyFounder) || role === 'ADMIN';

  console.log(
    'isCompanyFounder',
    isCompanyFounder,
    'canAccessTreasury',
    canAccessTreasury
  );

  if (!company) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Company Ownership</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Stakeholder</TableHead>
              <TableHead>Ownership %</TableHead>
              <TableHead>Shares</TableHead>
              <TableHead>Rounds</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Treasury Row */}
            <TableRow className="bg-zinc-50/50">
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium text-zinc-900">
                    Company Treasury
                  </span>
                  <span className="text-xs text-zinc-500"></span>
                </div>
              </TableCell>
              <TableCell>
                <OwnershipPercentageCell
                  percentage={ownership.treasury.ownershipPercentage}
                  canAccess={canAccessTreasury}
                />
              </TableCell>
              <TableCell>
                {canAccessTreasury ? (
                  <span className="font-mono text-zinc-700">
                    {formatShares(ownership.treasury.shares)}
                  </span>
                ) : (
                  <span className="tracking-widest select-none text-zinc-400">
                    ••••
                  </span>
                )}
              </TableCell>
              <TableCell>
                <span className="text-zinc-400 text-sm">—</span>
              </TableCell>
            </TableRow>

            {/* Investor Rows */}
            {investorsWithAccess.map(
              (investor: OwnershipWithAccess, index: number) => (
                <TableRow
                  key={investor.address}
                  className="hover:bg-zinc-50/50"
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-zinc-900">
                        {investor.name || 'Unknown Investor'}
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">
                        {shortAddr(investor.address)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <OwnershipPercentageCell
                      percentage={investor.ownershipPercentage}
                      canAccess={investor.canAccess}
                    />
                  </TableCell>
                  <TableCell>
                    {investor.canAccess ? (
                      <span className="font-mono text-zinc-700">
                        {formatShares(investor.totalShares)}
                      </span>
                    ) : (
                      <span className="tracking-widest select-none text-zinc-400">
                        ••••
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <RoundPills rounds={investor.rounds} />
                  </TableCell>
                </TableRow>
              )
            )}

            {/* Empty state */}
            {investorsWithAccess.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <span className="text-zinc-500">No investors found</span>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Summary */}
        {role == 'FOUNDER' && ownership.totalShares > 0 && (
          <div className="mt-4 pt-4 border-t border-zinc-200">
            <div className="flex justify-between items-center text-sm text-zinc-600">
              <span>Total Shares Outstanding:</span>
              <span className="font-mono font-medium">
                {formatShares(ownership.totalShares)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm text-zinc-600 mt-1">
              <span>Investor Shares:</span>
              <span className="font-mono">
                {formatShares(ownership.totalInvestorShares)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
