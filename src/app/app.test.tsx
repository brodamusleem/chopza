import {
  act,
  cleanup,
  configure,
  fireEvent,
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
it('boots without credentials, navigates menus, updates cart and guards dashboards', async () => {
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
  fireEvent.click(screen.getByRole('link', { name: 'Explore restaurants' }))
  await screen.findByRole('heading', { name: 'What are you craving?' })
  fireEvent.click(screen.getByRole('link', { name: /Kano Kitchen/ }))
  await screen.findByRole('heading', { name: 'Kano Kitchen', level: 1 })
  fireEvent.click(screen.getAllByRole('button', { name: 'Add to cart' })[0])
  fireEvent.click(screen.getByRole('link', { name: 'Cart (1)' }))
  await screen.findByRole('heading', { name: 'Your cart' })
  expect(
    screen.getByRole('heading', { name: 'Tuwo shinkafa & miyan kuka' }),
  ).toBeDefined()
  await act(async () => {
    await router.navigate('/vendor/dashboard')
  })
  await screen.findByRole('heading', { name: 'Welcome back' })
  expect(router.state.location.pathname).toBe('/login')
  vi.unstubAllGlobals()
}, 20000)
