import type { ReactNode } from 'react'
import { useSession } from '@/features/auth'
import { Toaster } from '@/shared/components/ui/sonner'
import { ThemeProvider } from '@/shared/components/theme-provider'
export function AppProviders({ children }: { children: ReactNode }) {
  useSession()
  // Zustand needs no context provider. Add query/theme providers only when needed.
  return <ThemeProvider><>{children}<Toaster position="bottom-right" /></></ThemeProvider>
}
