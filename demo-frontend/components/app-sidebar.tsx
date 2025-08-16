'use client';

import * as React from 'react';
import {
  Building2,
  Home,
  Wallet as WalletIcon,
  ChevronUp,
  PiggyBank,
  Shield,
  Loader2,
  AlertCircle,
  Settings,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAppKit } from '@reown/appkit/react';
import { useAccount } from 'wagmi';
import { useRole } from '@/hooks/use-role';
import { useFhevm } from '@/hooks/use-fhevm';
import { useDecryptionStore } from '@/stores/decryption-store';
import type { Role } from '@/stores/role-store';

// Navigation items
const navigationItems = [
  {
    title: 'Home',
    url: '/',
    icon: Home,
  },
  {
    title: 'Companies',
    url: '/company',
    icon: Building2,
  },
  {
    title: 'Investments',
    url: '/investments',
    icon: PiggyBank,
  },
];

export function PrivateAppSidebar() {
  const { open: openAppKitModal } = useAppKit();
  const { address: walletAddress, isConnected, chainId } = useAccount();
  const { role, setRole } = useRole();
  const fhevmQuery = useFhevm();
  const { clearAllDecryptedData } = useDecryptionStore();

  const getFhevmStatus = () => {
    if (!walletAddress || !chainId) {
      return {
        status: 'waiting' as const,
        text: 'Waiting',
        icon: Shield,
        className: 'text-yellow-500',
      };
    }

    if (fhevmQuery.isLoading) {
      return {
        status: 'loading' as const,
        text: 'Loading',
        icon: Loader2,
        className: 'text-yellow-500 animate-spin',
      };
    }

    if (fhevmQuery.isError) {
      return {
        status: 'error' as const,
        text: 'Error',
        icon: AlertCircle,
        className: 'text-red-500',
      };
    }

    if (fhevmQuery.data) {
      return {
        status: 'active' as const,
        text: 'Active',
        icon: Shield,
        className: 'text-green-600',
      };
    }

    return {
      status: 'waiting' as const,
      text: 'Waiting',
      icon: Shield,
      className: 'text-yellow-500',
    };
  };

  const fhevmStatus = getFhevmStatus();

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

  const handleClearDecryptedData = () => {
    clearAllDecryptedData();
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1">
              <Building2 className="h-6 w-6" />
              <span className="font-semibold text-sidebar-foreground">
                OCP Demo
              </span>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="px-2 py-1">
              <label className="text-xs font-semibold text-sidebar-foreground/80 mb-3 block">
                Role
              </label>
              <Select
                value={role}
                onValueChange={v => handleRoleChange(v as Role)}
              >
                <SelectTrigger
                  aria-label="Select role"
                  className="uppercase h-10 font-medium border-2 hover:border-sidebar-accent transition-colors bg-sidebar-accent/10 hover:bg-sidebar-accent/20"
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
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarSeparator />
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton className="w-full flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      <span>Settings</span>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="start">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={e => e.preventDefault()}
                        >
                          Clear Decrypted Data
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Clear Decrypted Data
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove all locally stored
                            decrypted data from your browser. You will need to
                            decrypt the data again when viewing encrypted
                            information. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleClearDecryptedData}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Clear Data
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <TooltipProvider>
          <SidebarMenu>
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton
                    size="sm"
                    className="w-full bg-green-50/50 hover:bg-green-100/50 border border-green-200/50 hover:border-green-300/50 transition-all duration-200 mb-2"
                  >
                    <fhevmStatus.icon
                      className={`h-3 w-3 ${fhevmStatus.className}`}
                    />
                    <span className="text-xs font-medium text-green-700">
                      FHEVM {fhevmStatus.text}
                    </span>
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="text-sm">
                    FHEVM allows the app to privately interact with encrypted
                    blockchain data
                  </p>
                </TooltipContent>
              </Tooltip>
            </SidebarMenuItem>
            <SidebarMenuItem>
              {isConnected && walletAddress ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      className="w-full bg-sidebar-accent/10 hover:bg-sidebar-accent/20 border border-sidebar-border/50 hover:border-sidebar-accent/50 transition-all duration-200"
                    >
                      <WalletIcon className="h-5 w-5 text-green-600" />
                      <span className="flex-1 text-left font-medium">
                        {formatAddress(walletAddress)}
                      </span>
                      <ChevronUp className="ml-auto h-4 w-4" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="top"
                    className="w-[--radix-popper-anchor-width]"
                  >
                    <DropdownMenuItem onClick={handleWalletClick}>
                      <span>Account Details</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        openAppKitModal({
                          view: 'Connect',
                          namespace: 'eip155',
                        })
                      }
                    >
                      <span>Switch Wallet</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <SidebarMenuButton
                  onClick={handleWalletClick}
                  size="lg"
                  className="w-full bg-primary/10 hover:bg-primary/20 border-2 border-primary/30 hover:border-primary/50 text-primary hover:text-primary font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <WalletIcon className="h-6 w-6" />
                  <span>Connect Wallet</span>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </TooltipProvider>
      </SidebarFooter>
    </Sidebar>
  );
}
