import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role = 'FOUNDER' | 'INVESTOR' | 'PUBLIC';

interface RoleState {
  role: Role;
  setRole: (role: Role) => void;
}

export const useRoleStore = create<RoleState>()(
  persist(
    set => ({
      role: 'FOUNDER',
      setRole: (role: Role) => set({ role }),
    }),
    {
      name: 'app-role', // localStorage key
    }
  )
);
