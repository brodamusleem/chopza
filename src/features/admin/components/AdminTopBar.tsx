import { ChevronRight, LogOut, User } from 'lucide-react'
import { useLocation } from 'react-router'
import { logout, useAuth } from '@/features/auth'
import { useAdminProfile } from '../hooks/useAdminProfile'
import { ModeToggle } from '@/shared/components/ModeToggle'
import { SidebarTrigger } from '@/shared/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { toast } from 'sonner'

function initials(name: string | undefined) {
  return (name || 'Admin').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

export function AdminTopBar() {
  const { user } = useAuth()
  const profile = useAdminProfile()
  const location = useLocation()
  const title = location.pathname.includes('dispatch') ? 'Live Dispatch Map' : location.pathname.includes('reports') ? 'Reports' : location.pathname.includes('settings') ? 'Settings' : location.pathname.includes('teams') ? 'Teams' : location.pathname === '/admin/vendors' ? 'All Vendors' : location.pathname === '/admin/orders' ? 'All Orders' : location.hash === '#orders' ? 'Orders' : location.hash === '#vendors' ? 'All Vendors' : location.hash === '#approvals' ? 'Vendor Approvals' : 'Dashboard'
  const signOut = () => void logout().catch((error: unknown) => toast.error(error instanceof Error ? error.message : 'Unable to sign out.'))

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
        <h1 className="font-semibold">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <ModeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="size-9 rounded-full p-0" aria-label="Open account menu">
              <Avatar><AvatarImage src={profile?.avatar_url ?? undefined} alt="" /><AvatarFallback>{initials(profile?.full_name)}</AvatarFallback></Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem disabled>{profile?.full_name || user?.email || 'Admin'}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => toast.info('Profile settings are coming soon.')}><User className="size-4" /> Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={signOut} variant="destructive"><LogOut className="size-4" /> Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
