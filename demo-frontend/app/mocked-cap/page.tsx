'use client';
import React, { useMemo, useState } from 'react';
import {
  Lock,
  Unlock,
  Eye,
  Wallet,
  Building2,
  ChevronDown,
  Info,
  CalendarDays,
  ListChecks,
  Users,
  PiggyBank,
} from 'lucide-react';

// —————————————————————————————————————————————
// Mocked Rounds & Allocations Demo (simple)
// - Focus: investment rounds where investors get shares at a given price
// - Public: company name, round label, round date, #participants
// - Confidential: shares, price/share, and investment amount (shares*price)
// - Role access: Admin (all), Founder (their company), Investor (own row only)
// —————————————————————————————————————————————

// —————————————————————————————————————————————
// Types
// —————————————————————————————————————————————

type Role = 'Admin' | 'Founder' | 'Investor';

// Simple per-round allocations (price can be uniform per round)

type Round = {
  id: string;
  label: string; // e.g., Seed, Series A
  date: string; // ISO date
  pricePerShare: number; // confidential in UI
  allocations: Record<string, number>; // address -> shares (confidential)
};

type Company = {
  id: 'A' | 'B';
  name: string;
  ticker: string;
  founder: string;
  investors: { address: string; label: string }[];
  rounds: Round[];
};

// —————————————————————————————————————————————
// Mock Data
// —————————————————————————————————————————————

const ADDR = {
  I1: '0xINV10bB22B0bBbBBbBbBbBbBbBbBbBbBbBbB1',
  I2: '0xINV20cC33C0cCcCCcCcCcCcCcCcCcCcCcCcC2',
  I3: '0xINV30dD44D0dDdDDdDdDdDdDdDdDdDdDdDdD3',
} as const;

const COMPANIES: Company[] = [
  {
    id: 'A',
    name: 'Acme Alpha',
    ticker: 'ACMA',
    founder: '0xFNDRA0Aa11A0aAaAAaAaAAaAaAAaAaAaAaAA1',
    investors: [
      { address: ADDR.I1, label: 'Investor 1' },
      { address: ADDR.I2, label: 'Investor 2' },
      { address: ADDR.I3, label: 'Investor 3' },
    ],
    rounds: [
      {
        id: 'A1',
        label: 'Seed',
        date: '2024-06-01',
        pricePerShare: 8.5,
        allocations: {
          [ADDR.I1]: 20000,
          [ADDR.I2]: 15000,
          [ADDR.I3]: 25000,
        },
      },
      {
        id: 'A2',
        label: 'Series A',
        date: '2025-02-10',
        pricePerShare: 9.2,
        allocations: {
          [ADDR.I1]: 13000,
          [ADDR.I2]: 9000,
          [ADDR.I3]: 11000,
        },
      },
    ],
  },
  {
    id: 'B',
    name: 'Beacon Beta',
    ticker: 'BCNB',
    founder: '0xFNDRB0Ee55E0eEeEEeEeEeEeEeEeEeEeEeEE2',
    investors: [
      { address: ADDR.I1, label: 'Investor 1' },
      { address: ADDR.I2, label: 'Investor 2' },
      { address: ADDR.I3, label: 'Investor 3' },
    ],
    rounds: [
      {
        id: 'B1',
        label: 'Seed',
        date: '2023-11-15',
        pricePerShare: 5.4,
        allocations: {
          [ADDR.I1]: 8000,
          [ADDR.I2]: 6000,
          [ADDR.I3]: 9000,
        },
      },
    ],
  },
];

const PERSONAS = [
  {
    label: 'Admin',
    role: 'Admin' as Role,
    wallet: '0xADMIN000000000000000000000000000000000',
  },
  {
    label: 'Founder (Acme Alpha)',
    role: 'Founder' as Role,
    wallet: COMPANIES[0].founder,
  },
  {
    label: 'Founder (Beacon Beta)',
    role: 'Founder' as Role,
    wallet: COMPANIES[1].founder,
  },
  { label: 'Investor 1', role: 'Investor' as Role, wallet: ADDR.I1 },
  { label: 'Investor 2', role: 'Investor' as Role, wallet: ADDR.I2 },
  { label: 'Investor 3', role: 'Investor' as Role, wallet: ADDR.I3 },
];

// —————————————————————————————————————————————
// Helpers
// —————————————————————————————————————————————

const shortAddr = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`;
const fmtNum = (n: number) => n.toLocaleString();
const fmtMoney = (n: number) =>
  `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

function canDecrypt(
  role: Role,
  wallet: string,
  company: Company,
  rowAddress: string
) {
  if (role === 'Admin') return true;
  if (role === 'Founder')
    return wallet.toLowerCase() === company.founder.toLowerCase();
  if (role === 'Investor')
    return wallet.toLowerCase() === rowAddress.toLowerCase();
  return false;
}

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
          <Lock className="h-4 w-4" aria-hidden />
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
          <Unlock className="h-4 w-4 text-emerald-600" aria-hidden />
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

// —————————————————————————————————————————————
// Main Component
// —————————————————————————————————————————————

export default function RoundsAllocationsDemo() {
  const [companyId, setCompanyId] = useState<'A' | 'B'>('A');
  const [personaIndex, setPersonaIndex] = useState<number>(0);
  const [activeRoundId, setActiveRoundId] = useState<string>(
    COMPANIES[0].rounds[0].id
  );
  const [flash, setFlash] = useState<string>('');

  // decrypted keys: `${companyId}:${roundId}:${address}:${field}` or `${companyId}:${roundId}:pps`
  const [decrypted, setDecrypted] = useState<Record<string, boolean>>({});

  const company = useMemo(
    () => COMPANIES.find(c => c.id === companyId)!,
    [companyId]
  );
  const persona = PERSONAS[personaIndex];
  const round = useMemo(
    () => company.rounds.find(r => r.id === activeRoundId) || company.rounds[0],
    [company, activeRoundId]
  );

  // Ensure active round exists after company switch
  React.useEffect(() => {
    if (!company.rounds.find(r => r.id === activeRoundId)) {
      setActiveRoundId(company.rounds[0]?.id ?? '');
    }
  }, [companyId, activeRoundId, company]);

  const roleNote = useMemo(() => {
    if (
      persona.role === 'Founder' &&
      persona.wallet.toLowerCase() !== company.founder.toLowerCase()
    ) {
      return `You are a Founder, but not for ${company.name}. You won't be able to decrypt other investors here.`;
    }
    return '';
  }, [persona, company]);

  const k = (address: string, field: string) =>
    `${company.id}:${round.id}:${address}:${field}`;
  const kPps = () => `${company.id}:${round.id}:pps`;

  const handleDecrypt = (address: string, field: string) => {
    const permitted = canDecrypt(
      persona.role,
      persona.wallet,
      company,
      address
    );
    if (!permitted) {
      setFlash('Access denied for this field.');
      setTimeout(() => setFlash(''), 1600);
      return;
    }
    setDecrypted(p => ({ ...p, [k(address, field)]: true }));
    setFlash('Decrypted locally. Visible only in this session.');
    setTimeout(() => setFlash(''), 1200);
  };

  const handleHide = (address: string, field: string) =>
    setDecrypted(p => ({ ...p, [k(address, field)]: false }));

  const decryptAllMine = () => {
    const next = { ...decrypted } as Record<string, boolean>;
    Object.keys(round.allocations).forEach(addr => {
      if (canDecrypt(persona.role, persona.wallet, company, addr)) {
        ['shares', 'pps', 'investment'].forEach(f => (next[k(addr, f)] = true));
      }
    });
    // If persona can see PPS for the round, set a shared PPS flag as well
    if (
      persona.role === 'Admin' ||
      (persona.role === 'Founder' &&
        persona.wallet.toLowerCase() === company.founder.toLowerCase())
    ) {
      next[kPps()] = true;
    }
    setDecrypted(next);
    setFlash('Decrypted your permitted fields.');
    setTimeout(() => setFlash(''), 1000);
  };

  const hideAll = () => {
    const next = { ...decrypted } as Record<string, boolean>;
    Object.keys(next)
      .filter(kk => kk.startsWith(`${company.id}:${round.id}:`))
      .forEach(kk => (next[kk] = false));
    setDecrypted(next);
  };

  const resetDemo = () => {
    setCompanyId('A');
    setPersonaIndex(0);
    setActiveRoundId(COMPANIES[0].rounds[0].id);
    setDecrypted({});
    setFlash('Demo reset.');
    setTimeout(() => setFlash(''), 900);
  };

  const participants = Object.entries(round.allocations).filter(
    ([, shares]) => shares > 0
  ).length;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* Top Bar */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <span className="font-semibold">Rounds & Allocations (Mock)</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Company selector */}
            <div className="relative">
              <select
                className="appearance-none pl-3 pr-8 py-1.5 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 text-sm"
                value={companyId}
                onChange={e => setCompanyId(e.target.value as 'A' | 'B')}
                title="Select company"
              >
                {COMPANIES.map(c => (
                  <option
                    key={c.id}
                    value={c.id}
                  >{`${c.name} (${c.ticker})`}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-zinc-500" />
            </div>

            {/* Persona selector */}
            <div className="relative">
              <select
                className="appearance-none pl-3 pr-8 py-1.5 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 text-sm"
                value={personaIndex}
                onChange={e => setPersonaIndex(parseInt(e.target.value, 10))}
                title="Switch persona"
              >
                {PERSONAS.map((p, i) => (
                  <option
                    key={p.label}
                    value={i}
                  >{`${p.label} – ${shortAddr(p.wallet)}`}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-zinc-500" />
            </div>

            {/* Wallet chip */}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-zinc-300 text-sm bg-white">
              <Wallet className="h-4 w-4" /> {shortAddr(persona.wallet)}
            </span>

            <button
              onClick={resetDemo}
              className="text-sm px-3 py-1.5 rounded-xl border border-zinc-300 hover:bg-zinc-50"
              title="Reset demo"
            >
              Reset
            </button>
          </div>
        </div>
        {roleNote && (
          <div className="max-w-6xl mx-auto px-4 pb-3 -mt-2">
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 inline-flex items-center gap-2">
              <Info className="h-4 w-4" /> {roleNote}
            </div>
          </div>
        )}
      </header>

      {/* Flash message */}
      {flash && (
        <div className="fixed left-1/2 -translate-x-1/2 top-4 z-20">
          <div className="px-3 py-2 rounded-lg shadow-sm bg-zinc-900 text-white text-sm">
            {flash}
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Public Round Meta */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatTile
            title="# Rounds"
            value={fmtNum(company.rounds.length)}
            icon={<ListChecks className="h-5 w-5" />}
          />
          <StatTile
            title="# Investors (in company)"
            value={fmtNum(company.investors.length)}
            icon={<Users className="h-5 w-5" />}
          />
          <StatTile
            title="Active Round"
            value={`${round.label} · ${new Date(round.date).toLocaleDateString()}`}
            icon={<CalendarDays className="h-5 w-5" />}
          />
        </section>

        {/* Round Switcher */}
        <section className="bg-white border border-zinc-200 rounded-2xl shadow-sm">
          <div className="p-4 border-b border-zinc-200 flex items-center gap-3">
            <h2 className="font-semibold flex items-center gap-2">
              <PiggyBank className="h-5 w-5" /> Round Allocations
            </h2>
            <div className="ml-auto flex items-center gap-2 text-sm">
              <span className="text-zinc-600">Round:</span>
              <div className="relative">
                <select
                  className="appearance-none pl-3 pr-8 py-1.5 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 text-sm"
                  value={round.id}
                  onChange={e => setActiveRoundId(e.target.value)}
                  title="Select round"
                >
                  {company.rounds.map(r => (
                    <option
                      key={r.id}
                      value={r.id}
                    >{`${r.label} (${new Date(r.date).toLocaleDateString()})`}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-zinc-500" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-4 py-3 flex items-center gap-2">
            <button
              onClick={decryptAllMine}
              className="text-sm px-3 py-1.5 rounded-xl border border-zinc-300 hover:bg-zinc-50"
              title="Decrypt all cells you are allowed to see"
            >
              Decrypt all permitted
            </button>
            <button
              onClick={hideAll}
              className="text-sm px-3 py-1.5 rounded-xl border border-zinc-300 hover:bg-zinc-50"
              title="Hide all decrypted values for this round"
            >
              Hide all
            </button>
            <div className="ml-auto text-xs text-zinc-500 flex items-center gap-2">
              <Eye className="h-4 w-4" /> Decrypted values are local to your
              browser (demo). Participants: {participants}
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
                {company.investors.map(({ address, label }) => {
                  const shares = round.allocations[address] ?? 0;
                  const isYou =
                    persona.wallet.toLowerCase() === address.toLowerCase();
                  const youText = isYou ? ' (YOU)' : '';

                  const dShares =
                    !!decrypted[`${company.id}:${round.id}:${address}:shares`];
                  const dPpsRow =
                    !!decrypted[`${company.id}:${round.id}:${address}:pps`];
                  const dInvest =
                    !!decrypted[
                      `${company.id}:${round.id}:${address}:investment`
                    ];
                  const permitted = canDecrypt(
                    persona.role,
                    persona.wallet,
                    company,
                    address
                  );

                  return (
                    <tr
                      key={address}
                      className="border-b border-zinc-100 hover:bg-zinc-50/50"
                    >
                      <Td>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {label}
                            {youText}
                          </span>
                          <span className="text-xs text-zinc-500 font-mono">
                            {shortAddr(address)}
                          </span>
                        </div>
                      </Td>
                      <Td>
                        <EncryptedCell
                          label="Shares"
                          value={fmtNum(shares)}
                          decrypted={dShares}
                          onDecrypt={() => handleDecrypt(address, 'shares')}
                          onHide={() => handleHide(address, 'shares')}
                          can={permitted}
                        />
                      </Td>
                      <Td>
                        <EncryptedCell
                          label="Price / Share"
                          value={fmtMoney(round.pricePerShare)}
                          decrypted={dPpsRow || !!decrypted[kPps()]}
                          onDecrypt={() => handleDecrypt(address, 'pps')}
                          onHide={() => handleHide(address, 'pps')}
                          can={permitted}
                        />
                      </Td>
                      <Td>
                        <EncryptedCell
                          label="Investment"
                          value={fmtMoney(shares * round.pricePerShare)}
                          decrypted={dInvest}
                          onDecrypt={() => handleDecrypt(address, 'investment')}
                          onHide={() => handleHide(address, 'investment')}
                          can={permitted}
                        />
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 text-xs text-zinc-600 border-t border-zinc-200">
            Public info: round label & date, number of participants.
            Confidential: shares, price/share, investment amounts.
          </div>
        </section>

        {/* Legend */}
        <section className="text-xs text-zinc-600 flex items-center gap-4">
          <span className="inline-flex items-center gap-1">
            <Lock className="h-3 w-3" /> Encrypted
          </span>
          <span className="inline-flex items-center gap-1">
            <Unlock className="h-3 w-3 text-emerald-600" /> Decrypted (local)
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3 w-3" /> Visible only to your role
          </span>
        </section>
      </main>
    </div>
  );
}

// —————————————————————————————————————————————
// Presentational bits
// —————————————————————————————————————————————

function StatTile({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 text-zinc-600 text-xs mb-1">
        {icon}
        <span>{title}</span>
      </div>
      <div className="text-lg sm:text-xl font-semibold">{value}</div>
    </div>
  );
}

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
