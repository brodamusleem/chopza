import { Outlet } from 'react-router'
import { AdminNavbar } from './AdminNavbar'

export function AdminLayout() {
  return (
    <div className="min-h-[calc(100vh-6rem)]">
      <AdminNavbar />
      <div className="mx-auto max-w-7xl px-5 py-8">
        <Outlet />
      </div>
    </div>
  )
}