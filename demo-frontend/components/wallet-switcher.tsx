'use client';

import * as React from 'react';
import { ChevronsUpDown, Plus, Wallet, LogOut } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { PREDEFINED_WALLETS, getWalletIcon } from '@/lib/constants/wallets';
import { useRole } from '@/hooks/use-role';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useAppKit, useAppKitEvents } from '@reown/appkit/react';

export function WalletSwitcher() {
  const { isMobile } = useSidebar();
  const {
    selectedWallet,
    isOwnWallet,
    switchToPredefinedWallet,
    switchToOwnWallet,
  } = useRole();
  const { address: connectedAddress, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { open: openAppKitModal } = useAppKit();

  const events = useAppKitEvents();

  const {} = useConnect({
    mutation: {
      onSuccess: () => {
        console.log('Wallet connected successfully');
      },
    },
  });

  // Determine the active wallet display
  const getActiveWallet = () => {
    if (isOwnWallet && isConnected && connectedAddress) {
      return {
        name: 'Your Wallet',
        company: `${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}`,
        icon: Wallet,
      };
    }

    if (selectedWallet) {
      const IconComponent = getWalletIcon(selectedWallet.icon);
      return {
        name: selectedWallet.name,
        company: selectedWallet.company,
        icon: IconComponent,
      };
    }

    // Default to first predefined wallet if nothing is selected
    const defaultWallet = PREDEFINED_WALLETS[0];
    const IconComponent = getWalletIcon(defaultWallet.icon);
    return {
      name: defaultWallet.name,
      company: defaultWallet.company,
      icon: IconComponent,
    };
  };

  const activeWallet = getActiveWallet();

  const handleWalletSelect = (wallet: (typeof PREDEFINED_WALLETS)[0]) => {
    switchToPredefinedWallet(wallet);
  };

  const handleConnectOwnWallet = () => {
    if (isConnected) {
      switchToOwnWallet();
    } else {
      openAppKitModal({ view: 'Connect', namespace: 'eip155' });
      // Note: We'll need to handle the connection success in a useEffect
    }
  };

  const handleDisconnectWallet = () => {
    // Disconnect the wallet
    console.log('Disconnecting wallet...');
    disconnect();
    // Switch back to the default predefined wallet (first one)
    switchToPredefinedWallet(PREDEFINED_WALLETS[0]);
  };

  React.useEffect(() => {
    // Listen for connection events from AppKit
    // When user connects via "Connect your wallet", automatically switch to own wallet
    if (events && events.data.event === 'CONNECT_SUCCESS') {
      switchToOwnWallet();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <activeWallet.icon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {activeWallet.name}
                </span>
                <span className="truncate text-xs">{activeWallet.company}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Wallets
            </DropdownMenuLabel>
            {PREDEFINED_WALLETS.map(wallet => {
              const IconComponent = getWalletIcon(wallet.icon);
              const isActive = selectedWallet?.id === wallet.id && !isOwnWallet;
              return (
                <DropdownMenuItem
                  key={wallet.id}
                  onClick={() => handleWalletSelect(wallet)}
                  className={`gap-2 p-2 ${isActive ? 'bg-accent text-accent-foreground' : ''}`}
                >
                  <div
                    className={`flex size-6 items-center justify-center rounded-md border ${isActive ? 'border-accent-foreground/20 bg-accent' : ''}`}
                  >
                    <IconComponent className="size-3.5 shrink-0" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{wallet.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {wallet.company}
                    </span>
                  </div>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            {/* Connect/Use Your Wallet Option */}
            <DropdownMenuItem
              className={`gap-2 p-2 ${isOwnWallet && isConnected ? 'bg-accent text-accent-foreground' : ''}`}
              onClick={handleConnectOwnWallet}
            >
              <div
                className={`flex size-6 items-center justify-center rounded-md border bg-transparent ${isOwnWallet && isConnected ? 'border-accent-foreground/20 bg-accent' : ''}`}
              >
                {isConnected ? (
                  <Wallet className="size-4" />
                ) : (
                  <Plus className="size-4" />
                )}
              </div>
              <div className="flex items-center justify-between flex-1">
                <div
                  className={`font-medium ${isOwnWallet && isConnected ? '' : 'text-muted-foreground'}`}
                >
                  {isConnected ? 'Use Your Wallet' : 'Connect Your Wallet'}
                </div>
              </div>
            </DropdownMenuItem>

            {/* Disconnect Option - only show when connected and using own wallet */}
            {isConnected && isOwnWallet && (
              <DropdownMenuItem
                className="gap-2 p-2 text-destructive focus:text-destructive"
                onClick={handleDisconnectWallet}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <LogOut className="size-4" />
                </div>
                <div className="font-medium">Disconnect Wallet</div>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
