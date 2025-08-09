'use client';

import * as React from 'react';
import { Building2, Wallet as WalletIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAppKit } from '@reown/appkit/react';
import { Button } from './ui/button';
import { useAccount } from 'wagmi';
import { useRole } from '@/hooks/use-role';
import type { Role } from '@/stores/role-store';

type TopBarProps = {
  title?: string;
  className?: string;
};

export function TopBar({
  title = 'Rounds & Allocations',
  className,
}: TopBarProps) {
  const { open: openAppKitModal } = useAppKit();
  const { address: walletAddress, isConnected } = useAccount();
  const { role, setRole } = useRole();

  const handleRoleChange = (next: Role) => {
    setRole(next);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleWalletClick = () => {
    if (isConnected) {
      openAppKitModal({ view: 'Account', namespace: 'eip155' });
    } else {
      openAppKitModal({ view: 'Connect', namespace: 'eip155' });
    }
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 bg-background/80 backdrop-blur border-b',
        className
      )}
    >
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
        {/* Left: icon + title */}
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5" aria-hidden />
          <span className="font-semibold">{title}</span>
        </div>

        {/* Right: Wallet connection button + Role selector */}
        <div className="ml-auto flex items-center gap-2">
          <Button
            onClick={handleWalletClick}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <WalletIcon className="h-4 w-4" aria-hidden />
            {isConnected && walletAddress
              ? formatAddress(walletAddress)
              : 'Connect Wallet'}
          </Button>

          <Select value={role} onValueChange={v => handleRoleChange(v as Role)}>
            <SelectTrigger
              size="sm"
              aria-label="Select role"
              className="uppercase"
            >
              <SelectValue placeholder="ROLE" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FOUNDER">FOUNDER</SelectItem>
              <SelectItem value="INVESTOR">INVESTOR</SelectItem>
              <SelectItem value="PUBLIC">PUBLIC</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
