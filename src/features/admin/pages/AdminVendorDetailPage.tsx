import { useCallback, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeft, Loader2, MapPin, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { StatusBadge } from '../components/StatusBadge'
import { useAdminQuery } from '../hooks/useAdminQuery'
import { getVendorDetail, approveVendor, rejectVendor, suspendVendor } from '../api/admin.api'
import 'leaflet/dist/leaflet.css'

export function AdminVendorDetailPage() {
  const { vendorId = '' } = useParams()
  const navigate = useNavigate()
  const loadVendor = useCallback(() => getVendorDetail(vendorId), [vendorId])
  const query = useAdminQuery(loadVendor)
  const [action, setAction] = useState<'approved' | 'rejected' | 'suspended' | null>(null)
  const vendor = query.data

  async function mutate(nextStatus: 'approved' | 'rejected' | 'suspended') {
    if (!vendor) return
    setAction(nextStatus)
    try {
      if (nextStatus === 'approved') await approveVendor(vendor.id)
      else if (nextStatus === 'rejected') await rejectVendor(vendor.id)
      else await suspendVendor(vendor.id)
      toast.success(`${vendor.name} ${nextStatus}`)
      navigate('/admin/vendors', { replace: true })
    } catch (cause: unknown) {
      toast.error(cause instanceof Error ? cause.message : `Unable to mark vendor ${nextStatus}.`)
    } finally {
      setAction(null)
    }
  }

  if (query.isLoading) return <Card><CardContent className="py-12 text-center">Loading vendor application...</CardContent></Card>
  if (query.error) return <Card role="alert"><CardHeader><CardTitle>Could not load application</CardTitle></CardHeader><CardContent className="space-y-4"><p>{query.error.message}</p><Button variant="outline" onClick={() => void query.refetch()}><RefreshCw /> Try again</Button></CardContent></Card>
  if (!vendor) return <Card><CardContent className="py-12 text-center">Vendor application not found.</CardContent></Card>

  const location: LatLngExpression | null = vendor.latitude !== null && vendor.longitude !== null ? [vendor.latitude, vendor.longitude] : null
  return (
    <section className="space-y-6">
      <Button variant="ghost" asChild><Link to="/admin/vendors"><ArrowLeft /> All vendors</Link></Button>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div><p className="text-sm font-medium text-primary">Vendor application</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">{vendor.name}</h2><p className="mt-2 text-muted-foreground">Submitted {new Date(vendor.createdAt).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}</p></div>
        <StatusBadge status={vendor.status} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Card><CardHeader><CardTitle>Business details</CardTitle></CardHeader><CardContent className="space-y-4"><Detail label="Description" value={vendor.description || 'No description provided.'} /><Detail label="Address" value={vendor.address} /><Detail label="Service area" value={vendor.serviceArea || 'Not specified'} /></CardContent></Card>
          <Card><CardHeader><CardTitle>Owner details</CardTitle></CardHeader><CardContent className="space-y-4"><Detail label="Name" value={vendor.ownerName || 'Not available'} /><Detail label="Email" value={vendor.ownerEmail || 'Not available'} /><Detail label="Phone" value={vendor.ownerPhone || 'Not available'} /></CardContent></Card>
          {location && <Card><CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="size-4" /> Location pin</CardTitle></CardHeader><CardContent><MapContainer center={location} zoom={14} className="h-64 w-full rounded-lg"><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><Marker position={location} /></MapContainer></CardContent></Card>}
        </div>
        <div className="space-y-6"><Card><CardHeader><CardTitle>Logo</CardTitle></CardHeader><CardContent>{vendor.logoUrl ? <img src={vendor.logoUrl} alt={`${vendor.name} logo`} className="aspect-square w-full rounded-lg object-cover" /> : <div className="flex aspect-square items-center justify-center rounded-lg bg-muted text-muted-foreground">No logo uploaded</div>}</CardContent></Card><Card><CardHeader><CardTitle>Review</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-3">{vendor.status === 'pending' && <><Button disabled={Boolean(action)} onClick={() => void mutate('approved')}>{action === 'approved' && <Loader2 className="animate-spin" />} Approve</Button><Button variant="destructive" disabled={Boolean(action)} onClick={() => void mutate('rejected')}>{action === 'rejected' && <Loader2 className="animate-spin" />} Reject</Button></>}{vendor.status === 'approved' && <Button variant="destructive" disabled={Boolean(action)} onClick={() => void mutate('suspended')}>{action === 'suspended' && <Loader2 className="animate-spin" />} Suspend</Button>}{vendor.status !== 'pending' && vendor.status !== 'approved' && <Badge variant="outline">No actions available</Badge>}</CardContent></Card></div>
      </div>
    </section>
  )
}

function Detail({ label, value }: { label: string; value: string }) { return <div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 font-medium">{value}</p></div> }

export function Component() { return <AdminVendorDetailPage /> }
