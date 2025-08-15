'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LockIcon, UnlockIcon, Plus, AlertCircle } from 'lucide-react';
import { useRole } from '@/hooks/use-role';
import { useCompany } from '@/hooks/use-company';
import { useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { Round } from '@/lib/types/company';

const DynamicCreateRoundModal = dynamic(
  () =>
    import('@/components/create-round-modal').then(mod => mod.CreateRoundModal),
  {
    ssr: false,
  }
);

const DynamicRoundCard = dynamic(
  () => import('@/components/round-card').then(mod => mod.RoundCard),
  {
    ssr: false,
  }
);

export default function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [companyId, setCompanyId] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { role } = useRole();
  const queryClient = useQueryClient();

  // Get company data from API
  const { data: company, isLoading, error } = useCompany(companyId);

  useEffect(() => {
    const loadCompanyId = async () => {
      const resolvedParams = await params;
      setCompanyId(resolvedParams.slug); // slug is actually the company ID (Ethereum address)
    };

    loadCompanyId();
  }, [params]);

  const handleCreateRound = () => {
    // Refresh company data after successful round creation
    // The modal will handle the API call and close itself
    // We just need to trigger a refetch of the company data
    queryClient.invalidateQueries({ queryKey: ['company', companyId] });
  };

  // Sort rounds by date (most recent first)
  const sortedRounds =
    company?.rounds?.toSorted(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    ) || [];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-zinc-900">
            {company?.name || companyId} Company
          </h1>
          <p className="text-zinc-600 mb-4">
            Rounds & Allocations for {company?.name || companyId}
          </p>

          {/* Create Round Button - Only visible for FOUNDER */}
          {role === 'FOUNDER' && !isLoading && !error && company && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create New Round
            </Button>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          // Show skeleton loading cards
          <div className="space-y-6">
            <DynamicRoundCard isLoading companyAddress={companyId} />
            <DynamicRoundCard isLoading companyAddress={companyId} />
          </div>
        ) : error ? (
          // Error state
          <div className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                  Company Not Found
                </h3>
                <p className="text-zinc-600">
                  {error.message.includes('Company not found')
                    ? `No company found with ID "${companyId}"`
                    : 'Failed to load company data. Please try again.'}
                </p>
              </div>
            </div>
          </div>
        ) : sortedRounds.length > 0 ? (
          // Show actual round data
          <div className="space-y-8">
            {sortedRounds.map((round: Round) => (
              <DynamicRoundCard
                key={round.id}
                round={round}
                companyAddress={company?.contractAddress || companyId}
              />
            ))}
          </div>
        ) : (
          // Empty state
          <div className="text-center py-12">
            <p className="text-zinc-600">No rounds found for this company.</p>
            {role === 'FOUNDER' && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 flex items-center gap-2 mx-auto"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
                Create First Round
              </Button>
            )}
          </div>
        )}

        {/* Legend */}
        {!isLoading && !error && sortedRounds.length > 0 && (
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

      {/* Create Round Modal */}
      {company && (
        <DynamicCreateRoundModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          onCreateRound={handleCreateRound}
          companyId={companyId}
          contractAddress={company.contractAddress}
        />
      )}
    </div>
  );
}
