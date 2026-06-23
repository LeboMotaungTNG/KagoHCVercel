// All roles that have elevated/admin access across the system
export const ADMIN_ROLES = ['admin', 'owner', 'manager', 'hr'];

export function isAdminRole(role: string | undefined): boolean {
  return ADMIN_ROLES.includes(role ?? '');
}
