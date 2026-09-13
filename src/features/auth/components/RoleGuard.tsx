import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import type { Role } from '@/shared/constants/roles'
import { useAuthStore } from '../store/authStore'
export function RoleGuard({
  roles,
  children,
}: {
  roles?: Role[]
  children: ReactNode
}) {
  const { ready, session, role, error } = useAuthStore()
  const location = useLocation()
  if (!ready) return <p role="status">Loading your session…</p>
  if (error) return <p role="alert">{error}</p>
  if (!session)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (roles && (!role || !roles.includes(role)))
    return (
      <p role="alert">
        This area requires an approved {roles.join(' or ')} account.
      </p>
    )
  return children
}
