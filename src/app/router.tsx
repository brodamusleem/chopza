import { createBrowserRouter } from 'react-router'
import { loginRoute, registerRoute, RoleGuard } from '@/features/auth'
import { vendorDashboardRoute } from '@/features/vendors'
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
import { Navigate, Outlet, useParams } from 'react-router'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { ComingSoonPage } from '@/features/admin/pages/ComingSoonPage'
import { AdminTeamsPage } from '@/features/admin/pages/AdminTeamsPage'
import { AdminVendorsPage } from '@/features/admin/pages/AdminVendorsPage'
import { AdminOrdersPage } from '@/features/admin/pages/AdminOrdersPage'
import { AdminDispatchPage } from '@/features/admin/pages/AdminDispatchPage'
import { AdminSettingsPage } from '@/features/admin/pages/AdminSettingsPage'
import { AdminVendorDetailPage } from '@/features/admin/pages/AdminVendorDetailPage'
import { AdminRiderApplicationsPage } from '@/features/admin/pages/AdminRiderApplicationsPage'
import { AdminRiderDetailPage } from '@/features/admin/pages/AdminRiderDetailPage'
import { AdminRidersPage } from '@/features/admin/pages/AdminRidersPage'
import { AdminPaymentsPage } from '@/features/admin/pages/AdminPaymentsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { VendorComingSoonPage } from '@/features/vendors/pages/VendorComingSoonPage'
import { OrdersPage, AccountPage } from '@/features/storefront/pages/CustomerPages'
import { Component as HomePage } from './pages/HomePage'
import { Component as CheckoutVerifyPage } from '@/features/storefront/pages/CheckoutVerifyPage'
function LegacyOrderTrackRedirect() {
  const { id } = useParams()
  return <Navigate to={id ? `/orders/${id}` : '/orders'} replace />
}

export const router = createBrowserRouter([
  {
    Component: RootLayout,
    ErrorBoundary: RouteError,
    children: [
      { index: true, Component: HomePage },
      {
        Component: CustomerLayout,
        children: [
          {
            path: 'explore',
            element: (
              <RoleGuard>
                <Outlet />
              </RoleGuard>
            ),
            children: [
              { index: true, lazy: () => import('@/features/storefront/pages/ExplorePage') },
              { path: 'vendors/:vendorId', lazy: () => import('@/features/storefront/pages/VendorStorePage') },
            ],
          },
          { path: 'favorites', lazy: () => import('@/features/storefront/pages/FavoritesPage') },
          { path: 'orders', element: <OrdersPage /> },
          { path: 'orders/:id', lazy: trackingRoute },
          { path: 'orders/:id/track', element: <LegacyOrderTrackRedirect /> },
          { path: 'account', element: <AccountPage /> },
          { path: 'cart', lazy: cartRoute },
          { path: 'checkout', lazy: checkoutRoute },
          { path: 'checkout/verify', element: <CheckoutVerifyPage /> },
        ],
      },
      { path: 'company', lazy: () => import('./pages/CompanyPage') },
      { path: 'vendors', lazy: () => import('./pages/VendorsMarketingPage') },
      { path: 'riders', lazy: () => import('./pages/RidersMarketingPage') },
      { path: 'login', lazy: loginRoute },
      { path: 'register', lazy: registerRoute },
      {
        path: 'register/vendor',
        lazy: () => import('@/features/vendors/pages/VendorSignupPage'),
      },
      {
        path: 'register/rider',
        lazy: () => import('@/features/rider/pages/RiderSignupPage'),
      },
      {
        path: 'admin',
        element: (
          <RoleGuard roles={[ROLES.ADMIN]}>
            <AdminLayout />
          </RoleGuard>
        ),
        children: [
          { path: 'dashboard', lazy: adminDashboardRoute },
          { path: 'vendors', element: <AdminVendorsPage /> },
          { path: 'vendors/:vendorId', element: <AdminVendorDetailPage /> },
          {
            path: 'riders/applications',
            element: <AdminRiderApplicationsPage />,
          },
          { path: 'riders/:riderId', element: <AdminRiderDetailPage /> },
          { path: 'riders', element: <AdminRidersPage /> },
          { path: 'orders', element: <AdminOrdersPage /> },
          { path: 'payments', element: <AdminPaymentsPage /> },
          { path: 'teams', element: <AdminTeamsPage /> },
          { path: 'dispatch', element: <AdminDispatchPage /> },
          { path: 'reports', element: <ComingSoonPage title="Reports" /> },
          { path: 'settings', element: <AdminSettingsPage /> },
        ],
      },
      {
        path: 'vendor',
        Component: VendorLayout,
        children: [
          {
            path: 'onboarding',
            lazy: () => import('@/features/vendors/pages/VendorOnboardingPage'),
          },
          {
            path: 'pending-review',
            lazy: () =>
              import('@/features/vendors/pages/VendorApplicationStatePage'),
          },
          {
            path: 'application-rejected',
            lazy: () =>
              import('@/features/vendors/pages/VendorApplicationStatePage'),
          },
          {
            path: 'application-status',
            lazy: () =>
              import('@/features/vendors/pages/VendorApplicationStatePage'),
          },
          { path: 'dashboard', lazy: vendorDashboardRoute },
          {
            path: 'orders',
            lazy: () => import('@/features/vendors/pages/VendorOrdersPage'),
          },
          {
            path: 'menu',
            lazy: () => import('@/features/vendors/pages/VendorMenuPage'),
          },
          {
            path: 'settings',
            lazy: () => import('@/features/vendors/pages/VendorSettingsPage'),
          },
          {
            path: 'payouts',
            element: (
              <VendorComingSoonPage title="Payouts">
                Real payment and payout processing will be added in a future
                phase of this project.
              </VendorComingSoonPage>
            ),
          },
          {
            path: 'reviews',
            element: (
              <VendorComingSoonPage title="Customer Reviews">
                Customers will be able to rate and review menu items here in a
                future phase.
              </VendorComingSoonPage>
            ),
          },
          {
            path: 'promotions',
            element: (
              <VendorComingSoonPage title="Promotions & Discounts">
                Vendors will be able to create discount codes and special offers
                here in a future phase.
              </VendorComingSoonPage>
            ),
          },
        ],
      },
      {
        path: 'rider',
        Component: RiderLayout,
        children: [
          {
            path: 'onboarding',
            lazy: () => import('@/features/rider/pages/RiderOnboardingPage'),
          },
          { path: 'dashboard', lazy: riderDashboardRoute },
          {
            path: 'jobs',
            lazy: () => import('@/features/rider/pages/RiderJobsPage'),
          },
          {
            path: 'active',
            lazy: () =>
              import('@/features/rider/pages/RiderActiveDeliveryPage'),
          },
          {
            path: 'history',
            lazy: () => import('@/features/rider/pages/RiderHistoryPage'),
          },
          {
            path: 'settings',
            lazy: () => import('@/features/rider/pages/RiderSettingsPage'),
          },
          {
            path: 'payouts',
            lazy: () => import('@/features/rider/pages/RiderComingSoonPage'),
          },
          {
            path: 'ratings',
            lazy: () => import('@/features/rider/pages/RiderComingSoonPage'),
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
