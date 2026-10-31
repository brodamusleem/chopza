import { act, cleanup, configure, render, screen } from '@testing-library/react'
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
  await screen.findByRole('heading', { name: /Have you eaten\?/ })
  expect(
    screen
      .getAllByRole('link', { name: 'Order food' })
      .map((link) => link.getAttribute('href')),
  ).toEqual(['/explore', '/explore'])
  await act(async () => {
    await router.navigate('/explore?cuisine=local')
  })
  await screen.findByRole('heading', { name: 'Welcome back' })
  expect(router.state.location.pathname).toBe('/login')
  expect(router.state.location.state).toEqual({ from: '/explore?cuisine=local' })
  await act(async () => {
    await router.navigate('/vendors')
  })
  expect(
    (await screen.findByRole('link', { name: 'Register as a vendor' })).getAttribute('href'),
  ).toBe('/register/vendor')
  await act(async () => {
    await router.navigate('/riders')
  })
  expect(
    (await screen.findByRole('link', { name: 'Register as a rider' })).getAttribute('href'),
  ).toBe('/register/rider')
  await act(async () => {
    await router.navigate('/vendor/dashboard')
  })
  await screen.findByRole('heading', { name: 'Welcome back' })
  expect(router.state.location.pathname).toBe('/login')
  vi.unstubAllGlobals()
}, 20000)
