import { Link, Outlet, useLocation } from 'react-router'
import { UtensilsCrossed } from 'lucide-react'
import { supabase } from '@/shared/lib/supabaseClient'
export function RootLayout() {
  const pathname = useLocation().pathname
  const isAdmin = pathname.startsWith('/admin')
  const isRoleArea = pathname.startsWith('/vendor') || pathname.startsWith('/rider')
  const isAuthPage = pathname === '/login' || pathname.startsWith('/register')
  const showShellHeader = !isAdmin && !isRoleArea && !isAuthPage
  return (
    <div className="min-h-screen bg-background">
      <a href="#main" className="sr-only focus:not-sr-only">
        Skip to content
      </a>
      {showShellHeader && <header className="border-b bg-card">
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
            <Link to="/login" className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">Log in</Link>
          </nav>
        </div>
      </header>}
      {showShellHeader && !supabase && (
        <div className="border-b bg-secondary px-5 py-2 text-center text-xs text-muted-foreground">
          Project preview · Sample menus · Connect Supabase to enable accounts
          and live tracking
        </div>
      )}
      <main id="main" className={isRoleArea || isAdmin ? 'w-full' : 'mx-auto max-w-6xl px-5 py-10'}>
        <Outlet />
      </main>
      {showShellHeader && <footer className="mx-auto mt-12 flex max-w-6xl flex-wrap justify-between gap-3 border-t px-5 py-6 text-sm text-muted-foreground">
        <p>Chopza · Made for Kano</p>
        <p>SWE4600 · Project scaffold</p>
      </footer>}
    </div>
  )
}
