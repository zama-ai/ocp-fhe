import React from 'react';
import Link from 'next/link';
import { InvestmentRound } from '@/lib/types/investment';
import { EyeIcon, PiggyBankIcon, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDecryptSecurity } from '@/hooks/use-decrypt-security';
import { EncryptedCell } from '@/components/ui/encrypted-cell';
import { useAccount } from '@/hooks/wagmi-viem-proxy/use-account';
import { useRoleStore } from '@/stores/role-store';

interface InvestmentRoundCardProps {
  round: InvestmentRound;
  investorAddress: string;
  companyAddress: string;
  securityId?: string;
  className?: string;
}

// Helper functions
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

export function InvestmentRoundCard({
  round,
  investorAddress,
  companyAddress,
  securityId,
  className,
}: InvestmentRoundCardProps) {
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

  // Helper function to determine if user can decrypt their own data
  const canDecryptInvestor = (): boolean => {
    if (!walletAddress) return false;

    if (role === 'FOUNDER') {
      // Founders can decrypt if they own the company (this would need additional logic)
      return true; // For now, assume founders can decrypt
    }
    if (role === 'INVESTOR') {
      return walletAddress.toLowerCase() === investorAddress.toLowerCase();
    }
    return false; // PUBLIC role
  };

  const handleDecryptAllPermitted = () => {
    if (!securityId) return;

    if (canDecryptInvestor()) {
      decryptAllPermitted([securityId], [investorAddress]);
    }
  };

  const handleHideAll = () => {
    clearDecrypted();
  };

  // Get decrypted data if available
  const decryptedData = securityId ? getDecryptedData(securityId) : null;
  const isSecurityDecrypted = securityId ? isDecrypted(securityId) : false;
  const isSecurityLoading = securityId
    ? isDecryptionLoading(securityId)
    : false;
  const hasAccess = canDecryptInvestor();

  // Fallback values for display
  const displayValues = {
    shares: decryptedData ? decryptedData.quantity : 0,
    pricePerShare: decryptedData ? decryptedData.sharePrice : 0,
    investment: decryptedData ? decryptedData.investment : 0,
  };

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
          onClick={handleDecryptAllPermitted}
          className="text-sm px-3 py-1.5 rounded-xl border border-zinc-300 hover:bg-zinc-50 transition"
          title="Decrypt all your investment data"
        >
          Decrypt all permitted
        </button>
        <button
          onClick={handleHideAll}
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
                  value={fmtNum(displayValues.shares)}
                  decrypted={isSecurityDecrypted}
                  loading={isSecurityLoading}
                  onDecrypt={() =>
                    securityId && decryptSecurities([securityId])
                  }
                  onHide={() => securityId && clearDecrypted(securityId)}
                  canDecrypt={hasAccess}
                />
              </Td>
              <Td>
                <EncryptedCell
                  label="Price / Share"
                  value={fmtMoney(displayValues.pricePerShare)}
                  decrypted={isSecurityDecrypted}
                  loading={isSecurityLoading}
                  onDecrypt={() =>
                    securityId && decryptSecurities([securityId])
                  }
                  onHide={() => securityId && clearDecrypted(securityId)}
                  canDecrypt={hasAccess}
                />
              </Td>
              <Td>
                <EncryptedCell
                  label="Investment"
                  value={fmtMoney(displayValues.investment)}
                  decrypted={isSecurityDecrypted}
                  loading={isSecurityLoading}
                  onDecrypt={() =>
                    securityId && decryptSecurities([securityId])
                  }
                  onHide={() => securityId && clearDecrypted(securityId)}
                  canDecrypt={hasAccess}
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
