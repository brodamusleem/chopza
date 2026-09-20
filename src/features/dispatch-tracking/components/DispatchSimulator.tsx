import { useEffect, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'

const defaultPoint = { lat: 12.0022, lng: 8.592 }

export function DispatchSimulator({
  onTick,
  enabled,
  onToggle,
  initialPoint,
}: {
  onTick: (point: { lat: number; lng: number }) => void
  enabled: boolean
  onToggle: (enabled: boolean) => void
  initialPoint?: { lat: number; lng: number }
}) {
  const [point, setPoint] = useState(initialPoint ?? defaultPoint)

  useEffect(() => {
    if (initialPoint) setPoint(initialPoint)
  }, [initialPoint?.lat, initialPoint?.lng])

  useEffect(() => {
    if (!enabled) return

    const timer = window.setInterval(() => {
      setPoint((previous) => {
        const deltaLat = (Math.random() - 0.5) * 0.0012
        const deltaLng = (Math.random() - 0.5) * 0.0016
        const next = {
          lat: Number(Math.min(12.03, Math.max(11.98, previous.lat + deltaLat)).toFixed(6)),
          lng: Number(Math.min(8.7, Math.max(8.52, previous.lng + deltaLng)).toFixed(6)),
        }
        onTick(next)
        return next
      })
    }, 2500)

    return () => window.clearInterval(timer)
  }, [enabled, onTick, point])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dispatch simulator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sim-lat">Latitude</Label>
            <Input id="sim-lat" value={point.lat.toFixed(6)} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sim-lng">Longitude</Label>
            <Input id="sim-lng" value={point.lng.toFixed(6)} readOnly />
          </div>
        </div>
        <Button onClick={() => onToggle(!enabled)} className="gap-2">
          {enabled ? <Pause className="size-4" /> : <Play className="size-4" />}
          {enabled ? 'Stop simulator' : 'Start simulator'}
        </Button>
      </CardContent>
    </Card>
  )
}
