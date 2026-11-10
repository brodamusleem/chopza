import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { Bike, Clock3, MapPin, PackageCheck, Phone, StickyNote } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { requireSupabase } from '@/shared/lib/supabaseClient'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import {
  acceptDelivery,
  claimDelivery,
  declineDelivery,
  getAvailableJobs,
  getRiderOrders,
  type RiderOrder,
} from '../api/rider.api'
import { useRiderApplicationStatus } from '../hooks/useRiderApplicationStatus'
import { toast } from 'sonner'

const OFFER_WINDOW_MS = 5 * 60 * 1000

function remainingOfferTime(assignedAt: string | null, now: number) {
  if (!assignedAt) return 0
  return Math.max(0, OFFER_WINDOW_MS - (now - new Date(assignedAt).getTime()))
}

function timeLabel(milliseconds: number) {
  const seconds = Math.ceil(milliseconds / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

export function Component() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { application } = useRiderApplicationStatus()
  const [jobs, setJobs] = useState<RiderOrder[]>([])
  const [offers, setOffers] = useState<RiderOrder[]>([])
  const [hasAcceptedDelivery, setHasAcceptedDelivery] = useState(false)
  const [busyId, setBusyId] = useState<string>()
  const [now, setNow] = useState(Date.now())
  const notifiedOffers = useRef(new Set<string>())

  const load = useCallback(async () => {
    if (!user) return
    try {
      const [available, assigned] = await Promise.all([
        getAvailableJobs(),
        getRiderOrders(user.id, ['rider_assigned', 'picked_up', 'in_transit']),
      ])
      setJobs(available)
      setOffers(assigned.filter((order) => order.status === 'rider_assigned' && !order.rider_accepted_at))
      setHasAcceptedDelivery(assigned.some((order) => order.status !== 'rider_assigned' || !!order.rider_accepted_at))
    } catch {
      toast.error('Unable to refresh delivery jobs.')
    }
  }, [user])

  useEffect(() => {
    void load()
    const timer = window.setInterval(() => {
      setNow(Date.now())
      void load()
    }, 15000)
    const supabase = requireSupabase()
    let channel: ReturnType<typeof supabase.channel> | undefined
    if (user) {
      channel = supabase
        .channel(`rider-offers-${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders', filter: `rider_id=eq.${user.id}` },
          (payload) => {
            const row = payload.new as { id?: string; status?: string; rider_accepted_at?: string | null }
            if (row.id && row.status === 'rider_assigned' && !row.rider_accepted_at && !notifiedOffers.current.has(row.id)) {
              notifiedOffers.current.add(row.id)
              toast.info('A delivery was assigned to you. Accept it within five minutes.')
            }
            void load()
          },
        )
        .subscribe()
    }
    return () => {
      window.clearInterval(timer)
      if (channel) void requireSupabase().removeChannel(channel)
    }
  }, [load, user])

  if (hasAcceptedDelivery) return <Navigate to="/rider/active" replace />
  if (!application?.is_online && offers.length === 0)
    return (
      <Card>
        <CardHeader><CardTitle>You are offline</CardTitle></CardHeader>
        <CardContent>Go online from the sidebar to receive preferred rider offers and view the shared delivery pool.</CardContent>
      </Card>
    )

  const actOnOffer = async (orderId: string, action: 'accept' | 'decline') => {
    setBusyId(orderId)
    try {
      if (action === 'accept') {
        await acceptDelivery(orderId)
        toast.success('Delivery accepted. Head to the vendor for pickup.')
        navigate('/rider/active')
      } else {
        await declineDelivery(orderId)
        toast.info('Offer declined. We are finding the next available rider.')
        await load()
      }
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to respond to the delivery offer.')
      await load()
    } finally {
      setBusyId(undefined)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Available deliveries</h1>
        <p className="text-muted-foreground">Review the pickup and delivery details before accepting a job.</p>
      </div>

      {offers.map((offer) => {
        const left = remainingOfferTime(offer.rider_assigned_at, now)
        return (
          <Card key={offer.id} className="border-primary/30 shadow-sm">
            <CardHeader className="flex-row items-start justify-between gap-3">
              <div><CardTitle className="flex items-center gap-2"><PackageCheck className="size-5 text-primary" /> Delivery offer</CardTitle><p className="mt-1 text-sm text-muted-foreground">Please respond before this offer expires.</p></div>
              <Badge variant={left > 0 ? 'default' : 'destructive'} className="gap-1"><Clock3 className="size-3.5" />{timeLabel(left)}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-semibold">{offer.vendor_name}</p>
              <p className="flex items-start gap-2 text-sm"><Bike className="mt-0.5 size-4 shrink-0 text-primary" /><span><span className="font-medium">Pickup</span><br />{offer.vendor_address}</span></p>
              <p className="flex items-start gap-2 text-sm"><MapPin className="mt-0.5 size-4 shrink-0 text-primary" /><span><span className="font-medium">Delivery address</span><br />{offer.delivery_address}</span></p>
              <p className="flex items-start gap-2 text-sm"><Phone className="mt-0.5 size-4 shrink-0 text-primary" /><span><span className="font-medium">Customer phone</span><br />{offer.delivery_phone ? <a className="underline underline-offset-2" href={`tel:${offer.delivery_phone}`}>{offer.delivery_phone}</a> : 'Not provided'}</span></p>
              {offer.delivery_notes && <p className="flex items-start gap-2 text-sm"><StickyNote className="mt-0.5 size-4 shrink-0 text-primary" /><span><span className="font-medium">Delivery note</span><br />{offer.delivery_notes}</span></p>}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button disabled={busyId === offer.id || left === 0} onClick={() => void actOnOffer(offer.id, 'accept')}>{busyId === offer.id ? 'Responding…' : 'Accept delivery'}</Button>
                <Button variant="outline" disabled={busyId === offer.id} onClick={() => void actOnOffer(offer.id, 'decline')}>Decline offer</Button>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {application?.is_online && <section className="space-y-4">
        <h2 className="text-xl font-semibold">Other available deliveries</h2>
        {jobs.map((job) => (
          <Card key={job.id}>
            <CardHeader><CardTitle>{job.vendor_name}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm"><span className="font-medium">Pickup</span><br />{job.vendor_address}</p>
              <p className="mt-2 text-sm"><span className="font-medium">Delivery address</span><br />{job.delivery_address}</p>
              <p className="mt-2 text-sm"><span className="font-medium">Customer phone</span><br />{job.delivery_phone ? <a className="underline underline-offset-2" href={`tel:${job.delivery_phone}`}>{job.delivery_phone}</a> : 'Not provided'}</p>
              {job.delivery_notes && <p className="mt-2 text-sm"><span className="font-medium">Delivery note</span><br />{job.delivery_notes}</p>}
              <Button className="mt-4" disabled={busyId === job.id} onClick={() => {
                setBusyId(job.id)
                void claimDelivery(job.id)
                  .then(() => navigate('/rider/active'))
                  .catch((cause: unknown) => {
                    toast.error(cause instanceof Error ? cause.message : 'This delivery was just claimed.')
                    void load()
                  })
                  .finally(() => setBusyId(undefined))
              }}>{busyId === job.id ? 'Processing…' : 'Accept delivery'}</Button>
            </CardContent>
          </Card>
        ))}
        {!jobs.length && <p className="text-sm text-muted-foreground">There are no other deliveries available right now.</p>}
      </section>}
    </div>
  )
}
