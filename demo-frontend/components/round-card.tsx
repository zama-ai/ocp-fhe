import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  PiggyBankIcon,
  Loader2Icon,
} from 'lucide-react';
import { useDecryptSecurity } from '@/hooks/use-decrypt-security';
import { useDecryptRound } from '@/hooks/use-decrypt-round';
import { useRoundVisibility } from '@/hooks/use-round-visibility';
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

  const {
    decryptRoundData,
    isRoundDecrypted,
    isRoundLoading,
    getRoundDecryptedData,
    clearRoundDecrypted,
  } = useDecryptRound(companyAddress);

  const { updateVisibility, isUpdating } = useRoundVisibility();

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

  // Helper function to determine if user can decrypt round data
  const canDecryptRound = (): boolean => {
    if (!walletAddress) return false;
    if (role === 'ADMIN') return true; // Admins can decrypt all data
    if (role === 'FOUNDER') return isCompanyOwner; // Only company owners can decrypt round data
    if (role === 'INVESTOR') {
      return (
        safeInvestments.some(
          investment =>
            investment.investor.address.toLowerCase() ===
            walletAddress.toLowerCase()
        ) || false
      );
    }
    return false; // Investors and public cannot decrypt round totals
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

  // Debug logging to understand data structure
  console.log('Round data:', round);
  console.log('Round investments:', round.investments);
  console.log('Round type:', typeof round.investments);
  console.log('Is array:', Array.isArray(round.investments));

  // Ensure we have a valid investments array
  const safeInvestments = Array.isArray(round.investments)
    ? round.investments
    : [];

  const handleDecryptAllPermitted = () => {
    if (!round) return;

    const securityIds = safeInvestments
      .filter(
        investment =>
          investment.investor.securityId &&
          canDecryptInvestor(investment.investor.address)
      )
      .map(investment => investment.investor.securityId!);
    const investorAddresses = safeInvestments
      .filter(
        investment =>
          investment.investor.securityId &&
          canDecryptInvestor(investment.investor.address)
      )
      .map(investment => investment.investor.address);

    if (securityIds.length > 0) {
      decryptAllPermitted(securityIds, investorAddresses);
    }
  };

  const handleHideAll = () => {
    clearDecrypted();
    clearRoundDecrypted();
  };

  const handleToggleVisibility = async () => {
    if (!round) return;

    try {
      await updateVisibility({
        companyId: companyAddress,
        roundId: round.id,
        isPubliclyVisible: !round.isPubliclyVisible,
      });
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
    }
  };

  // Check if user can toggle visibility (only founders who own the company)
  const canToggleVisibility = role === 'FOUNDER' && isCompanyOwner;

  // Calculate public values for display when round is publicly visible
  const getPublicRoundValues = () => {
    if (!round.isPubliclyVisible) return null;

    // Calculate total amount invested from investments
    const totalAmount = safeInvestments.reduce((sum, investment) => {
      return sum + investment.shareAmount * investment.sharePrice;
    }, 0);

    // Post-money valuation = pre-money + total investment
    const postMoneyValuation = round.preMoneyValuation + totalAmount;

    return {
      totalAmount,
      postMoneyValuation,
    };
  };

  const publicValues = getPublicRoundValues();

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

        {/* Round Metrics */}
        <div className="px-4 py-3 bg-zinc-50/50 border-b border-zinc-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-zinc-700">Round Metrics</h3>
            {canToggleVisibility && (
              <button
                onClick={handleToggleVisibility}
                disabled={isUpdating}
                className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                title={
                  round.isPubliclyVisible
                    ? 'Make round metrics private'
                    : 'Make round metrics publicly visible'
                }
              >
                {isUpdating ? (
                  <Loader2Icon className="h-3 w-3 animate-spin" />
                ) : round.isPubliclyVisible ? (
                  <EyeOffIcon className="h-3 w-3" />
                ) : (
                  <EyeIcon className="h-3 w-3" />
                )}
                {isUpdating
                  ? 'Updating...'
                  : round.isPubliclyVisible
                    ? 'Make Private'
                    : 'Make Public'}
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-zinc-200">
              <span className="text-sm font-medium text-zinc-600">
                Post-Money Valuation{' '}
                {!round.isPubliclyVisible && <Badge>🔒</Badge>}
              </span>
              <EncryptedCell
                label="Post-Money Valuation"
                value={
                  publicValues
                    ? fmtMoney(publicValues.postMoneyValuation)
                    : getRoundDecryptedData(round.round_id)
                      ? fmtMoney(
                          getRoundDecryptedData(round.round_id)!
                            .postMoneyValuation
                        )
                      : '$0'
                }
                decrypted={isRoundDecrypted(round.round_id)}
                loading={isRoundLoading(round.round_id)}
                onDecrypt={() => decryptRoundData(round.round_id)}
                onHide={() => clearRoundDecrypted(round.round_id)}
                canDecrypt={canDecryptRound()}
                isPubliclyVisible={round.isPubliclyVisible}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-zinc-200">
              <span className="text-sm font-medium text-zinc-600">
                Total Amount Invested{' '}
                {!round.isPubliclyVisible && <Badge>🔒</Badge>}
              </span>
              <EncryptedCell
                label="Total Amount Invested"
                value={
                  publicValues
                    ? fmtMoney(publicValues.totalAmount)
                    : getRoundDecryptedData(round.round_id)
                      ? fmtMoney(
                          getRoundDecryptedData(round.round_id)!.totalAmount
                        )
                      : '$0'
                }
                decrypted={isRoundDecrypted(round.round_id)}
                loading={isRoundLoading(round.round_id)}
                onDecrypt={() => decryptRoundData(round.round_id)}
                onHide={() => clearRoundDecrypted(round.round_id)}
                canDecrypt={canDecryptRound()}
                isPubliclyVisible={round.isPubliclyVisible}
              />
            </div>
          </div>
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
              {safeInvestments
                .map((investment, index) => {
                  // Skip investments without securityId
                  if (!investment.investor.securityId) {
                    return null;
                  }

                  const securityId = investment.investor.securityId;
                  const decryptedData = getDecryptedData(securityId);
                  const isSecurityDecrypted = isDecrypted(securityId);
                  const isSecurityLoading = isDecryptionLoading(securityId);
                  const hasAccess = canDecryptInvestor(
                    investment.investor.address
                  );

                  return (
                    <tr
                      key={
                        investment.investor.securityId || `investment-${index}`
                      }
                      className="border-b border-zinc-100 hover:bg-zinc-50/50"
                    >
                      <Td>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {investment.investor.name || 'Unknown Investor'}
                          </span>
                          <span className="text-xs text-zinc-500 font-mono">
                            {shortAddr(investment.investor.address)}
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
          post-money valuation, total amount invested, shares, price/share,
          investment amounts.
        </div>
      </section>
    </>
  );
}
