import { useEffect, useState } from 'react'
import { Bike, LoaderCircle, Save } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import {
  getVendorId,
  getVendorRiderOptions,
  saveVendorRiderPool,
  type VendorRiderOption,
} from '../api/vendorDashboard.api'

export function VendorRiderTeam() {
  const user = useAuth((state) => state.user)
  const [vendorId, setVendorId] = useState<string>()
  const [riders, setRiders] = useState<VendorRiderOption[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const id = await getVendorId(user.id)
      setVendorId(id ?? undefined)
      if (!id) {
        setRiders([])
        return
      }
      const options = await getVendorRiderOptions(id)
      setRiders(options)
      setSelected(options.filter((rider) => rider.assigned_to_vendor).map((rider) => rider.rider_id))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load delivery riders.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [user])

  const toggle = (riderId: string) => {
    setSelected((current) =>
      current.includes(riderId)
        ? current.filter((id) => id !== riderId)
        : [...current, riderId],
    )
  }

  const save = async () => {
    if (!vendorId) return
    setSaving(true)
    try {
      await saveVendorRiderPool(vendorId, selected)
      toast.success('Your preferred rider team has been saved.')
      await load()
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to save rider team.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2"><Bike className="size-5 text-primary" /> Delivery team</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Preferred riders are offered your ready orders first. Chopza checks other online riders if your team is unavailable.
          </p>
        </div>
        <Button onClick={() => void save()} disabled={loading || saving || !vendorId || riders.length === 0}>
          {saving ? <LoaderCircle className="animate-spin" /> : <Save />}
          Save team
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {loading && <p className="text-sm text-muted-foreground">Loading approved riders…</p>}
        {!loading && !error && riders.length === 0 && (
          <p className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
            There are no approved riders yet. You can still receive deliveries through the shared rider pool.
          </p>
        )}
        {riders.map((rider) => (
          <label key={rider.rider_id} className="flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/40">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={selected.includes(rider.rider_id)}
              onChange={() => toggle(rider.rider_id)}
              aria-label={`Prefer ${rider.full_name} for deliveries`}
            />
            <span className="grid size-9 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><Bike className="size-4" /></span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{rider.full_name}</span>
              <span className="text-xs text-muted-foreground">{selected.includes(rider.rider_id) ? 'Preferred rider' : 'Shared pool only'}</span>
            </span>
            <Badge variant={rider.is_online ? 'default' : 'secondary'}>{rider.is_online ? 'Online' : 'Offline'}</Badge>
          </label>
        ))}
      </CardContent>
    </Card>
  )
}
