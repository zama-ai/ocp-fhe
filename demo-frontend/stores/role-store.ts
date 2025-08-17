import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PredefinedWallet } from '@/lib/types/wallet';
import { PREDEFINED_WALLETS } from '@/lib/constants/wallets';

export type Role = 'FOUNDER' | 'INVESTOR' | 'PUBLIC' | 'ADMIN';

interface RoleState {
  role: Role;
  selectedWallet: PredefinedWallet | null;
  isOwnWallet: boolean;
  setRole: (role: Role) => void;
  setWallet: (wallet: PredefinedWallet | null, isOwnWallet?: boolean) => void;
  switchToPredefinedWallet: (wallet: PredefinedWallet) => void;
  switchToOwnWallet: () => void;
}

// Default wallet - Founder (Acme Inc)
const DEFAULT_WALLET: PredefinedWallet = PREDEFINED_WALLETS[0];

export const useRoleStore = create<RoleState>()(
  persist(
    set => ({
      role: DEFAULT_WALLET.role,
      selectedWallet: DEFAULT_WALLET,
      isOwnWallet: false,
      setRole: (role: Role) => set({ role }),
      setWallet: (wallet: PredefinedWallet | null, isOwnWallet = false) =>
        set({ selectedWallet: wallet, isOwnWallet }),
      switchToPredefinedWallet: (wallet: PredefinedWallet) =>
        set({
          selectedWallet: wallet,
          role: wallet.role,
          isOwnWallet: false,
        }),
      switchToOwnWallet: () =>
        set({
          selectedWallet: null,
          isOwnWallet: true,
          role: 'FOUNDER',
          // Keep current role when switching to own wallet
        }),
    }),
    {
      name: 'app-role', // localStorage key
    }
  )
);
