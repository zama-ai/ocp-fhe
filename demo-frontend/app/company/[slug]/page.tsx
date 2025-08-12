'use client';

import { useState, useEffect } from 'react';
import { RoundCard, type Round } from '@/components/round-card';
import { CreateRoundModal } from '@/components/create-round-modal';
import { Button } from '@/components/ui/button';
import { LockIcon, UnlockIcon, Plus } from 'lucide-react';
import { useRole } from '@/hooks/use-role';

// Mock data matching the template design
const mockRounds: Round[] = [
  {
    id: '1',
    name: 'Seed',
    date: '06/01/2024',
    investors: [
      {
        id: '1',
        name: 'Investor 1',
        address: '0xINV1...BbB1',
        shares: null,
        pricePerShare: null,
        investment: null,
        hasAccess: false,
      },
      {
        id: '2',
        name: 'Investor 2',
        address: '0xINV2...CcC2',
        shares: null,
        pricePerShare: null,
        investment: null,
        hasAccess: false,
      },
      {
        id: '3',
        name: 'Investor 3',
        address: '0xINV3...DdD3',
        shares: null,
        pricePerShare: null,
        investment: null,
        hasAccess: false,
      },
    ],
  },
  {
    id: '2',
    name: 'Series A',
    date: '09/15/2024',
    investors: [
      {
        id: '4',
        name: 'Venture Capital Fund',
        address: '0xVCF1...EeE4',
        shares: 50000,
        pricePerShare: 10,
        investment: 500000,
        hasAccess: true,
      },
      {
        id: '5',
        name: 'Angel Investor',
        address: '0xANG1...FfF5',
        shares: 25000,
        pricePerShare: 10,
        investment: 250000,
        hasAccess: true,
      },
      {
        id: '6',
        name: 'Strategic Partner',
        address: '0xSTR1...GgG6',
        shares: null,
        pricePerShare: null,
        investment: null,
        hasAccess: false,
      },
    ],
  },
].toSorted((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export default function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [slug, setSlug] = useState<string>('');
  const [rounds, setRounds] = useState<Round[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { role } = useRole();

  useEffect(() => {
    const loadData = async () => {
      const resolvedParams = await params;
      setSlug(resolvedParams.slug);

      // Simulate loading delay
      setTimeout(() => {
        setRounds(mockRounds);
        setIsLoading(false);
      }, 1500);
    };

    loadData();
  }, [params]);

  const handleCreateRound = (newRound: Omit<Round, 'id'>) => {
    const roundWithId: Round = {
      ...newRound,
      id: `round-${Date.now()}`,
    };

    // Add new round to the beginning of the list (most recent first)
    setRounds(prevRounds => [roundWithId, ...prevRounds]);
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-zinc-900">
            {slug.charAt(0).toUpperCase() + slug.slice(1)} Company
          </h1>
          <p className="text-zinc-600 mb-4">Rounds & Allocations for {slug}</p>

          {/* Create Round Button - Only visible for FOUNDER */}
          {role === 'FOUNDER' && !isLoading && (
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
            <RoundCard isLoading />
            <RoundCard isLoading />
          </div>
        ) : rounds.length > 0 ? (
          // Show actual round data
          <div className="space-y-8">
            {rounds.map(round => (
              <RoundCard key={round.id} round={round} />
            ))}
          </div>
        ) : (
          // Empty state
          <div className="text-center py-12">
            <p className="text-zinc-600">No rounds found for this company.</p>
          </div>
        )}

        {/* Legend */}
        {!isLoading && rounds.length > 0 && (
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
      <CreateRoundModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreateRound={handleCreateRound}
      />
    </div>
  );
}
