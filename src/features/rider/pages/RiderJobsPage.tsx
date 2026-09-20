import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { claimDelivery, getAvailableJobs, type RiderOrder } from '../api/rider.api'
import { toast } from 'sonner'
export function Component() { const navigate = useNavigate(); const [jobs, setJobs] = useState<RiderOrder[]>([]); const load = () => void getAvailableJobs().then(setJobs).catch(() => toast.error('Unable to load available jobs.')); useEffect(load, []); return <div className="space-y-4"><h1 className="text-3xl font-semibold">Available jobs</h1>{jobs.map((job) => <Card key={job.id}><CardHeader><CardTitle>{job.vendor_name}</CardTitle></CardHeader><CardContent><p>Pick up: {job.vendor_address}</p><p>Drop-off: {job.delivery_address}</p><Button className="mt-4" onClick={() => void claimDelivery(job.id).then(() => navigate('/rider/active')).catch((error: unknown) => { toast.error(error instanceof Error && error.message.includes('claimed') ? 'This delivery was just claimed. Refreshing jobs.' : 'Unable to claim delivery.'); load() })}>Claim this delivery</Button></CardContent></Card>)}{!jobs.length && <p className="text-muted-foreground">No deliveries are available right now.</p>}</div> }
