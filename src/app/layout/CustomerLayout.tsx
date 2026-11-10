import { Outlet } from 'react-router'
import { CustomerHeader } from '@/features/storefront/components/CustomerHeader'
import { StorefrontProvider } from '@/features/storefront/context'
import { useLoadFavorites } from '@/features/storefront/hooks'
export function CustomerLayout() {
  return (
    <StorefrontProvider>
      <FavoriteLoader />
      <CustomerHeader />
      <div className="mx-auto min-h-[60vh] max-w-7xl px-4 pb-20 sm:px-6 sm:pb-0 lg:px-8">
        <Outlet />
      </div>
      <footer className="mx-auto max-w-7xl border-t px-4 py-8 text-sm text-muted-foreground sm:px-6 lg:px-8">
        <span className="font-semibold text-foreground">Chopza</span> · Restaurant details and fees are provided by the platform.
      </footer>
    </StorefrontProvider>
  )
}

function FavoriteLoader() {
  useLoadFavorites()
  return null
}
