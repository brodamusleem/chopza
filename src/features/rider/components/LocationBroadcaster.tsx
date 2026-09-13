import { useState } from 'react'
import { useAuth } from '@/features/auth'
import { Button } from '@/shared/components/ui/button'
import { useBroadcastLocation } from '../hooks/useBroadcastLocation'
export function LocationBroadcaster() {
  const [enabled, setEnabled] = useState(false)
  const user = useAuth((state) => state.user)
  const { error } = useBroadcastLocation(user?.id, enabled)
  return (
    <section className="space-y-3 rounded-xl border p-6">
      <h2 className="text-xl font-semibold">Location sharing</h2>
      <p>Share your location while delivering an assigned order.</p>
      <Button onClick={() => setEnabled(!enabled)}>
        {enabled ? 'Stop sharing' : 'Start sharing location'}
      </Button>
      {error && <p role="alert">{error}</p>}
    </section>
  )
}
