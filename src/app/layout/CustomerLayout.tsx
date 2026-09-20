import { Outlet, useLocation } from 'react-router'
import { LogOut } from 'lucide-react'
import { useAuth, logout } from '@/features/auth'
import { Button } from '@/shared/components/ui/button'
import { toast } from 'sonner'
export function CustomerLayout() {
  const { user } = useAuth()
  const showSignOut = Boolean(user) && useLocation().pathname !== '/'
  return <>{showSignOut && <div className="mb-5 flex justify-end"><Button variant="outline" onClick={() => void logout().catch((error: unknown) => toast.error(error instanceof Error ? error.message : 'Unable to sign out.'))}><LogOut /> Sign out</Button></div>}<Outlet /></>
}
