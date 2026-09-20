import { RouterProvider } from 'react-router'
import { router } from '@/app/router'
import { AppProviders } from '@/app/providers'
import { AppErrorBoundary } from '@/app/AppErrorBoundary'
export default function App() {
  return (
    <AppErrorBoundary>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </AppErrorBoundary>
  )
}
