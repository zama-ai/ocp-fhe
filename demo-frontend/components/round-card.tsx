import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { LockIcon, EyeIcon, PiggyBankIcon } from 'lucide-react';
import { useDecryptSecurity } from '@/hooks/use-decrypt-security';
import { EncryptedCell } from '@/components/ui/encrypted-cell';
import { Round } from '@/lib/types/company';
import { useAccount } from '@/hooks/wagmi-viem-proxy/use-account';
import { useRoleStore } from '@/stores/role-store';

interface RoundCardProps {
  round?: Round;
  isLoading?: boolean;
  companyAddress: string;
  isCompanyOwner?: boolean;
}

// Helper functions
const shortAddr = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`;
const fmtNum = (n: number) => n.toLocaleString();
const fmtMoney = (n: number) =>
  `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

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

export function RoundCard({
  round,
  isLoading = false,
  companyAddress,
  isCompanyOwner = false,
}: RoundCardProps) {
  const { address: walletAddress } = useAccount();
  const { role } = useRoleStore();

  const {
    decryptSecurities,
    decryptAllPermitted,
    isDecrypted,
    isLoading: isDecryptionLoading,
    getDecryptedData,
    clearDecrypted,
  } = useDecryptSecurity(companyAddress);

  // Helper function to determine if user can decrypt investor's data
  const canDecryptInvestor = (investorAddress: string): boolean => {
    if (!walletAddress) return false;

    if (role === 'ADMIN') {
      // Admins can decrypt all data
      return true;
    }

    if (role === 'FOUNDER') {
      // Only company owners can decrypt data when in FOUNDER role
      return isCompanyOwner;
    }
    if (role === 'INVESTOR') {
      return walletAddress.toLowerCase() === investorAddress.toLowerCase();
    }
    return false; // PUBLIC role
  };

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

  const handleDecryptAllPermitted = () => {
    if (!round) return;

    const securityIds = round.investors
      .filter(
        investor => investor.securityId && canDecryptInvestor(investor.address)
      )
      .map(investor => investor.securityId!);
    const investorAddresses = round.investors
      .filter(
        investor => investor.securityId && canDecryptInvestor(investor.address)
      )
      .map(investor => investor.address);

    if (securityIds.length > 0) {
      decryptAllPermitted(securityIds, investorAddresses);
    }
  };

  const handleHideAll = () => {
    clearDecrypted();
  };

  return (
    <>
      {/* Round Card */}
      <section className="bg-white border border-zinc-200 rounded-2xl shadow-sm">
        <div className="p-4 border-b border-zinc-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800">
              {round.type}
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
            onClick={handleDecryptAllPermitted}
            className="text-sm px-3 py-1.5 rounded-xl border border-zinc-300 hover:bg-zinc-50 transition"
            title="Decrypt all cells you are allowed to see"
          >
            Decrypt all permitted
          </button>
          <button
            onClick={handleHideAll}
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
              {round.investors
                .map((investor, index) => {
                  // Skip investors without securityId
                  if (!investor.securityId) {
                    return null;
                  }

                  const securityId = investor.securityId;
                  const decryptedData = getDecryptedData(securityId);
                  const isSecurityDecrypted = isDecrypted(securityId);
                  const isSecurityLoading = isDecryptionLoading(securityId);
                  const hasAccess = canDecryptInvestor(investor.address);

                  return (
                    <tr
                      key={investor.securityId || `investor-${index}`}
                      className="border-b border-zinc-100 hover:bg-zinc-50/50"
                    >
                      <Td>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {investor.name || 'Unknown Investor'}
                          </span>
                          <span className="text-xs text-zinc-500 font-mono">
                            {shortAddr(investor.address)}
                          </span>
                        </div>
                      </Td>
                      <Td>
                        <EncryptedCell
                          label="Shares"
                          value={
                            decryptedData ? fmtNum(decryptedData.quantity) : '0'
                          }
                          decrypted={isSecurityDecrypted}
                          loading={isSecurityLoading}
                          onDecrypt={() => decryptSecurities([securityId])}
                          onHide={() => clearDecrypted(securityId)}
                          canDecrypt={hasAccess}
                        />
                      </Td>
                      <Td>
                        <EncryptedCell
                          label="Price / Share"
                          value={
                            decryptedData
                              ? fmtMoney(decryptedData.sharePrice)
                              : '$0'
                          }
                          decrypted={isSecurityDecrypted}
                          loading={isSecurityLoading}
                          onDecrypt={() => decryptSecurities([securityId])}
                          onHide={() => clearDecrypted(securityId)}
                          canDecrypt={hasAccess}
                        />
                      </Td>
                      <Td>
                        <EncryptedCell
                          label="Investment"
                          value={
                            decryptedData
                              ? fmtMoney(decryptedData.investment)
                              : '$0'
                          }
                          decrypted={isSecurityDecrypted}
                          loading={isSecurityLoading}
                          onDecrypt={() => decryptSecurities([securityId])}
                          onHide={() => clearDecrypted(securityId)}
                          canDecrypt={hasAccess}
                        />
                      </Td>
                    </tr>
                  );
                })
                .filter(Boolean)}
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
