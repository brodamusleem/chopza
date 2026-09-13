import { LocationBroadcaster } from '../components/LocationBroadcaster'
import { RiderOrderQueue } from '../components/RiderOrderQueue'
export function Component() {
  return (
    <>
      <h1 className="text-3xl font-semibold">Your deliveries</h1>
      <RiderOrderQueue />
      <LocationBroadcaster />
    </>
  )
}
