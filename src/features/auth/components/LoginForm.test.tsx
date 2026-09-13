import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { LoginForm } from './LoginForm'
const { login } = vi.hoisted(() => ({ login: vi.fn() }))
vi.mock('../api/auth.api', () => ({ login }))
afterEach(cleanup)
it('validates input before calling Supabase and displays an auth failure', async () => {
  login.mockRejectedValue(new Error('Invalid login credentials'))
  render(
    <MemoryRouter>
      <LoginForm />
    </MemoryRouter>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
  await screen.findByText('Enter a valid email address.')
  expect(login).not.toHaveBeenCalled()
  fireEvent.change(screen.getByLabelText('Email address'), {
    target: { value: 'test@example.com' },
  })
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: 'password123' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
  await waitFor(() =>
    expect(login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    }),
  )
  expect((await screen.findByRole('alert')).textContent).toContain(
    'Invalid login credentials',
  )
})
