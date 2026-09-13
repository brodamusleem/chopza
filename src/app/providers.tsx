import type { ReactNode } from 'react'
import { useSession } from '@/features/auth'
import { Toaster } from '@/shared/components/ui/sonner'
export function AppProviders({ children }: { children: ReactNode }) {
  useSession()
  // Zustand needs no context provider. Add query/theme providers only when needed.
  return (
    <>
      {children}
      <Toaster position="bottom-right" />
    </>
  )
}
