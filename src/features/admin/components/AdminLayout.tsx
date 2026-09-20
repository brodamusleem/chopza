import { Outlet } from 'react-router'
import { AdminSidebar } from './AdminSidebar'
import { AdminTopBar } from './AdminTopBar'
import { SidebarProvider } from '@/shared/components/ui/sidebar'

export function AdminLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <div className="min-w-0 flex-1">
          <AdminTopBar />
          <div className="w-full px-5 py-8"><Outlet /></div>
        </div>
      </div>
    </SidebarProvider>
  )
}
