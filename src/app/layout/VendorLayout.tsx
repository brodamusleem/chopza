import { Outlet } from 'react-router'
import { RoleGuard } from '@/features/auth'
import { ROLES } from '@/shared/constants/roles'
export function VendorLayout() {
  return (
    <RoleGuard roles={[ROLES.VENDOR]}>
      <div className="space-y-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          Vendor workspace
        </p>
        <Outlet />
      </div>
    </RoleGuard>
  )
}
