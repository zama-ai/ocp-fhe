'use client';

import React from 'react';
import { useAccount } from '@/hooks/wagmi-viem-proxy/use-account';
import { useInvestments } from '@/hooks/use-investments';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  Wallet,
  AlertCircle,
  LockIcon,
  UnlockIcon,
} from 'lucide-react';
import dynamic from 'next/dynamic';

const DynamicInvestmentRoundCard = dynamic(
  () =>
    import('@/components/investment-round-card').then(
      mod => mod.InvestmentRoundCard
    ),
  {
    ssr: false,
  }
);

export default function InvestmentsPage() {
  const { address, isConnected } = useAccount();
  const { data: investments, isLoading, error } = useInvestments(address);

  // Loading skeleton - matching company page pattern
  const LoadingSkeleton = () => (
    <div className="space-y-8">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white border border-zinc-200 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <Skeleton className="h-6 w-48 mb-2" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(j => (
              <div key={j} className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <div className="flex-1">
                  <Skeleton className="h-3 w-12 mb-2" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-zinc-900">
            My Investments
          </h1>
          <p className="text-zinc-600 mb-4">
            View and manage your confidential investment allocations across all
            companies.
          </p>
        </div>

        {/* Content */}
        {!isConnected ? (
          // Wallet connection required
          <div className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <Wallet className="h-12 w-12 text-zinc-500" />
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                  Wallet Connection Required
                </h3>
                <p className="text-zinc-600">
                  Please connect your wallet to view your investments.
                </p>
              </div>
            </div>
          </div>
        ) : isLoading ? (
          // Loading state
          <LoadingSkeleton />
        ) : error ? (
          // Error state
          <div className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                  Failed to Load Investments
                </h3>
                <p className="text-zinc-600">{error.message}</p>
              </div>
            </div>
          </div>
        ) : investments && investments.length > 0 ? (
          // Show investments
          <div className="space-y-8">
            {/* Summary Stats */}
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {investments.length}
                  </div>
                  <div className="text-sm text-gray-600">
                    {investments.length === 1 ? 'Investment' : 'Investments'}
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {new Set(investments.map(inv => inv.companyId)).size}
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Set(investments.map(inv => inv.companyId)).size === 1
                      ? 'Company'
                      : 'Companies'}
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {investments.length}
                  </div>
                  <div className="text-sm text-gray-600">
                    {investments.length === 1
                      ? 'Active Round'
                      : 'Active Rounds'}
                  </div>
                </div>
              </div>
            </div>

            {/* Investment Cards */}
            <div className="space-y-8">
              {investments.map(investment => (
                <DynamicInvestmentRoundCard
                  key={investment.id}
                  round={investment}
                  investorAddress={address!}
                  companyAddress={investment.companyId}
                  securityId={investment.securityId}
                />
              ))}
            </div>
          </div>
        ) : (
          // Empty state
          <div className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <TrendingUp className="h-12 w-12 text-zinc-500" />
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                  No Investments Found
                </h3>
                <p className="text-zinc-600">
                  You haven&apos;t invested in any companies yet, or your
                  investments haven&apos;t been recorded on-chain.
                </p>
                <div className="text-sm text-zinc-500 mt-4">
                  Connected wallet: {address}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        {!isLoading && !error && investments && investments.length > 0 && (
          <section className="text-xs text-zinc-600 flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              <LockIcon className="h-3 w-3" /> Encrypted
            </span>
            <span className="inline-flex items-center gap-1">
              <UnlockIcon className="h-3 w-3 text-emerald-600" /> Decrypted
              (local)
            </span>
          </section>
        )}
      </main>
    </div>
  );
}
