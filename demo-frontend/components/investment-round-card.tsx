import React, { useState } from 'react';
import Link from 'next/link';
import { InvestmentRound } from '@/lib/types/investment';
import {
  LockIcon,
  UnlockIcon,
  EyeIcon,
  PiggyBankIcon,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDecryptedValues } from '@/lib/utils/investment-mocks';
import { toast } from 'sonner';

interface InvestmentRoundCardProps {
  round: InvestmentRound;
  investorAddress: string;
  className?: string;
}

// Helper functions (reused from RoundCard)
const fmtNum = (n: number) => n.toLocaleString();
const fmtMoney = (n: number) =>
  `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

// Encrypted Cell Component (reused from RoundCard)
function EncryptedCell({
  label,
  value,
  decrypted,
  onDecrypt,
  onHide,
  can,
}: {
  label: string;
  value: string;
  decrypted: boolean;
  onDecrypt: () => void;
  onHide: () => void;
  can: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {!decrypted ? (
        <div className="inline-flex items-center gap-2 text-zinc-600">
          <LockIcon className="h-4 w-4" aria-hidden />
          <span className="tracking-widest select-none">••••</span>
          {can ? (
            <button
              onClick={onDecrypt}
              className="text-xs px-2 py-1 rounded-full border border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 transition"
              title={`Decrypt ${label}`}
            >
              Decrypt
            </button>
          ) : (
            <span
              className="text-xs px-2 py-1 rounded-full text-zinc-400"
              title="You are not authorized to decrypt this field"
            >
              No access
            </span>
          )}
        </div>
      ) : (
        <div className="inline-flex items-center gap-2">
          <UnlockIcon className="h-4 w-4 text-emerald-600" aria-hidden />
          <span className="font-mono">{value}</span>
          <button
            onClick={onHide}
            className="text-xs px-2 py-1 rounded-full border border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 transition"
            title={`Hide ${label}`}
          >
            Hide
          </button>
        </div>
      )}
    </div>
  );
}

// Table components (reused from RoundCard)
function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-xs font-medium text-zinc-600 uppercase tracking-wide">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-middle">{children}</td>;
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] border border-zinc-300 text-zinc-600">
      {children}
    </span>
  );
}

export function InvestmentRoundCard({
  round,
  investorAddress,
  className,
}: InvestmentRoundCardProps) {
  const [decrypted, setDecrypted] = useState<Record<string, boolean>>({});

  const handleDecrypt = (field: string) => {
    const key = `${round.id}:${field}`;
    setDecrypted(prev => ({ ...prev, [key]: true }));
    toast('Decrypted locally. Visible only in this session.');
  };

  const handleHide = (field: string) => {
    const key = `${round.id}:${field}`;
    setDecrypted(prev => ({ ...prev, [key]: false }));
  };

  const decryptAllPermitted = () => {
    const next = { ...decrypted };
    if (round.allocation.hasAccess) {
      ['shares', 'pricePerShare', 'investment'].forEach(field => {
        next[`${round.id}:${field}`] = true;
      });
    }
    setDecrypted(next);
    toast('Decrypted your permitted fields.');
  };

  const hideAll = () => {
    const next = { ...decrypted };
    Object.keys(next)
      .filter(key => key.startsWith(`${round.id}:`))
      .forEach(key => (next[key] = false));
    setDecrypted(next);
  };

  // Get decrypted values for display
  const decryptedValues = getDecryptedValues(investorAddress, round.id);

  const isSharesDecrypted = decrypted[`${round.id}:shares`];
  const isPriceDecrypted = decrypted[`${round.id}:pricePerShare`];
  const isInvestmentDecrypted = decrypted[`${round.id}:investment`];

  return (
    <section
      className={cn(
        'bg-white border border-zinc-200 rounded-2xl shadow-sm',
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-zinc-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800">
              {round.roundType}
            </span>
            <span className="text-zinc-400">•</span>
            <span className="text-sm text-zinc-600">
              {new Date(round.date).toLocaleDateString()}
            </span>
          </div>
          <Link
            href={`/company/${round.companyId}`}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
          >
            View Cap Table
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
        <h2 className="font-semibold flex items-center gap-2 text-zinc-900">
          <PiggyBankIcon className="h-5 w-5" />
          Your Investment in {round.companyName}
        </h2>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 flex items-center gap-2">
        <button
          onClick={decryptAllPermitted}
          className="text-sm px-3 py-1.5 rounded-xl border border-zinc-300 hover:bg-zinc-50 transition"
          title="Decrypt all your investment data"
        >
          Decrypt all permitted
        </button>
        <button
          onClick={hideAll}
          className="text-sm px-3 py-1.5 rounded-xl border border-zinc-300 hover:bg-zinc-50 transition"
          title="Hide all decrypted values for this investment"
        >
          Hide all
        </button>
        <div className="ml-auto text-xs text-zinc-500 flex items-center gap-2">
          <EyeIcon className="h-4 w-4" /> Decrypted values are local to your
          browser (demo).
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-y border-zinc-200">
            <tr className="text-left">
              <Th>Investment Data</Th>
              <Th>
                Shares <Badge>🔒</Badge>
              </Th>
              <Th>
                Price / Share <Badge>🔒</Badge>
              </Th>
              <Th>
                Total Investment <Badge>🔒</Badge>
              </Th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-zinc-100 hover:bg-zinc-50/50">
              <Td>
                <div className="flex flex-col">
                  <span className="font-medium">Your Allocation</span>
                  <span className="text-xs text-zinc-500">
                    {round.roundType} • {round.companyName}
                  </span>
                </div>
              </Td>
              <Td>
                <EncryptedCell
                  label="Shares"
                  value={fmtNum(decryptedValues.shares)}
                  decrypted={isSharesDecrypted}
                  onDecrypt={() => handleDecrypt('shares')}
                  onHide={() => handleHide('shares')}
                  can={round.allocation.hasAccess}
                />
              </Td>
              <Td>
                <EncryptedCell
                  label="Price / Share"
                  value={fmtMoney(decryptedValues.pricePerShare)}
                  decrypted={isPriceDecrypted}
                  onDecrypt={() => handleDecrypt('pricePerShare')}
                  onHide={() => handleHide('pricePerShare')}
                  can={round.allocation.hasAccess}
                />
              </Td>
              <Td>
                <EncryptedCell
                  label="Investment"
                  value={fmtMoney(decryptedValues.investment)}
                  decrypted={isInvestmentDecrypted}
                  onDecrypt={() => handleDecrypt('investment')}
                  onHide={() => handleHide('investment')}
                  can={round.allocation.hasAccess}
                />
              </Td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 text-xs text-zinc-600 border-t border-zinc-200">
        Public info: company name, round type & date. Confidential: your shares,
        price/share, investment amount.
      </div>
    </section>
  );
}
