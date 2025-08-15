import React, { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { LockIcon, UnlockIcon, EyeIcon, PiggyBankIcon } from 'lucide-react';
import { toast } from 'sonner';

export interface RoundInvestor {
  id: string;
  name: string;
  address: string;
  shares: number | null; // null when encrypted
  pricePerShare: number | null;
  investment: number | null;
  hasAccess: boolean;
}

export interface Round {
  id: string;
  name: string;
  date: string;
  investors: RoundInvestor[];
}

interface RoundCardProps {
  round?: Round;
  isLoading?: boolean;
}

// Helper functions
const shortAddr = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`;
const fmtNum = (n: number) => n.toLocaleString();
const fmtMoney = (n: number) =>
  `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

// Encrypted Cell Component (inspired by mocked-cap design)
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

// Table components
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

export function RoundCard({ round, isLoading = false }: RoundCardProps) {
  const [decrypted, setDecrypted] = useState<Record<string, boolean>>({});

  if (isLoading) {
    return (
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm">
        <div className="p-4 border-b border-zinc-200">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-6 w-16" />
            <span className="text-zinc-400">•</span>
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <PiggyBankIcon className="h-5 w-5 text-zinc-400" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-y border-zinc-200">
                <tr className="text-left">
                  <Th>Investor</Th>
                  <Th>
                    Shares <Badge>🔒</Badge>
                  </Th>
                  <Th>
                    Price / Share <Badge>🔒</Badge>
                  </Th>
                  <Th>
                    Investment <Badge>🔒</Badge>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map(i => (
                  <tr
                    key={i}
                    className="border-b border-zinc-100 hover:bg-zinc-50/50"
                  >
                    <Td>
                      <div className="flex flex-col">
                        <Skeleton className="h-4 w-20 mb-1" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2 text-zinc-600">
                        <LockIcon className="h-4 w-4" />
                        <span className="tracking-widest select-none">
                          ••••
                        </span>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2 text-zinc-600">
                        <LockIcon className="h-4 w-4" />
                        <span className="tracking-widest select-none">
                          ••••
                        </span>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2 text-zinc-600">
                        <LockIcon className="h-4 w-4" />
                        <span className="tracking-widest select-none">
                          ••••
                        </span>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (!round) {
    return null;
  }

  const handleDecrypt = (address: string, field: string) => {
    const key = `${round.id}:${address}:${field}`;
    setDecrypted(prev => ({ ...prev, [key]: true }));
    toast('Decrypted locally. Visible only in this session.');
  };

  const handleHide = (address: string, field: string) => {
    const key = `${round.id}:${address}:${field}`;
    setDecrypted(prev => ({ ...prev, [key]: false }));
  };

  const decryptAllPermitted = () => {
    const next = { ...decrypted };
    round.investors.forEach(investor => {
      if (investor.hasAccess) {
        ['shares', 'pps', 'investment'].forEach(field => {
          next[`${round.id}:${investor.address}:${field}`] = true;
        });
      }
    });
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

  console.log(`Round: ${round.id}`, round);

  return (
    <>
      {/* Round Card */}
      <section className="bg-white border border-zinc-200 rounded-2xl shadow-sm">
        <div className="p-4 border-b border-zinc-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800">
              {round.name}
            </span>
            <span className="text-zinc-400">•</span>
            <span className="text-sm text-zinc-600">
              {new Date(round.date).toLocaleDateString()}
            </span>
          </div>
          <h2 className="font-semibold flex items-center gap-2 text-zinc-900">
            <PiggyBankIcon className="h-5 w-5" /> Round Allocations
          </h2>
        </div>

        {/* Actions */}
        <div className="px-4 py-3 flex items-center gap-2">
          <button
            onClick={decryptAllPermitted}
            className="text-sm px-3 py-1.5 rounded-xl border border-zinc-300 hover:bg-zinc-50 transition"
            title="Decrypt all cells you are allowed to see"
          >
            Decrypt all permitted
          </button>
          <button
            onClick={hideAll}
            className="text-sm px-3 py-1.5 rounded-xl border border-zinc-300 hover:bg-zinc-50 transition"
            title="Hide all decrypted values for this round"
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
                <Th>Investor</Th>
                <Th>
                  Shares <Badge>🔒</Badge>
                </Th>
                <Th>
                  Price / Share <Badge>🔒</Badge>
                </Th>
                <Th>
                  Investment <Badge>🔒</Badge>
                </Th>
              </tr>
            </thead>
            <tbody>
              {round.investors.map(investor => {
                const dShares =
                  !!decrypted[`${round.id}:${investor.address}:shares`];
                const dPps = !!decrypted[`${round.id}:${investor.address}:pps`];
                const dInvestment =
                  !!decrypted[`${round.id}:${investor.address}:investment`];

                return (
                  <tr
                    key={investor.id}
                    className="border-b border-zinc-100 hover:bg-zinc-50/50"
                  >
                    <Td>
                      <div className="flex flex-col">
                        <span className="font-medium">{investor.name}</span>
                        <span className="text-xs text-zinc-500 font-mono">
                          {shortAddr(investor.address)}
                        </span>
                      </div>
                    </Td>
                    <Td>
                      <EncryptedCell
                        label="Shares"
                        value={investor.shares ? fmtNum(investor.shares) : '0'}
                        decrypted={dShares}
                        onDecrypt={() =>
                          handleDecrypt(investor.address, 'shares')
                        }
                        onHide={() => handleHide(investor.address, 'shares')}
                        can={investor.hasAccess}
                      />
                    </Td>
                    <Td>
                      <EncryptedCell
                        label="Price / Share"
                        value={
                          investor.pricePerShare
                            ? fmtMoney(investor.pricePerShare)
                            : '$0'
                        }
                        decrypted={dPps}
                        onDecrypt={() => handleDecrypt(investor.address, 'pps')}
                        onHide={() => handleHide(investor.address, 'pps')}
                        can={investor.hasAccess}
                      />
                    </Td>
                    <Td>
                      <EncryptedCell
                        label="Investment"
                        value={
                          investor.investment
                            ? fmtMoney(investor.investment)
                            : '$0'
                        }
                        decrypted={dInvestment}
                        onDecrypt={() =>
                          handleDecrypt(investor.address, 'investment')
                        }
                        onHide={() =>
                          handleHide(investor.address, 'investment')
                        }
                        can={investor.hasAccess}
                      />
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 text-xs text-zinc-600 border-t border-zinc-200">
          Public info: round label & date, number of participants. Confidential:
          shares, price/share, investment amounts.
        </div>
      </section>
    </>
  );
}
