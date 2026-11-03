import { useState, type ReactNode } from 'react'
import { ArrowLeft, Bike, ChefHat, ShieldCheck, Sparkles, UtensilsCrossed } from 'lucide-react'
import { useNavigate } from 'react-router'
import type { Role } from '@/shared/constants/roles'

const roleContent = {
  customer: {
    label: 'Food lovers',
    title: 'A good meal is closer than you think.',
    detail: 'Find local favourites and follow every order right to your door.',
    Icon: UtensilsCrossed,
    accent: 'bg-[#ffcf84] text-[#552010]',
    tag: 'Discover something delicious',
  },
  rider: {
    label: 'Delivery riders',
    title: 'Make every ride count.',
    detail: 'Pick up local orders, meet your community, and ride on your schedule.',
    Icon: Bike,
    accent: 'bg-sky-200 text-sky-900',
    tag: 'Your next trip starts here',
  },
  vendor: {
    label: 'Restaurant partners',
    title: 'Put your kitchen in the spotlight.',
    detail: 'Reach more hungry customers and grow your restaurant with Chopza.',
    Icon: ChefHat,
    accent: 'bg-orange-200 text-orange-950',
    tag: 'Good food deserves to be found',
  },
  admin: {
    label: 'Chopza team',
    title: 'Keep the whole table running.',
    detail: 'Manage the marketplace and help every order get where it needs to go.',
    Icon: ShieldCheck,
    accent: 'bg-violet-200 text-violet-950',
    tag: 'The Chopza operations desk',
  },
} satisfies Record<Role, { label: string; title: string; detail: string; Icon: typeof Bike; accent: string; tag: string }>

const roles = Object.keys(roleContent) as Role[]

export function AuthPageShell({
  children,
  title,
  subtitle,
  initialRole = 'customer',
}: {
  children: ReactNode
  title: string
  subtitle: string
  initialRole?: Role
}) {
  const navigate = useNavigate()
  const [activeRole, setActiveRole] = useState<Role>(initialRole)
  const scene = roleContent[activeRole]
  const SceneIcon = scene.Icon

  function goBack() {
    if (window.history.length > 1) navigate(-1)
    else navigate('/')
  }

  return (
    <section className="mx-auto flex min-h-[calc(100svh-8rem)] w-full max-w-6xl items-center justify-center py-4 sm:py-8">
      <div className="grid w-full overflow-hidden rounded-3xl border border-border/70 bg-card shadow-xl shadow-foreground/5 md:min-h-[600px] md:grid-cols-[0.95fr_1.05fr] lg:rounded-[2rem]">
        <aside className="relative hidden overflow-hidden bg-[#32140c] p-7 text-[#fff8f3] md:flex md:flex-col md:justify-between lg:p-10">
          <div className="pointer-events-none absolute -left-24 -top-20 size-72 rounded-full bg-[#ff8d4d]/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 size-72 rounded-full bg-[#f6b33f]/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-lg font-black tracking-tight">Chopza<span className="text-[#ffcf84]">.</span><Sparkles className="size-4 text-[#ffcf84]" /></div>
            <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-[#ffc8aa]">Made for Kano</p>
            <h2 className="mt-3 max-w-sm text-3xl font-black leading-tight tracking-tight lg:text-4xl">Good food brings us together.</h2>
          </div>

          <div className="relative my-7 flex flex-1 flex-col justify-center">
            <div className="relative mx-auto grid aspect-square w-full max-w-[250px] place-items-center sm:max-w-[290px]">
              <div className="absolute inset-[8%] rounded-full border border-white/15" />
              <div className="absolute inset-[19%] rounded-full border border-dashed border-white/20" />
              <div className="absolute inset-[29%] rounded-full bg-white/5" />
              <div className={`relative grid size-32 place-items-center rounded-[2rem] shadow-2xl shadow-black/20 ${scene.accent} lg:size-36`}>
                <SceneIcon className="size-16 lg:size-[4.5rem]" strokeWidth={1.7} aria-hidden="true" />
              </div>
              <span className="absolute left-[4%] top-[21%] grid size-12 place-items-center rounded-2xl border border-white/15 bg-white/10 text-white shadow-lg backdrop-blur"><UtensilsCrossed className="size-5" /></span>
              <span className="absolute right-[2%] top-[30%] grid size-12 place-items-center rounded-2xl border border-white/15 bg-white/10 text-white shadow-lg backdrop-blur"><Bike className="size-5" /></span>
              <span className="absolute bottom-[12%] left-[17%] grid size-12 place-items-center rounded-2xl border border-white/15 bg-white/10 text-white shadow-lg backdrop-blur"><ChefHat className="size-5" /></span>
              <span className="absolute bottom-[16%] right-[12%] grid size-12 place-items-center rounded-2xl border border-white/15 bg-white/10 text-white shadow-lg backdrop-blur"><ShieldCheck className="size-5" /></span>
            </div>
            <div className="mx-auto mt-5 max-w-sm text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ffcf84]">{scene.tag}</p>
              <h3 className="mt-2 text-2xl font-bold leading-tight">{scene.title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/70">{scene.detail}</p>
            </div>
          </div>

          <div className="relative grid grid-cols-4 gap-2" aria-label="Explore Chopza roles">
            {roles.map((role) => {
              const { label, Icon } = roleContent[role]
              const selected = role === activeRole
              return (
                <button
                  key={role}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setActiveRole(role)}
                  className={`flex min-w-0 flex-col items-center gap-1.5 rounded-xl border px-1.5 py-2 text-center text-[10px] font-semibold transition-colors lg:text-xs ${selected ? 'border-[#ffcf84]/60 bg-white/15 text-white' : 'border-white/10 bg-white/5 text-white/65 hover:bg-white/10 hover:text-white'}`}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  <span className="truncate">{label}</span>
                </button>
              )
            })}
          </div>
        </aside>

        <div className="flex min-w-0 flex-col p-5 sm:p-8 md:p-7 lg:p-10">
          <button
            type="button"
            onClick={goBack}
            className="mb-7 inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:mb-10"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back
          </button>

          <div className="mx-auto w-full max-w-md flex-1">
            <div className="mb-7 md:mb-8">
              <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary md:hidden"><SceneIcon className="size-6" aria-hidden="true" /></div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Welcome to Chopza</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">{subtitle}</p>
            </div>
            {children}
          </div>
          <p className="mx-auto mt-8 max-w-md text-center text-xs leading-5 text-muted-foreground">By continuing, you agree to use Chopza respectfully and keep your account details secure.</p>
        </div>
      </div>
    </section>
  )
}
