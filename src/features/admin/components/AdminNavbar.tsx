import { LayoutDashboard, LogOut, Menu, ShoppingBag, Store, User } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router'
import { logout, useAuth } from '@/features/auth'
import { ModeToggle } from '@/shared/components/ModeToggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/components/ui/sheet'
import { toast } from 'sonner'

const links = [
  { label: 'Dashboard', hash: '', icon: LayoutDashboard },
  { label: 'Vendors', hash: '#vendors', icon: Store },
  { label: 'Orders', hash: '#orders', icon: ShoppingBag },
]

function initials(name: string | undefined, email: string | undefined) {
  const value = name?.trim() || email?.split('@')[0] || 'Admin'
  return value.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

export function AdminNavbar() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const activeHash = location.hash
  const goTo = (hash: string) => navigate(`/admin/dashboard${hash}`)
  const signOut = () =>
    void logout().catch((error: unknown) =>
      toast.error(error instanceof Error ? error.message : 'Unable to sign out.'),
    )

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
        <Link to="/admin/dashboard" className="flex items-center gap-2 text-xl font-bold text-primary">
          <LayoutDashboard className="size-5" aria-hidden="true" />
          chopza<span className="text-amber-500">.</span>
        </Link>
        <nav aria-label="Admin sections" className="hidden items-center gap-1 md:flex">
          {links.map(({ label, hash, icon: Icon }) => (
            <Button key={label} variant={activeHash === hash ? 'secondary' : 'ghost'} onClick={() => goTo(hash)}>
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </Button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="size-9 rounded-full p-0" aria-label="Open account menu">
                <Avatar>
                  <AvatarImage src={user?.user_metadata.avatar_url} alt="" />
                  <AvatarFallback>{initials(user?.user_metadata.full_name, user?.email)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem disabled>{user?.user_metadata.full_name || user?.email || 'Admin'}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toast.info('Profile settings are coming soon.')}>
                <User className="size-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={signOut} variant="destructive">
                <LogOut className="size-4" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden" aria-label="Open admin navigation">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Admin navigation</SheetTitle>
              </SheetHeader>
              <div className="grid gap-2 px-4">
                {links.map(({ label, hash, icon: Icon }) => (
                  <Button key={label} variant={activeHash === hash ? 'secondary' : 'ghost'} className="justify-start" onClick={() => goTo(hash)}>
                    <Icon className="size-4" aria-hidden="true" /> {label}
                  </Button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}