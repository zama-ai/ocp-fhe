'use client';

import * as React from 'react';
import {
  Building2,
  Home,
  Wallet as WalletIcon,
  ChevronUp,
  PiggyBank,
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
import { useAppKit } from '@reown/appkit/react';
import { useAccount } from 'wagmi';
import { useRole } from '@/hooks/use-role';
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

export function AppSidebar() {
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
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
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
                      openAppKitModal({ view: 'Connect', namespace: 'eip155' })
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
      </SidebarFooter>
    </Sidebar>
  );
}
