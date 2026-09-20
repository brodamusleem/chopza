import {
  BarChart3,
  ClipboardCheck,
  LayoutDashboard,
  MapPinned,
  Settings,
  ShoppingBag,
  Store,
  Users,
  ChevronDown,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, useLocation } from 'react-router'
import { useDashboardStats } from '../hooks/useDashboardStats'
import { useAdminProfile } from '../hooks/useAdminProfile'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/shared/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'

const groups = [
  { label: 'MAIN', items: [{ label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard }] },
  {
    label: 'VENDORS',
    items: [
      { label: 'Vendor Approvals', to: '/admin/dashboard#approvals', icon: ClipboardCheck, badge: true },
      { label: 'All Vendors', to: '/admin/vendors', icon: Store },
    ],
  },
  {
    label: 'ORDERS',
    items: [
      { label: 'All Orders', to: '/admin/orders', icon: ShoppingBag },
      { label: 'Live Dispatch Map', to: '/admin/dispatch', icon: MapPinned },
    ],
  },
  { label: 'REPORTS', items: [{ label: 'Reports', to: '/admin/reports', icon: BarChart3 }] },
  { label: 'MANAGEMENT', items: [{ label: 'Teams', to: '/admin/teams', icon: Users }] },
  { label: 'SETTINGS', items: [{ label: 'Settings', to: '/admin/settings', icon: Settings }] },
]

function initials(name: string | undefined) {
  return (name || 'Admin').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

export function AdminSidebar() {
  const [ordersOpen, setOrdersOpen] = useState(true)
  const location = useLocation()
  const profile = useAdminProfile()
  const stats = useDashboardStats()
  const pendingCount = stats.data?.pendingVendors ?? 0
  const activeTarget = `${location.pathname}${location.hash}`

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-orange-500 font-bold text-white">C</div>
          <div className="group-data-[collapsible=icon]:hidden">
            <p className="font-semibold text-white">Chopza</p>
            <p className="text-xs text-sidebar-foreground/60">Admin Panel</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="pt-5">
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.label === 'ORDERS' && <SidebarMenuItem><SidebarMenuButton className="group-data-[collapsible=icon]:hidden" onClick={() => setOrdersOpen((value) => !value)}><ChevronDown className={`size-4 transition-transform ${ordersOpen ? '' : '-rotate-90'}`} /><span>Order operations</span></SidebarMenuButton></SidebarMenuItem>}
              {(group.label !== 'ORDERS' || ordersOpen) && group.items.map(({ label, to, icon: Icon, badge }) => {
                const isActive = activeTarget === to || location.pathname === to ||
                  (label === 'Dashboard' && location.pathname === '/admin/dashboard' && !location.hash) ||
                  (label === 'All Vendors' && location.hash === '#vendors') ||
                  (label === 'All Orders' && location.hash === '#orders') ||
                  (label === 'Vendor Approvals' && (!location.hash || location.hash === '#approvals'))
                return (
                  <SidebarMenuItem key={label}>
                    <SidebarMenuButton asChild className={isActive ? 'border-l-2 border-sidebar-active-border bg-sidebar-accent text-white' : ''}>
                      <NavLink to={to} end={label === 'Dashboard'}>
                        <Icon className="size-4 shrink-0" />
                        <span className="group-data-[collapsible=icon]:hidden">{label}</span>
                        {badge && pendingCount > 0 && <SidebarMenuBadge>{pendingCount}</SidebarMenuBadge>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="size-8 shrink-0">
            <AvatarImage src={profile?.avatar_url ?? undefined} alt="" />
            <AvatarFallback>{initials(profile?.full_name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-medium text-white">{profile?.full_name || 'Admin'}</p>
            <p className="text-xs text-sidebar-foreground/60">Administrator</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
