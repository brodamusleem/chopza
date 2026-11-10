import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import { Menu, UtensilsCrossed } from 'lucide-react'
import { supabase } from '@/shared/lib/supabaseClient'
import { Button } from '@/shared/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet'
export function RootLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const pathname = useLocation().pathname
  const isAdmin = pathname.startsWith('/admin')
  const isRoleArea =
    pathname === '/vendor' ||
    pathname.startsWith('/vendor/') ||
    pathname === '/rider' ||
    pathname.startsWith('/rider/')
  const isAuthPage = pathname === '/login' || pathname.startsWith('/register')
  const isCustomerArea =
    pathname.startsWith('/explore') ||
    pathname.startsWith('/favorites') ||
    pathname.startsWith('/cart') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/orders') ||
    pathname.startsWith('/account')
  const showShellHeader = !isAdmin && !isRoleArea && !isAuthPage && !isCustomerArea
  return (
    <div className="min-h-screen bg-background">
      <a href="#main" className="sr-only focus:not-sr-only">
        Skip to content
      </a>
      {showShellHeader && (
        <header className="sticky top-0 z-50 border-b border-foreground/8 bg-background/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-5 sm:py-4">
            <Link
              to="/"
              className="flex w-fit items-center gap-2 text-xl font-black tracking-[-0.06em] text-foreground sm:text-2xl"
            >
              <UtensilsCrossed size={25} aria-hidden="true" />
              chopza<span className="text-primary">.</span>
            </Link>
            <nav
              aria-label="Main navigation"
              className="hidden items-center justify-end gap-2 text-sm font-semibold whitespace-nowrap sm:flex"
            >
              <Link
                to="/company"
                className="shrink-0 rounded-full px-2.5 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:px-3"
              >
                Company
              </Link>
              <Link
                to="/vendors"
                className="shrink-0 rounded-full px-2.5 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:px-3"
              >
                Vendors
              </Link>
              <Link
                to="/riders"
                className="shrink-0 rounded-full px-2.5 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:px-3"
              >
                Riders
              </Link>
              <Link
                to="/login"
                className="shrink-0 rounded-full px-2.5 py-2 text-foreground transition-colors hover:bg-secondary sm:px-3"
              >
                Log in
              </Link>
              <Link
                to="/explore"
                className="shrink-0 rounded-full bg-primary px-3 py-2 text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5 hover:bg-primary/90 sm:px-4"
              >
                Order food
              </Link>
            </nav>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="sm:hidden"
              aria-label="Open main navigation"
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu aria-hidden="true" />
            </Button>
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetContent side="right" className="w-[min(20rem,85vw)] gap-0 p-0 sm:hidden">
                <SheetHeader className="border-b px-5 py-5">
                  <SheetTitle className="text-left">Main navigation</SheetTitle>
                </SheetHeader>
                <nav aria-label="Main navigation" className="flex flex-col gap-1 p-4">
                  {[
                    { label: 'Company', to: '/company' },
                    { label: 'Vendors', to: '/vendors' },
                    { label: 'Riders', to: '/riders' },
                    { label: 'Log in', to: '/login' },
                    { label: 'Order food', to: '/explore' },
                  ].map(({ label, to }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setMobileNavOpen(false)}
                      className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors hover:bg-accent hover:text-accent-foreground ${to === '/explore' ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : 'text-foreground'}`}
                    >
                      {label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </header>
      )}
      {showShellHeader && !supabase && (
        <div className="border-b bg-secondary px-5 py-2 text-center text-xs text-muted-foreground">
          Project preview · Sample menus · Connect Supabase to enable accounts
          and live tracking
        </div>
      )}
      <main
        id="main"
        className={isRoleArea || isAdmin || isCustomerArea ? 'w-full p-0' : 'mx-auto max-w-6xl px-5 py-10'}
      >
        <Outlet />
      </main>
      {showShellHeader && (
        <footer className="mx-auto mt-12 flex max-w-7xl flex-wrap justify-between gap-3 border-t px-5 py-8 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">
            chopza<span className="text-primary">.</span> Made for Kano.
          </p>
          <p>Good food, right around the corner.</p>
        </footer>
      )}
    </div>
  )
}
