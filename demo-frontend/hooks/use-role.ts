import { useRoleStore } from '@/stores/role-store';

export function useRole() {
  const role = useRoleStore(state => state.role);
  const setRole = useRoleStore(state => state.setRole);

  return {
    role,
    setRole,
  };
}
