import type { Role } from '@/shared/constants/roles'

export function roleHome(role: Role) {
  switch (role) {
    case 'admin': return '/admin/dashboard'
    case 'vendor': return '/vendor/dashboard'
    case 'rider': return '/rider/dashboard'
    default: return '/'
  }
}

export function postLoginDestination(role: Role, from: unknown) {
  if (typeof from !== 'string' || !from.startsWith('/') || from.startsWith('//'))
    return roleHome(role)

  if (role === 'admin') return from.startsWith('/admin/') ? from : roleHome(role)
  if (role === 'vendor') return from.startsWith('/vendor/') ? from : roleHome(role)
  if (role === 'rider') return from.startsWith('/rider/') ? from : roleHome(role)

  if (
    from.startsWith('/admin/') || from.startsWith('/vendor/') ||
    from.startsWith('/rider/') || from === '/login' || from.startsWith('/register')
  ) return roleHome(role)
  return from
}
