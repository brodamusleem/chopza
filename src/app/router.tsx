import { createBrowserRouter } from 'react-router'
import { loginRoute, registerRoute, RoleGuard } from '@/features/auth'
import {
  vendorsRoute,
  vendorRoute,
  vendorDashboardRoute,
} from '@/features/vendors'
import { cartRoute, checkoutRoute } from '@/features/ordering'
import { trackingRoute } from '@/features/dispatch-tracking'
import { riderDashboardRoute } from '@/features/rider'
import { adminDashboardRoute } from '@/features/admin'
import { ROLES } from '@/shared/constants/roles'
import { RootLayout } from './layout/RootLayout'
import { CustomerLayout } from './layout/CustomerLayout'
import { VendorLayout } from './layout/VendorLayout'
import { RiderLayout } from './layout/RiderLayout'
import { RouteError } from './pages/RouteError'
import { Outlet } from 'react-router'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
export const router = createBrowserRouter([
  {
    Component: RootLayout,
    ErrorBoundary: RouteError,
    children: [
      {
        Component: CustomerLayout,
        children: [
          { index: true, lazy: () => import('./pages/HomePage') },
          { path: 'vendors', lazy: vendorsRoute },
          { path: 'vendors/:id', lazy: vendorRoute },
          { path: 'cart', lazy: cartRoute },
          { path: 'checkout', lazy: checkoutRoute },
          {
            element: (
              <RoleGuard>
                <Outlet />
              </RoleGuard>
            ),
            children: [{ path: 'orders/:id/track', lazy: trackingRoute }],
          },
        ],
      },
      { path: 'login', lazy: loginRoute },
      { path: 'register', lazy: registerRoute },
      {
        path: 'admin',
        element: (
          <RoleGuard roles={[ROLES.ADMIN]}>
            <AdminLayout />
          </RoleGuard>
        ),
        children: [{ path: 'dashboard', lazy: adminDashboardRoute }],
      },
      {
        path: 'vendor',
        Component: VendorLayout,
        children: [{ path: 'dashboard', lazy: vendorDashboardRoute }],
      },
      {
        path: 'rider',
        Component: RiderLayout,
        children: [{ path: 'dashboard', lazy: riderDashboardRoute }],
      },
    ],
  },
])
