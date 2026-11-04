import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { addVendorFromAdmin, getAdminServiceAreas, getAvailableVendorOwners, type AdminVendorOwner } from '../api/admin.api'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'

type ServiceArea = { id: string; name: string }

export function AddVendorDialog({
  onAdded,
  trigger,
}: {
  onAdded: () => void
  trigger: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [owners, setOwners] = useState<AdminVendorOwner[]>([])
  const [areas, setAreas] = useState<ServiceArea[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [ownerId, setOwnerId] = useState('')
  const [serviceAreaId, setServiceAreaId] = useState('')

  useEffect(() => {
    if (!open) return
    let active = true
    setLoadingOptions(true)
    setError('')
    Promise.all([getAvailableVendorOwners(), getAdminServiceAreas()])
      .then(([availableOwners, serviceAreas]) => {
        if (!active) return
        setOwners(availableOwners)
        setAreas(serviceAreas)
        setOwnerId(availableOwners[0]?.id ?? '')
        setServiceAreaId(serviceAreas[0]?.id ?? '')
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : 'Unable to load options.',
          )
      })
      .finally(() => {
        if (active) setLoadingOptions(false)
      })
    return () => {
      active = false
    }
  }, [open])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') ?? '').trim()
    const address = String(form.get('address') ?? '').trim()
    const description = String(form.get('description') ?? '').trim()
    if (!ownerId || !serviceAreaId || name.length < 2 || address.length < 5) {
      setError('Choose a vendor account and service area, then complete the required fields.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await addVendorFromAdmin({
        ownerId,
        name,
        address,
        description,
        serviceAreaId,
      })
      toast.success(`${name} was added and approved.`)
      setOpen(false)
      onAdded()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to add vendor.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>{trigger}</Button>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a vendor</DialogTitle>
          <DialogDescription>
            Create an approved restaurant listing for a vendor account that has registered on Chopza.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="admin-vendor-owner">Vendor account</Label>
            <Select value={ownerId} onValueChange={setOwnerId}>
              <SelectTrigger id="admin-vendor-owner" disabled={loadingOptions || owners.length === 0}>
                <SelectValue placeholder="Select vendor account" />
              </SelectTrigger>
              <SelectContent>
                {owners.map((owner) => (
                  <SelectItem key={owner.id} value={owner.id}>
                    {owner.name}{owner.email ? ` · ${owner.email}` : owner.phone ? ` · ${owner.phone}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!loadingOptions && owners.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No unassigned vendor accounts found. The vendor must register first.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-vendor-name">Business name</Label>
            <Input id="admin-vendor-name" name="name" required minLength={2} placeholder="Kano Kitchen" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-vendor-address">Business address</Label>
            <Input id="admin-vendor-address" name="address" required minLength={5} placeholder="Street, area, city" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-vendor-area">Service area</Label>
            <Select value={serviceAreaId} onValueChange={setServiceAreaId}>
              <SelectTrigger id="admin-vendor-area" disabled={loadingOptions || areas.length === 0}>
                <SelectValue placeholder="Select service area" />
              </SelectTrigger>
              <SelectContent>
                {areas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-vendor-description">Description <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea id="admin-vendor-description" name="description" maxLength={1000} placeholder="What does this restaurant serve?" />
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving || loadingOptions || owners.length === 0 || areas.length === 0}>
              {saving ? 'Adding vendor…' : 'Add approved vendor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
