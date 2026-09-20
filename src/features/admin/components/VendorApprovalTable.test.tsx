import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { VendorApprovalTable } from './VendorApprovalTable'
afterEach(cleanup)
const vendor = {
  id: 'test-vendor',
  name: 'Test Kitchen',
  status: 'pending' as const,
  createdAt: '2026-09-13T12:00:00Z',
}
it('links each pending vendor to its detail page', () => {
  render(
    <MemoryRouter><VendorApprovalTable data={[vendor]} isLoading={false} error={null} refetch={vi.fn()} /></MemoryRouter>,
  )
  expect(screen.getByRole('link', { name: 'View application' }).getAttribute('href')).toBe('/admin/vendors/test-vendor')
})
it('keeps the vendor visible without inline actions', () => {
  render(
    <MemoryRouter><VendorApprovalTable data={[vendor]} isLoading={false} error={null} refetch={vi.fn()} /></MemoryRouter>,
  )
  expect(screen.getByText('Test Kitchen')).toBeDefined()
  expect(screen.queryByRole('button', { name: /Approve|Reject/ })).toBeNull()
})
it('filters pending rows immediately as the user types', () => {
  render(
    <VendorApprovalTable
      data={[vendor]}
      isLoading={false}
      error={null}
      refetch={vi.fn()}
    />,
  )
  fireEvent.change(
    screen.getByRole('textbox', { name: 'Search pending vendors' }),
    { target: { value: 'not a match' } },
  )
  expect(screen.getByText('No matching pending vendors.')).toBeDefined()
})
