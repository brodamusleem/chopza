import { useMemo, useState } from 'react'
import { MoreHorizontal, Plus, Search, Users } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'

const members = [
  { name: 'Chopza Admin', email: 'admin@chopza.com', role: 'Admin', status: 'Active', lastActive: 'Now' },
  { name: 'Amina Yusuf', email: 'amina@chopza.com', role: 'Operations Manager', status: 'Active', lastActive: '8 min ago' },
  { name: 'Ibrahim Musa', email: 'ibrahim@chopza.com', role: 'Dispatcher', status: 'Active', lastActive: '24 min ago' },
  { name: 'Fatima Bello', email: 'fatima@chopza.com', role: 'Support Agent', status: 'Invited', lastActive: 'Pending invite' },
  { name: 'Yusuf Abdullahi', email: 'yusuf@chopza.com', role: 'Finance', status: 'Suspended', lastActive: '3 days ago' },
]

export function AdminTeamsPage() {
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('all')

  const filtered = useMemo(
    () =>
      members.filter(
        (member) =>
          (role === 'all' || member.role === role) &&
          `${member.name} ${member.email}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, role],
  )

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Management</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Teams</h2>
          <p className="mt-2 text-muted-foreground">Manage the people keeping Chopza operations moving.</p>
        </div>
        <Button>
          <Plus className="size-4" /> Add team member
        </Button>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5 text-primary" /> Team members
          </CardTitle>
          <Badge variant="secondary">{members.length} members</Badge>
        </CardHeader>

        <CardContent>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
              <Input
                className="pl-9"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search team members..."
              />
            </div>

            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {['Admin', 'Operations Manager', 'Dispatcher', 'Support Agent', 'Finance'].map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="pb-3 font-medium">Member</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Last active</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((member) => (
                  <tr key={member.email} className="border-b last:border-0">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {member.name
                              .split(' ')
                              .map((part) => part[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <Badge variant="outline">{member.role}</Badge>
                    </td>
                    <td className="py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          member.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : member.status === 'Invited'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>
                    <td className="py-4 text-muted-foreground">{member.lastActive}</td>
                    <td className="py-4 text-right">
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

