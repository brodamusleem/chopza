import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const mock = vi.hoisted(() => {
  const channel = {
    send: vi.fn(() => Promise.resolve('ok')),
    subscribe: vi.fn(),
  }
  const client = {
    channel: vi.fn(() => channel),
    realtime: { setAuth: vi.fn(() => Promise.resolve()) },
    removeChannel: vi.fn(() => Promise.resolve('ok')),
  }
  return {
    channel,
    client,
    requireSupabase: vi.fn(() => client),
    updateOrderLocation: vi.fn(() => Promise.resolve()),
  }
})

vi.mock('@/shared/lib/supabaseClient', () => ({
  requireSupabase: mock.requireSupabase,
}))
vi.mock('../api/rider.api', () => ({
  updateOrderLocation: mock.updateOrderLocation,
}))

import { useActiveDeliveryLocation } from './useActiveDeliveryLocation'

const orderId = '33333333-3333-4333-8333-333333333333'
const riderId = '11111111-1111-4111-8111-111111111111'

beforeEach(() => {
  vi.clearAllMocks()
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it('broadcasts validated rider coordinates to the assigned order channel', async () => {
  let reportPosition: PositionCallback | undefined
  const geolocation = {
    watchPosition: vi.fn((success: PositionCallback) => {
      reportPosition = success
      return 7
    }),
    clearWatch: vi.fn(),
  }
  vi.stubGlobal('navigator', { geolocation })
  mock.channel.subscribe.mockImplementation((callback) => {
    callback('SUBSCRIBED')
    return mock.channel
  })

  const { unmount } = renderHook(() =>
    useActiveDeliveryLocation(orderId, riderId),
  )
  await waitFor(() => expect(geolocation.watchPosition).toHaveBeenCalled())
  expect(mock.client.channel).toHaveBeenCalledWith(`order-tracking-${orderId}`, {
    config: { private: true },
  })

  act(() =>
    reportPosition?.({
      coords: {
        latitude: 12.01,
        longitude: 8.61,
        accuracy: 4,
      },
      timestamp: Date.now(),
    } as GeolocationPosition),
  )

  await waitFor(() =>
    expect(mock.channel.send).toHaveBeenCalledWith({
      type: 'broadcast',
      event: 'position',
      payload: expect.objectContaining({
        riderId,
        lat: 12.01,
        lng: 8.61,
        accuracy: 4,
      }),
    }),
  )
  expect(mock.updateOrderLocation).toHaveBeenCalledWith(orderId, 12.01, 8.61)

  unmount()
  expect(geolocation.clearWatch).toHaveBeenCalledWith(7)
  expect(mock.client.removeChannel).toHaveBeenCalledWith(mock.channel)
})