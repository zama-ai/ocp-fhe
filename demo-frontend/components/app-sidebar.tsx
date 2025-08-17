'use client';

import * as React from 'react';
import {
  Building2,
  Home,
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
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useRole } from '@/hooks/use-role';
import { useFhevm } from '@/hooks/use-fhevm';
import { useDecryptionStore } from '@/stores/decryption-store';
import { WalletSwitcher } from '@/components/wallet-switcher';
import { useAccount } from '@/hooks/wagmi-viem-proxy/use-account';
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
  const { address: walletAddress, chainId } = useAccount();
  const { role, isOwnWallet, setRole } = useRole();
  const fhevmQuery = useFhevm();
  const { clearAllDecryptedData } = useDecryptionStore();
  const [showClearDataDialog, setShowClearDataDialog] = React.useState(false);

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

  const handleClearDecryptedData = () => {
    clearAllDecryptedData();
    setShowClearDataDialog(false);
  };

  const handleOpenClearDataDialog = () => {
    setShowClearDataDialog(true);
  };

  const getRoleBadgeVariant = (role: Role) => {
    switch (role) {
      case 'FOUNDER':
        return 'default';
      case 'INVESTOR':
        return 'secondary';
      case 'PUBLIC':
        return 'outline';
      case 'ADMIN':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1">
              <Building2 className="h-6 w-6" />
              <span className="font-semibold text-sidebar-foreground">
                OCP-FHE Demo
              </span>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarSeparator />

        {/* Role Indicator */}
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="px-2 py-1">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-sidebar-foreground/80">
                  Current Role
                </label>
                <Badge variant={getRoleBadgeVariant(role)} className="text-xs">
                  {role}
                </Badge>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Wallet Switcher */}
        <WalletSwitcher />

        {/* Conditional Role Selector - only show when using own wallet */}
        {isOwnWallet && (
          <>
            <SidebarSeparator />
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="px-2 py-1">
                  <label className="text-xs font-semibold text-sidebar-foreground/80 mb-3 block">
                    Select Role
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
          </>
        )}
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
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={handleOpenClearDataDialog}
                    >
                      Clear Decrypted Data
                    </DropdownMenuItem>
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
          </SidebarMenu>
        </TooltipProvider>
      </SidebarFooter>

      {/* Separate AlertDialog for Clear Decrypted Data */}
      <AlertDialog
        open={showClearDataDialog}
        onOpenChange={setShowClearDataDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Decrypted Data</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove all locally stored decrypted data
              from your browser. You will need to decrypt the data again when
              viewing encrypted information. This action cannot be undone.
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
    </Sidebar>
  );
}
