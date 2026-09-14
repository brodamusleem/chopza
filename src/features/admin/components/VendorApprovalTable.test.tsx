import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { VendorApprovalTable } from './VendorApprovalTable'
const mocks = vi.hoisted(() => ({
  approve: vi.fn(),
  reject: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}))
vi.mock('../api/admin.api', () => ({
  approveVendor: mocks.approve,
  rejectVendor: mocks.reject,
}))
vi.mock('sonner', () => ({
  toast: { success: mocks.success, error: mocks.error },
}))
afterEach(cleanup)
const vendor = {
  id: 'test-vendor',
  name: 'Test Kitchen',
  status: 'pending' as const,
  createdAt: '2026-09-13T12:00:00Z',
}
it('disables actions during approval and requests a refresh after success', async () => {
  let complete!: () => void
  mocks.approve.mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        complete = resolve
      }),
  )
  const onMutation = vi.fn().mockResolvedValue(undefined)
  render(
    <VendorApprovalTable
      data={[vendor]}
      isLoading={false}
      error={null}
      refetch={vi.fn()}
      onMutation={onMutation}
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Approve Test Kitchen' }))
  expect(
    (
      screen.getByRole('button', {
        name: 'Reject Test Kitchen',
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true)
  await act(async () => complete())
  await waitFor(() => expect(onMutation).toHaveBeenCalledOnce())
  expect(mocks.approve).toHaveBeenCalledWith('test-vendor')
  expect(mocks.success).toHaveBeenCalledWith('Test Kitchen approved')
})
it('reports rejection failures without refreshing away the row', async () => {
  mocks.reject.mockRejectedValue(new Error('Access denied'))
  const onMutation = vi.fn()
  render(
    <VendorApprovalTable
      data={[vendor]}
      isLoading={false}
      error={null}
      refetch={vi.fn()}
      onMutation={onMutation}
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Reject Test Kitchen' }))
  await waitFor(() => expect(mocks.error).toHaveBeenCalledWith('Access denied'))
  expect(onMutation).not.toHaveBeenCalled()
  expect(screen.getByText('Test Kitchen')).toBeDefined()
})
it('filters pending rows immediately as the user types', () => {
  render(
    <VendorApprovalTable
      data={[vendor]}
      isLoading={false}
      error={null}
      refetch={vi.fn()}
      onMutation={vi.fn()}
    />,
  )
  fireEvent.change(
    screen.getByRole('textbox', { name: 'Search pending vendors' }),
    { target: { value: 'not a match' } },
  )
  expect(screen.getByText('No matching pending vendors.')).toBeDefined()
})
