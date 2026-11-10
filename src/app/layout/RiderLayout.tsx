import { useEffect, useState } from 'react'
import { Navigate, NavLink, Outlet, useLocation } from 'react-router'
import { useAuth, RoleGuard, logout } from '@/features/auth'
import { getProfile } from '@/features/auth/api/auth.api'
import { ROLES } from '@/shared/constants/roles'
import { Button } from '@/shared/components/ui/button'
import { Switch } from '@/shared/components/ui/switch'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/shared/components/ui/sidebar'
import { useRiderApplicationStatus } from '@/features/rider/hooks/useRiderApplicationStatus'
import { setRiderOnline } from '@/features/rider/api/rider.api'
import { Component as RiderOnboarding } from '@/features/rider/pages/RiderOnboardingPage'
import { toast } from 'sonner'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/components/ui/avatar'
import { ModeToggle } from '@/shared/components/ModeToggle'
const links = [
  ['Dashboard', '/rider/dashboard'],
  ['Available Jobs', '/rider/jobs'],
  ['Active Delivery', '/rider/active'],
  ['History', '/rider/history'],
  ['Profile & Settings', '/rider/settings'],
  ['Payouts', '/rider/payouts'],
  ['Ratings', '/rider/ratings'],
]
function Shell() {
  const { user } = useAuth()
  const { application, refetch } = useRiderApplicationStatus()
  const [profile, setProfile] = useState<{
    full_name: string
    avatar_url: string | null
  }>()
  useEffect(() => {
    if (user)
      void getProfile(user.id)
        .then((value) => value && setProfile(value))
        .catch(() => undefined)
  }, [user])
  const initials =
    profile?.full_name
      .split(' ')
      .map((name) => name[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? 'R'
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader>
            <p className="font-semibold text-white">
              Chopza <span className="text-sidebar-foreground/60">Rider</span>
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm">Online</span>
              <Switch
                checked={application?.is_online ?? false}
                onCheckedChange={(value) => {
                  if (!application) return
                  void setRiderOnline(application.id, value)
                    .then(refetch)
                    .catch(() => toast.error('Unable to update availability.'))
                }}
              />
            </div>
          </SidebarHeader>
          <SidebarContent>
            {links.map(([label, to]) => (
              <SidebarGroup key={label}>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip={label}>
                      <NavLink to={to}>
                        <span>{label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            ))}
          </SidebarContent>
          <SidebarFooter>
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {profile?.full_name ?? user?.email}
                </p>
                <p className="text-xs text-muted-foreground">Rider</p>
              </div>
              <ModeToggle />
            </div>
            <Button variant="ghost" onClick={() => void logout()}>
              Sign out
            </Button>
          </SidebarFooter>
        </Sidebar>
        <main className="min-w-0 flex-1">
          <header className="flex h-16 items-center border-b px-5">
            <SidebarTrigger />
            <span className="ml-3 font-semibold">Rider workspace</span>
          </header>
          <div className="mx-auto w-full px-6 py-6 sm:px-8 sm:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
function Gate() {
  const location = useLocation()
  const { application, status, isLoading, error, refetch } =
    useRiderApplicationStatus()
  if (isLoading) return <p className="px-6 py-6 sm:px-8">Loading rider account…</p>
  if (error) return <p className="px-6 py-6 sm:px-8" role="alert">{error.message}</p>
  if (!application)
    return location.pathname === '/rider/onboarding' ? (
      <div className="px-4 py-6 sm:px-6 sm:py-8"><RiderOnboarding done={refetch} /></div>
    ) : (
      <Navigate to="/rider/onboarding" replace />
    )
  if (status === 'rejected')
    return <div className="px-4 py-6 sm:px-6 sm:py-8"><RiderOnboarding application={application} done={refetch} /></div>
  if (status === 'pending')
    return <p className="px-6 py-6 sm:px-8">Your rider application is under review.</p>
  if (status === 'suspended')
    return <p className="px-6 py-6 sm:px-8">Your rider account is suspended. Contact support.</p>
  return <Shell />
}
export function RiderLayout() {
  return (
    <RoleGuard roles={[ROLES.RIDER]}>
      <Gate />
    </RoleGuard>
  )
}
