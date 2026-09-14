import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useAdminQuery } from './useAdminQuery'
afterEach(cleanup)
it('ignores a slower old filter request after a newer filter finishes', async () => {
  let resolveFirst!: (value: string[]) => void
  const first = vi.fn(
    () =>
      new Promise<string[]>((resolve) => {
        resolveFirst = resolve
      }),
  )
  const second = vi.fn(async () => ['current'])
  const { result, rerender } = renderHook(({ query }) => useAdminQuery(query), {
    initialProps: { query: first as () => Promise<string[]> },
  })
  await waitFor(() => expect(first).toHaveBeenCalled())
  rerender({ query: second })
  await waitFor(() => expect(result.current.data).toEqual(['current']))
  await act(async () => resolveFirst(['stale']))
  expect(result.current.data).toEqual(['current'])
})
