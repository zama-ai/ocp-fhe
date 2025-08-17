import { useRoleStore } from '@/stores/role-store';

export function useRole() {
  const role = useRoleStore(state => state.role);
  const selectedWallet = useRoleStore(state => state.selectedWallet);
  const isOwnWallet = useRoleStore(state => state.isOwnWallet);
  const setRole = useRoleStore(state => state.setRole);
  const setWallet = useRoleStore(state => state.setWallet);
  const switchToPredefinedWallet = useRoleStore(
    state => state.switchToPredefinedWallet
  );
  const switchToOwnWallet = useRoleStore(state => state.switchToOwnWallet);

  return {
    role,
    selectedWallet,
    isOwnWallet,
    setRole,
    setWallet,
    switchToPredefinedWallet,
    switchToOwnWallet,
  };
}
