import { Outlet } from 'react-router'
import { RoleGuard } from '@/features/auth'
import { ROLES } from '@/shared/constants/roles'
export function RiderLayout() {
  return (
    <RoleGuard roles={[ROLES.RIDER]}>
      <div className="space-y-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          Rider workspace
        </p>
        <Outlet />
      </div>
    </RoleGuard>
  )
}
