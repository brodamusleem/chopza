import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form'
import { getServiceAreas, type VendorApplication } from '../../api/vendorOnboarding.api'
import { vendorApplicationSchema, type VendorApplicationValues } from '../../schemas/vendorApplication.schema'
import { useSubmitVendorApplication } from '../../hooks/useSubmitVendorApplication'
import { useResubmitVendorApplication } from '../../hooks/useResubmitVendorApplication'
import { LocationPicker } from './LocationPicker'

export function VendorApplicationForm({
  existingVendor,
  onComplete,
}: {
  existingVendor?: VendorApplication
  onComplete: () => void
}) {
  const [areas, setAreas] = useState<{ id: string; name: string }[]>([])
  const [areasError, setAreasError] = useState('')
  const [logo, setLogo] = useState<File>()
  const { submit, isSubmitting } = useSubmitVendorApplication()
  const { submit: resubmit, isSubmitting: isResubmitting } = useResubmitVendorApplication()
  const form = useForm<VendorApplicationValues>({
    resolver: zodResolver(vendorApplicationSchema),
    defaultValues: {
      name: existingVendor?.name ?? '',
      description: existingVendor?.description ?? '',
      address: existingVendor?.address ?? '',
      service_area_id: existingVendor?.service_area_id ?? '',
      latitude: existingVendor?.latitude ?? null,
      longitude: existingVendor?.longitude ?? null,
    },
  })
  useEffect(() => {
    if (existingVendor) form.reset({
      name: existingVendor.name,
      description: existingVendor.description ?? '',
      address: existingVendor.address,
      service_area_id: existingVendor.service_area_id ?? '',
      latitude: existingVendor.latitude,
      longitude: existingVendor.longitude,
    })
  }, [existingVendor, form])
  useEffect(() => {
    getServiceAreas().then(setAreas).catch((cause: unknown) => setAreasError(cause instanceof Error ? cause.message : 'Unable to load service areas.'))
  }, [])
  const pending = isSubmitting || isResubmitting
  async function onSubmit(values: VendorApplicationValues) {
    try {
      if (existingVendor) await resubmit(existingVendor, values, logo)
      else await submit(values, logo)
      onComplete()
    } catch (cause: unknown) {
      form.setError('root', {
        message: cause instanceof Error ? cause.message : 'Unable to save the application.',
      })
    }
  }
  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField control={form.control} name="name" render={({ field }) => <FormItem><FormLabel>Business name</FormLabel><FormControl><Input placeholder="Kano Kitchen" {...field} /></FormControl><FormMessage /></FormItem>} />
        <FormField control={form.control} name="description" render={({ field }) => <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Tell customers what you serve." {...field} /></FormControl><FormMessage /></FormItem>} />
        <FormField control={form.control} name="address" render={({ field }) => <FormItem><FormLabel>Address</FormLabel><FormControl><Input placeholder="12 Ahmadu Bello Way" {...field} /></FormControl><FormMessage /></FormItem>} />
        <FormField control={form.control} name="service_area_id" render={({ field }) => <FormItem><FormLabel>Service area</FormLabel>{areasError ? <p className="text-sm text-destructive">{areasError}</p> : areas.length === 0 ? <p className="text-sm text-muted-foreground">No service areas are currently configured — contact an admin.</p> : <Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Choose an area" /></SelectTrigger></FormControl><SelectContent>{areas.map((area) => <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>)}</SelectContent></Select>}<FormMessage /></FormItem>} />
        <div className="space-y-2"><Label htmlFor="vendor-logo">Logo</Label><Input id="vendor-logo" type="file" accept="image/*" onChange={(event) => setLogo(event.target.files?.[0])} /><p className="text-sm text-muted-foreground">Upload a square image if you have one.</p></div>
        <Controller control={form.control} name="latitude" render={({ field: latitudeField }) => <Controller control={form.control} name="longitude" render={({ field: longitudeField }) => <LocationPicker latitude={latitudeField.value} longitude={longitudeField.value} onChange={(latitude, longitude) => { latitudeField.onChange(latitude); longitudeField.onChange(longitude) }} /> } />} />
        {form.formState.errors.root && <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>}
        <Button type="submit" disabled={pending || areas.length === 0}>{pending ? 'Saving application…' : existingVendor ? 'Resubmit application' : 'Submit application'}</Button>
      </form>
    </Form>
  )
}
