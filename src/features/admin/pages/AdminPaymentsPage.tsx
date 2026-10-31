import { useEffect, useState } from 'react'
import { RefreshCw, Search, WalletCards } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/shared/components/ui/alert-dialog'
import { getAdminPayments, getRefundPendingOrders, refundOrder, type AdminPayment, type AdminRefundOrder } from '../api/admin.api'
import { formatNaira } from '@/shared/lib/currency'

const paymentStatuses = ['all', 'unpaid', 'paid', 'failed', 'refund_pending', 'refunded']

export function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([])
  const [refunds, setRefunds] = useState<AdminRefundOrder[]>([])
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    Promise.all([getAdminPayments({ status, search }), getRefundPendingOrders()])
      .then(([paymentRows, refundRows]) => {
        if (active) {
          setPayments(paymentRows)
          setRefunds(refundRows)
        }
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Unable to load payment records.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [status, search, retry])

  async function processRefund(order: AdminRefundOrder) {
    setBusyOrderId(order.id)
    try {
      await refundOrder(order.id)
      toast.success(`Refund submitted for ${order.vendor}.`)
      setRetry((value) => value + 1)
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Refund failed.')
    } finally {
      setBusyOrderId(null)
    }
  }

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm font-medium text-primary">Finance</p>
        <h1 className="mt-2 flex items-center gap-2 text-3xl font-semibold"><WalletCards className="size-7" /> Payments</h1>
        <p className="mt-2 text-muted-foreground">Paystack transaction records and refunds awaiting review.</p>
      </header>
      {error && <Card role="alert"><CardContent className="py-5"><p>{error}</p><Button variant="outline" className="mt-3" onClick={() => setRetry((value) => value + 1)}>Retry</Button></CardContent></Card>}
      <Card>
        <CardHeader className="flex-row items-center justify-between"><CardTitle>Refunds needed</CardTitle><Button variant="outline" onClick={() => setRetry((value) => value + 1)} disabled={loading}><RefreshCw className={loading ? 'animate-spin' : ''} /> Refresh</Button></CardHeader>
        <CardContent>
          {loading ? <p role="status" className="py-6 text-muted-foreground">Loading refunds…</p> : refunds.length ? <div className="space-y-3">{refunds.map((order) => <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"><div><p className="font-medium">{order.vendor} · {order.customer}</p><p className="text-sm text-muted-foreground">Order {order.id.slice(0, 8)} · {new Date(order.createdAt).toLocaleDateString()}</p></div><div className="flex items-center gap-3"><strong>{formatNaira(Math.round(order.amount * 100))}</strong><AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" disabled={busyOrderId === order.id}>{busyOrderId === order.id ? 'Refunding…' : 'Refund'}</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Issue this refund?</AlertDialogTitle><AlertDialogDescription>Paystack will refund {formatNaira(Math.round(order.amount * 100))} for order {order.id.slice(0, 8)}.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => void processRefund(order)}>Confirm refund</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></div>)}</div> : <p className="py-6 text-muted-foreground">No refunds are waiting.</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Transactions</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3"><div className="relative min-w-56 flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search reference" value={search} onChange={(event) => setSearch(event.target.value)} /></div><Select value={status} onValueChange={setStatus}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent>{paymentStatuses.map((value) => <SelectItem key={value} value={value}>{value.replaceAll('_', ' ')}</SelectItem>)}</SelectContent></Select></div>
          {loading ? <p role="status" className="py-6 text-muted-foreground">Loading payments…</p> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Reference</TableHead><TableHead>Customer</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader><TableBody>{payments.map((payment) => <TableRow key={payment.id}><TableCell className="font-mono text-xs">{payment.reference}</TableCell><TableCell>{payment.customer}</TableCell><TableCell><Badge variant="outline">{payment.status.replaceAll('_', ' ')}</Badge></TableCell><TableCell>{new Date(payment.createdAt).toLocaleString()}</TableCell><TableCell className="text-right">{formatNaira(Math.round(payment.amount * 100))}</TableCell></TableRow>)}{!payments.length && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No payments match these filters.</TableCell></TableRow>}</TableBody></Table></div>}
        </CardContent>
      </Card>
    </section>
  )
}
