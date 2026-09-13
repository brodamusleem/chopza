import { RouterProvider } from 'react-router'
import { router } from '@/app/router'
import { AppProviders } from '@/app/providers'
export default function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  )
}
