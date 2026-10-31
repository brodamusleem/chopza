import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth'
import { Button } from '@/shared/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { toast } from 'sonner'
import {
  getRiderApplication,
  getRiderProfile,
  updateRiderApplication,
  updateRiderProfile,
} from '../api/rider.api'

export function Component() {
  const { user } = useAuth()
  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
    avatar_url: '',
  })
  const [rider, setRider] = useState({
    id: '',
    vehicle_type: 'Bicycle',
    plate_number: '',
  })
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    if (!user) return
    void Promise.all([getRiderProfile(user.id), getRiderApplication(user.id)])
      .then(([nextProfile, application]) => {
        if (nextProfile)
          setProfile({
            full_name: nextProfile.full_name,
            phone: nextProfile.phone ?? '',
            avatar_url: nextProfile.avatar_url ?? '',
          })
        if (application)
          setRider({
            id: application.id,
            vehicle_type: application.vehicle_type,
            plate_number: application.plate_number ?? '',
          })
      })
      .catch(() => toast.error('Unable to load profile settings.'))
  }, [user])
  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!user || !profile.full_name.trim()) return
    if (rider.vehicle_type !== 'Bicycle' && !rider.plate_number.trim()) {
      toast.error('Enter a plate number for this vehicle.')
      return
    }
    setSaving(true)
    try {
      await updateRiderProfile(user.id, profile)
      if (rider.id) await updateRiderApplication(rider.id, rider)
      toast.success('Profile settings saved.')
    } catch {
      toast.error('Unable to save profile settings.')
    } finally {
      setSaving(false)
    }
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Profile & settings</h1>
        <p className="text-muted-foreground">
          Manage your rider profile and vehicle details.
        </p>
      </div>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Profile details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={save}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rider-name">Full name</Label>
                <Input
                  id="rider-name"
                  value={profile.full_name}
                  onChange={(event) =>
                    setProfile({ ...profile, full_name: event.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rider-phone">Phone</Label>
                <Input
                  id="rider-phone"
                  value={profile.phone}
                  onChange={(event) =>
                    setProfile({ ...profile, phone: event.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rider-avatar">Avatar URL</Label>
              <Input
                id="rider-avatar"
                type="url"
                value={profile.avatar_url}
                onChange={(event) =>
                  setProfile({ ...profile, avatar_url: event.target.value })
                }
                placeholder="https://…"
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Vehicle type</Label>
                <Select
                  value={rider.vehicle_type}
                  onValueChange={(vehicle_type) =>
                    setRider({ ...rider, vehicle_type })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['Bicycle', 'Motorcycle', 'Car', 'Tricycle/Keke'].map(
                      (type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rider-plate">Plate number</Label>
                <Input
                  id="rider-plate"
                  value={rider.plate_number}
                  onChange={(event) =>
                    setRider({ ...rider, plate_number: event.target.value })
                  }
                  placeholder="Optional for bicycles"
                />
              </div>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
