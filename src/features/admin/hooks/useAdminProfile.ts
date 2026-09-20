import { useEffect, useState } from 'react'
import { getProfile } from '@/features/auth/api/auth.api'
import { useAuth } from '@/features/auth'

export function useAdminProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<{ full_name: string; avatar_url: string | null } | null>(null)
  useEffect(() => {
    if (!user) return
    void getProfile(user.id).then(setProfile).catch(() => setProfile(null))
  }, [user])
  return profile
}