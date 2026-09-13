import { Link, NavLink, Outlet } from 'react-router'
import { ShoppingBag, UtensilsCrossed } from 'lucide-react'
import { useCart } from '@/features/ordering'
import { useAuth, logout } from '@/features/auth'
import { Button } from '@/shared/components/ui/button'
import { supabase } from '@/shared/lib/supabaseClient'
import { toast } from 'sonner'
export function RootLayout() {
  const { items } = useCart()
  const { user, role } = useAuth()
  return (
    <div className="min-h-screen bg-background">
      <a href="#main" className="sr-only focus:not-sr-only">
        Skip to content
      </a>
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-5 py-5">
          <Link
            to="/"
            className="flex items-center gap-2 text-2xl font-bold tracking-tight text-primary"
          >
            <UtensilsCrossed size={25} aria-hidden="true" />
            chopza<span className="text-amber-500">.</span>
          </Link>
          <nav
            aria-label="Main navigation"
            className="flex flex-wrap items-center gap-5 text-sm font-medium"
          >
            <NavLink to="/vendors">Restaurants</NavLink>
            {role === 'vendor' && (
              <NavLink to="/vendor/dashboard">Vendor dashboard</NavLink>
            )}
            {role === 'rider' && (
              <NavLink to="/rider/dashboard">Rider dashboard</NavLink>
            )}
            <NavLink to="/cart" className="flex items-center gap-2">
              <ShoppingBag size={18} aria-hidden="true" />
              Cart ({items.reduce((count, item) => count + item.quantity, 0)})
            </NavLink>
            {user ? (
              <Button
                variant="outline"
                onClick={() =>
                  void logout().catch((error: unknown) =>
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : 'Unable to sign out.',
                    ),
                  )
                }
              >
                Sign out
              </Button>
            ) : (
              <Link
                to="/login"
                className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>
      {!supabase && (
        <div className="border-b bg-secondary px-5 py-2 text-center text-xs text-muted-foreground">
          Project preview · Sample menus · Connect Supabase to enable accounts
          and live tracking
        </div>
      )}
      <main id="main" className="mx-auto max-w-6xl px-5 py-10">
        <Outlet />
      </main>
      <footer className="mx-auto mt-12 flex max-w-6xl flex-wrap justify-between gap-3 border-t px-5 py-6 text-sm text-muted-foreground">
        <p>Chopza · Made for Kano</p>
        <p>SWE4600 · Project scaffold</p>
      </footer>
    </div>
  )
}
