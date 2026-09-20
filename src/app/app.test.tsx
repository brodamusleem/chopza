import {
  act,
  cleanup,
  configure,
  render,
  screen,
} from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import App from '@/App'
import { router } from './router'

// Lazy page imports can exceed Testing Library's 1-second default on Windows.
configure({ asyncUtilTimeout: 5000 })
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})
it('boots without credentials and exposes role entry points', async () => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
  render(<App />)
  await screen.findByRole('heading', { name: /Your favourites/ })
  expect(screen.getByRole('link', { name: 'Register as a vendor' }).getAttribute('href')).toBe('/register/vendor')
  expect(screen.getByRole('link', { name: 'Register as a rider' }).getAttribute('href')).toBe('/register/rider')
  expect(screen.queryByText(/Cart/)).toBeNull()
  await act(async () => {
    await router.navigate('/vendor/dashboard')
  })
  await screen.findByRole('heading', { name: 'Welcome back' })
  expect(router.state.location.pathname).toBe('/login')
  vi.unstubAllGlobals()
}, 20000)
