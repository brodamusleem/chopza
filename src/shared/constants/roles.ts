export const ROLES = {
  CUSTOMER: 'customer',
  VENDOR: 'vendor',
  RIDER: 'rider',
  ADMIN: 'admin',
} as const
export type Role = (typeof ROLES)[keyof typeof ROLES]
export function isRole(value: unknown): value is Role {
  return Object.values(ROLES).some((role) => role === value)
}
