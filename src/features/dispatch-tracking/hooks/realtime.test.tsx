import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
const mock = vi.hoisted(() => {
  const channels: {
    topic: string
    callback?: (payload: { payload?: unknown; new?: unknown }) => void
    on: ReturnType<typeof vi.fn>
    subscribe: ReturnType<typeof vi.fn>
  }[] = []
  return {
    channels,
    removeChannel: vi.fn(),
    setAuth: vi.fn(() => Promise.resolve()),
    channel: vi.fn((topic: string) => {
      const channel = {
        topic,
        callback: undefined as
          ((payload: { payload?: unknown; new?: unknown }) => void) | undefined,
        on: vi.fn(),
        subscribe: vi.fn(),
      }
      channel.on.mockImplementation(
        (
          _type: string,
          _filter: unknown,
          callback: typeof channel.callback,
        ) => {
          channel.callback = callback
          return channel
        },
      )
      channel.subscribe.mockReturnValue(channel)
      channels.push(channel)
      return channel
    }),
  }
})
vi.mock('@/shared/lib/supabaseClient', () => ({
  supabase: { ...mock, realtime: { setAuth: mock.setAuth } },
}))
import { useLiveRiderLocation } from './useLiveRiderLocation'
import { useOrderStatusChannel } from './useOrderStatusChannel'
const riderId = '11111111-1111-4111-8111-111111111111'
beforeEach(() => {
  mock.channels.length = 0
})
afterEach(cleanup)
describe('Realtime channel lifecycle', () => {
  it('validates and orders GPS ticks and removes channels when rider changes', async () => {
    const { result, rerender, unmount } = renderHook(
      ({ id }) => useLiveRiderLocation(id),
      { initialProps: { id: riderId } },
    )
    await waitFor(() => expect(mock.channels[0]?.callback).toBeDefined())
    const first = mock.channels[0]
    const payload = {
      riderId,
      lat: 12,
      lng: 8,
      accuracy: 4,
      timestamp: Date.now(),
    }
    act(() => first.callback?.({ payload }))
    expect(result.current.location?.lat).toBe(12)
    act(() =>
      first.callback?.({
        payload: { ...payload, lat: 13, timestamp: payload.timestamp - 1 },
      }),
    )
    expect(result.current.location?.lat).toBe(12)
    act(() => first.callback?.({ payload: { ...payload, lat: 100 } }))
    expect(result.current.location?.lat).toBe(12)
    rerender({ id: '22222222-2222-4222-8222-222222222222' })
    expect(result.current.location).toBeNull()
    expect(mock.removeChannel).toHaveBeenCalledWith(first)
    await waitFor(() => expect(mock.channels[1]?.callback).toBeDefined())
    unmount()
    expect(mock.removeChannel).toHaveBeenCalledWith(mock.channels[1])
  })
  it('subscribes to the specific order and ignores old rows', () => {
    const { result, unmount } = renderHook(() => useOrderStatusChannel(riderId))
    const channel = mock.channels[0]
    expect(channel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({ filter: `id=eq.${riderId}`, table: 'orders' }),
      expect.any(Function),
    )
    const order = {
      id: riderId,
      customer_id: riderId,
      rider_id: null,
      status: 'preparing',
      updated_at: '2026-09-13T12:00:00Z',
    }
    act(() => channel.callback?.({ new: order }))
    act(() =>
      channel.callback?.({
        new: {
          ...order,
          status: 'pending',
          updated_at: '2026-09-13T11:00:00Z',
        },
      }),
    )
    expect(result.current.order?.status).toBe('preparing')
    unmount()
    expect(mock.removeChannel).toHaveBeenCalledWith(channel)
  })
})
