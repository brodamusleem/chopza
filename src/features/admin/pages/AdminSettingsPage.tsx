import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Download, Loader2, Plus, Save, Trash2, Upload } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { supabase } from '@/shared/lib/supabaseClient'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form'
import { Input } from '@/shared/components/ui/input'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Switch } from '@/shared/components/ui/switch'
import { Textarea } from '@/shared/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { getAdminProfile, getAdminProfiles, getExportRows, getPlatformSettings, getServiceAreas, createServiceArea, deleteServiceArea, demoteAdmin, inviteAdmin, updateAdminProfile, updatePlatformSettings, updateServiceArea, uploadPublicFile, type AdminProfile, type PlatformSettings, type ServiceArea } from '../api/settings.api'

const profileSchema = z.object({ full_name: z.string().trim().min(2, 'Enter your full name.'), phone: z.string().trim().refine((value) => !value || /^[+]?[0-9 ()-]{7,20}$/.test(value), 'Enter a valid phone number.') })
const passwordSchema = z.object({ new_password: z.string().min(8, 'Use at least 8 characters.'), confirm_password: z.string() }).refine((values) => values.new_password === values.confirm_password, { path: ['confirm_password'], message: 'Passwords do not match.' })
const feesSchema = z.object({ base_delivery_fee: z.number().positive(), service_fee_percentage: z.number().min(0).max(100), min_order_amount: z.number().positive() })
const brandingSchema = z.object({ app_name: z.string().trim().min(2, 'Enter an app name.') })
const areaSchema = z.object({ name: z.string().trim().min(2, 'Enter an LGA or zone name.') })
const inviteSchema = z.object({ full_name: z.string().trim().min(2), email: z.string().email() })
const renameSchema = z.object({ full_name: z.string().trim().min(2) })

type Section = 'Profile' | 'Security' | 'Platform Fees' | 'Branding' | 'Service Areas' | 'Notifications' | 'Admin Accounts' | 'Data & Maintenance'
const sections: Section[] = ['Profile', 'Security', 'Platform Fees', 'Branding', 'Service Areas', 'Notifications', 'Admin Accounts', 'Data & Maintenance']

function SaveButton({ saving }: { saving: boolean }) {
  return <Button type="submit" disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save changes</Button>
}

function csvDownload(name: string, rows: Record<string, unknown>[]) {
  if (!rows.length) { toast.info('There is no data to export.'); return }
  const columns = Object.keys(rows[0])
  const escape = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`
  const csv = [columns.join(','), ...rows.map((row) => columns.map((column) => escape(row[column])).join(','))].join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `chopza-${name}-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function AdminSettingsPage() {
  const { user } = useAuth()
  const [section, setSection] = useState<Section>('Profile')
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [settings, setSettings] = useState<PlatformSettings | null>(null)
  const [areas, setAreas] = useState<ServiceArea[]>([])
  const [admins, setAdmins] = useState<AdminProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [areaOpen, setAreaOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editing, setEditing] = useState<AdminProfile | null>(null)
  const [busyArea, setBusyArea] = useState<string | null>(null)

  const profileForm = useForm({ resolver: zodResolver(profileSchema), defaultValues: { full_name: '', phone: '' } })
  const passwordForm = useForm({ resolver: zodResolver(passwordSchema), defaultValues: { new_password: '', confirm_password: '' } })
  const feesForm = useForm({ resolver: zodResolver(feesSchema), defaultValues: { base_delivery_fee: 0, service_fee_percentage: 0, min_order_amount: 0 } })
  const brandingForm = useForm({ resolver: zodResolver(brandingSchema), defaultValues: { app_name: 'Chopza' } })
  const areaForm = useForm({ resolver: zodResolver(areaSchema), defaultValues: { name: '' } })
  const inviteForm = useForm({ resolver: zodResolver(inviteSchema), defaultValues: { full_name: '', email: '' } })
  const renameForm = useForm({ resolver: zodResolver(renameSchema), defaultValues: { full_name: '' } })
  const [notifications, setNotifications] = useState({ new_vendor_application: true, unassigned_order_alert: true })
  const [maintenance, setMaintenance] = useState(false)
  const [maintenanceMessage, setMaintenanceMessage] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  const refreshAreas = async () => setAreas(await getServiceAreas())
  const refreshAdmins = async () => setAdmins(await getAdminProfiles())

  useEffect(() => {
    if (!user) return
    void Promise.all([getAdminProfile(user.id), getPlatformSettings(), getServiceAreas(), getAdminProfiles()]).then(([nextProfile, nextSettings, nextAreas, nextAdmins]) => {
      setProfile(nextProfile); setSettings(nextSettings); setAreas(nextAreas); setAdmins(nextAdmins)
      profileForm.reset({ full_name: nextProfile.full_name, phone: nextProfile.phone ?? '' })
      feesForm.reset({ base_delivery_fee: nextSettings.base_delivery_fee, service_fee_percentage: nextSettings.service_fee_percentage, min_order_amount: nextSettings.min_order_amount })
      brandingForm.reset({ app_name: nextSettings.app_name }); setLogoUrl(nextSettings.logo_url); setMaintenance(nextSettings.maintenance_mode); setMaintenanceMessage(nextSettings.maintenance_message)
      const preferences = nextProfile.notification_preferences
      if (preferences && typeof preferences === 'object' && !Array.isArray(preferences)) setNotifications({ new_vendor_application: preferences.new_vendor_application !== false, unassigned_order_alert: preferences.unassigned_order_alert !== false })
    }).catch((error: unknown) => toast.error(error instanceof Error ? error.message : 'Unable to load settings.')).finally(() => setLoading(false))
  }, [user])

  const save = async (task: () => Promise<void>) => { setSaving(true); try { await task(); toast.success('Settings saved.'); } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to save settings.') } finally { setSaving(false) } }
  const fileUpload = async (event: React.ChangeEvent<HTMLInputElement>, bucket: string, path: string, setter: (url: string) => void) => { const file = event.target.files?.[0]; if (!file || !user) return; try { setter(await uploadPublicFile(bucket, path, file)); toast.success('File uploaded. Save changes to apply it.') } catch (error) { toast.error(error instanceof Error ? error.message : 'Upload failed.') } }
  const updateMaintenance = async (value: boolean) => { setMaintenance(value); if (!settings) return; await save(async () => { const next = await updatePlatformSettings({ maintenance_mode: value, maintenance_message: maintenanceMessage, updated_by: user?.id }); setSettings(next) }) }

  const title = useMemo(() => section, [section])
  if (loading) return <div className="space-y-5"><Skeleton className="h-10 w-72" /><Skeleton className="h-96 w-full" /></div>

  return (
    <section className="space-y-6">
      <div><p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Workspace control</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Settings</h1><p className="mt-2 text-muted-foreground">Manage your account, platform rules, and operations.</p></div>
      <div className="grid gap-6 lg:grid-cols-[190px_1fr]">
        <nav className="flex gap-1 overflow-x-auto lg:block lg:space-y-1">{sections.map((item) => <Button key={item} variant={section === item ? 'secondary' : 'ghost'} className="shrink-0 justify-start lg:w-full" onClick={() => setSection(item)}>{item}</Button>)}</nav>
        <div className="min-w-0 space-y-6">
          <Card><CardHeader><CardTitle>{title}</CardTitle><CardDescription>Changes apply immediately after saving.</CardDescription></CardHeader><CardContent>
            {section === 'Profile' && <Form {...profileForm}><form onSubmit={profileForm.handleSubmit((values) => save(async () => { if (!user) return; const next = await updateAdminProfile(user.id, values); setProfile(next) }))} className="max-w-xl space-y-5"><FormField control={profileForm.control} name="full_name" render={({ field }) => <FormItem><FormLabel>Full name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} /><FormField control={profileForm.control} name="phone" render={({ field }) => <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} placeholder="080..." /></FormControl><FormMessage /></FormItem>} /><div><FormLabel>Avatar</FormLabel><div className="mt-2 flex items-center gap-3"><Input type="file" accept="image/*" onChange={(event) => void fileUpload(event, 'avatars', `avatars/${user?.id}/${event.target.files?.[0]?.name ?? 'avatar'}`, (url) => { if (user) void save(async () => { const next = await updateAdminProfile(user.id, { avatar_url: url }); setProfile(next) }) })} /><Upload className="size-4" /></div></div><SaveButton saving={saving} /></form></Form>}
            {section === 'Security' && <Form {...passwordForm}><form onSubmit={passwordForm.handleSubmit((values) => save(async () => { const { error } = await supabase!.auth.updateUser({ password: values.new_password }); if (error) throw error; passwordForm.reset(); }))} className="max-w-xl space-y-5"><FormField control={passwordForm.control} name="new_password" render={({ field }) => <FormItem><FormLabel>New password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>} /><FormField control={passwordForm.control} name="confirm_password" render={({ field }) => <FormItem><FormLabel>Confirm password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>} /><p className="text-sm text-muted-foreground">You&apos;ll need to log in again on other devices after changing your password.</p><SaveButton saving={saving} /></form></Form>}
            {section === 'Platform Fees' && <Form {...feesForm}><form onSubmit={feesForm.handleSubmit((values) => save(async () => { const next = await updatePlatformSettings({ ...values, updated_by: user?.id }); setSettings(next) }))} className="max-w-xl space-y-5"><FormField control={feesForm.control} name="base_delivery_fee" render={({ field }) => <FormItem><FormLabel>Base delivery fee</FormLabel><FormControl><Input type="number" value={field.value ?? ''} onChange={(event) => field.onChange(event.target.value === '' ? undefined : Number(event.target.value))} /></FormControl><FormMessage /></FormItem>} /><FormField control={feesForm.control} name="service_fee_percentage" render={({ field }) => <FormItem><FormLabel>Service fee percentage</FormLabel><FormControl><Input type="number" min="0" max="100" value={field.value ?? ''} onChange={(event) => field.onChange(event.target.value === '' ? undefined : Number(event.target.value))} /></FormControl><FormMessage /></FormItem>} /><FormField control={feesForm.control} name="min_order_amount" render={({ field }) => <FormItem><FormLabel>Minimum order amount</FormLabel><FormControl><Input type="number" value={field.value ?? ''} onChange={(event) => field.onChange(event.target.value === '' ? undefined : Number(event.target.value))} /></FormControl><FormMessage /></FormItem>} /><p className="text-sm text-muted-foreground">These values apply platform-wide and affect every order&apos;s delivery fee and service charge calculation.</p><SaveButton saving={saving} /></form></Form>}
            {section === 'Branding' && <Form {...brandingForm}><form onSubmit={brandingForm.handleSubmit((values) => save(async () => { const next = await updatePlatformSettings({ ...values, logo_url: logoUrl, updated_by: user?.id }); setSettings(next) }))} className="max-w-xl space-y-5"><FormField control={brandingForm.control} name="app_name" render={({ field }) => <FormItem><FormLabel>App name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} /><Input type="file" accept="image/*" onChange={(event) => void fileUpload(event, 'branding', `branding/logo-${Date.now()}`, setLogoUrl)} /><div className="flex items-center gap-3 rounded-lg border p-4"><div className="grid size-10 place-items-center rounded bg-primary text-lg font-bold text-primary-foreground">{logoUrl ? <img src={logoUrl} alt="" className="size-10 rounded object-cover" /> : 'C'}</div><span className="font-semibold">{brandingForm.watch('app_name')}</span></div><SaveButton saving={saving} /></form></Form>}
          </CardContent></Card>
          {section === 'Service Areas' && <Card><CardHeader className="flex-row items-center justify-between"><div><CardTitle>Service areas</CardTitle><CardDescription>Control the LGAs and zones available for delivery.</CardDescription></div><Dialog open={areaOpen} onOpenChange={setAreaOpen}><DialogTrigger asChild><Button><Plus className="size-4" /> Add service area</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Add service area</DialogTitle></DialogHeader><Form {...areaForm}><form onSubmit={areaForm.handleSubmit((values) => save(async () => { const area = await createServiceArea({ name: values.name }); setAreas((previous) => [...previous, area].sort((a, b) => a.name.localeCompare(b.name))); areaForm.reset(); setAreaOpen(false) }))} className="space-y-4"><FormField control={areaForm.control} name="name" render={({ field }) => <FormItem><FormLabel>LGA or zone name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} /><DialogFooter><Button type="submit">Add area</Button></DialogFooter></form></Form></DialogContent></Dialog></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Active</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader><TableBody>{areas.map((area) => <TableRow key={area.id}><TableCell>{area.name}</TableCell><TableCell><Switch checked={area.is_active} disabled={busyArea === area.id} onCheckedChange={(checked) => { setBusyArea(area.id); void updateServiceArea(area.id, { is_active: checked }).then(() => setAreas((previous) => previous.map((item) => item.id === area.id ? { ...item, is_active: checked } : item))).catch((error: unknown) => toast.error(error instanceof Error ? error.message : 'Unable to update area.')).finally(() => setBusyArea(null)) }} /></TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" aria-label={`Delete ${area.name}`} onClick={() => { if (window.confirm(`Delete ${area.name}?`)) void deleteServiceArea(area.id).then(() => refreshAreas()).catch((error: unknown) => toast.error(error instanceof Error ? error.message : 'Unable to delete area.')) }}><Trash2 className="size-4" /></Button></TableCell></TableRow>)}</TableBody></Table>{areas.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No service areas yet. Suggested seed: Kano Municipal, Fagge, Nassarawa, Tarauni, Dala, Gwale, Kumbotso, Ungogo. Add them only when you are ready.</p>}</CardContent></Card>}
          {section === 'Notifications' && profile && <Card><CardContent className="space-y-5 pt-6"><div className="flex items-center justify-between gap-4"><div><p className="font-medium">Email me when a new vendor applies</p><p className="text-sm text-muted-foreground">Stores your preference only.</p></div><Switch checked={notifications.new_vendor_application} onCheckedChange={(checked) => { const next = { ...notifications, new_vendor_application: checked }; setNotifications(next); void save(async () => { const updated = await updateAdminProfile(profile.id, { notification_preferences: next }); setProfile(updated) }) }} /></div><div className="flex items-center justify-between gap-4"><div><p className="font-medium">Email me when an order has no rider assigned for a while</p><p className="text-sm text-muted-foreground">Actual email delivery is not implemented yet; this page only stores the preference.</p></div><Switch checked={notifications.unassigned_order_alert} onCheckedChange={(checked) => { const next = { ...notifications, unassigned_order_alert: checked }; setNotifications(next); void save(async () => { const updated = await updateAdminProfile(profile.id, { notification_preferences: next }); setProfile(updated) }) }} /></div><Badge variant="outline">Email delivery is not implemented</Badge></CardContent></Card>}
          {section === 'Admin Accounts' && <Card><CardHeader className="flex-row items-center justify-between"><div><CardTitle>Admin accounts</CardTitle><CardDescription>Email addresses are managed by Auth and are not exposed through the client profiles table.</CardDescription></div><Dialog open={inviteOpen} onOpenChange={setInviteOpen}><DialogTrigger asChild><Button><Plus className="size-4" /> Invite admin</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Invite admin</DialogTitle><DialogDescription>The invite is sent through the `invite-admin` Edge Function.</DialogDescription></DialogHeader><Form {...inviteForm}><form onSubmit={inviteForm.handleSubmit((values) => save(async () => { await inviteAdmin(values.email, values.full_name); toast.success('Invite request sent.'); inviteForm.reset(); setInviteOpen(false) }))} className="space-y-4"><FormField control={inviteForm.control} name="full_name" render={({ field }) => <FormItem><FormLabel>Full name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} /><FormField control={inviteForm.control} name="email" render={({ field }) => <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>} /><DialogFooter><Button type="submit">Send invite</Button></DialogFooter></form></Form></DialogContent></Dialog></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Joined</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{admins.map((admin) => <TableRow key={admin.id}><TableCell>{admin.full_name}</TableCell><TableCell>{new Date(admin.created_at).toLocaleDateString()}</TableCell><TableCell className="space-x-2 text-right"><Button variant="ghost" size="sm" onClick={() => { setEditing(admin); renameForm.reset({ full_name: admin.full_name }) }}>Edit</Button><Button variant="ghost" size="sm" disabled={admin.id === user?.id} onClick={() => { if (window.confirm(`Remove admin access from ${admin.full_name}?`)) void demoteAdmin(admin.id).then(refreshAdmins).catch((error: unknown) => toast.error(error instanceof Error ? error.message : 'Unable to demote admin.')) }}>Remove admin access</Button></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>}
          {editing && <Dialog open onOpenChange={(open) => { if (!open) setEditing(null) }}><DialogContent><DialogHeader><DialogTitle>Rename admin</DialogTitle></DialogHeader><Form {...renameForm}><form onSubmit={renameForm.handleSubmit((values) => save(async () => { await updateAdminProfile(editing.id, values); await refreshAdmins(); setEditing(null) }))} className="space-y-4"><FormField control={renameForm.control} name="full_name" render={({ field }) => <FormItem><FormLabel>Full name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} /><DialogFooter><Button type="submit">Save name</Button></DialogFooter></form></Form></DialogContent></Dialog>}
          {section === 'Data & Maintenance' && settings && <Card><CardContent className="space-y-6 pt-6"><div className="flex items-center justify-between gap-4"><div><p className="font-medium">Maintenance mode</p><p className="text-sm text-muted-foreground">The customer-facing app will show this message instead of normal pages. Customer-side enforcement is a separate future task.</p></div><Switch checked={maintenance} onCheckedChange={(value) => void updateMaintenance(value)} /></div>{maintenance && <Textarea value={maintenanceMessage} onChange={(event) => setMaintenanceMessage(event.target.value)} placeholder="Maintenance message" />}{maintenance && <Button onClick={() => void updateMaintenance(true)} disabled={saving}>Save maintenance message</Button>}<div className="flex flex-wrap gap-3 border-t pt-5"><Button variant="outline" onClick={() => void getExportRows('vendors').then((rows) => csvDownload('vendors', rows as Record<string, unknown>[])).catch(() => toast.error('Unable to export vendors.'))}><Download className="size-4" /> Export vendors as CSV</Button><Button variant="outline" onClick={() => void getExportRows('orders').then((rows) => csvDownload('orders', rows as Record<string, unknown>[])).catch(() => toast.error('Unable to export orders.'))}><Download className="size-4" /> Export orders as CSV</Button></div></CardContent></Card>}
        </div>
      </div>
    </section>
  )
}
