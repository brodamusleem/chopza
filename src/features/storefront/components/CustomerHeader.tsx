import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import {
  BadgeCheck,
  Beef,
  CakeSlice,
  ChevronDown,
  Coffee,
  Flame,
  Heart,
  LogOut,
  MapPin,
  Menu,
  Pizza,
  Search,
  ShoppingBag,
  ShoppingCart,
  Soup,
  Store,
  UtensilsCrossed,
} from 'lucide-react'
import { logout, useAuth } from '@/features/auth'
import { useCart } from '@/features/ordering/hooks/useCart'
import { ModeToggle } from '@/shared/components/ModeToggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { Input } from '@/shared/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/shared/components/ui/popover'
import { toast } from 'sonner'
import { getAvailableDishes, type SearchDish } from '../api'
import { useStorefront } from '../context'
import { useDeliveryArea } from '../state'

const CATEGORY_ICONS = [
  { match: 'local', icon: Soup },
  { match: 'rice', icon: Soup },
  { match: 'grill', icon: Flame },
  { match: 'suya', icon: Beef },
  { match: 'fast', icon: Pizza },
  { match: 'shawarma', icon: UtensilsCrossed },
  { match: 'wrap', icon: UtensilsCrossed },
  { match: 'bakery', icon: CakeSlice },
  { match: 'snack', icon: CakeSlice },
  { match: 'drink', icon: Coffee },
  { match: 'smoothie', icon: Coffee },
]

function getCuisineIcon(cuisine: string) {
  const match = CATEGORY_ICONS.find(({ match: key }) =>
    cuisine.toLocaleLowerCase().includes(key),
  )
  return match?.icon ?? UtensilsCrossed
}

export function CustomerHeader() {
  const { user } = useAuth()
  const { areas, settings, vendors } = useStorefront()
  const areaId = useDeliveryArea((state) => state.areaId)
  const setAreaId = useDeliveryArea((state) => state.setAreaId)
  const { items } = useCart()
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const navigate = useNavigate()
  const location = useLocation()
  const searchRef = useRef<HTMLInputElement>(null)
  const [areaOpen, setAreaOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [dishes, setDishes] = useState<SearchDish[]>([])
  const [dishError, setDishError] = useState<Error | null>(null)

  const selectedArea = areas.find((area) => area.id === areaId)
  const cuisines = useMemo(
    () =>
      [...new Set(vendors.map((vendor) => vendor.cuisine?.trim()).filter((item): item is string => Boolean(item)))].sort((a, b) => a.localeCompare(b)),
    [vendors],
  )
  const restaurants = useMemo(() => {
    const term = debounced.toLocaleLowerCase()
    return term
      ? vendors.filter(
          (vendor) =>
            vendor.name.toLocaleLowerCase().includes(term) ||
            vendor.cuisine?.toLocaleLowerCase().includes(term),
        ).slice(0, 5)
      : []
  }, [debounced, vendors])

  useEffect(() => {
    const current = new URLSearchParams(location.search).get('q') ?? ''
    setSearch(current)
  }, [location.pathname, location.search])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(search.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (!debounced) {
      setDishes([])
      setDishError(null)
      return
    }
    let active = true
    getAvailableDishes(debounced, vendors.map((vendor) => vendor.id))
      .then((rows) => active && setDishes(rows))
      .catch((cause: unknown) => {
        if (active) {
          setDishError(
            cause instanceof Error ? cause : new Error('Unable to search dishes.'),
          )
          setDishes([])
        }
      })
    return () => {
      active = false
    }
  }, [debounced, vendors])

  useEffect(() => {
    if (!areaId && areas.length && !localStorage.getItem('chopza-area-picker-shown')) {
      localStorage.setItem('chopza-area-picker-shown', 'true')
      setAreaOpen(true)
    }
  }, [areaId, areas.length])

  useEffect(() => {
    const focusSearch = () => {
      searchRef.current?.focus()
      setSearchOpen(true)
    }
    window.addEventListener('customer-search-focus', focusSearch)
    return () => window.removeEventListener('customer-search-focus', focusSearch)
  }, [])

  const appName = settings?.app_name?.trim() || 'Chopza'
  const avatarUrl = typeof user?.user_metadata.avatar_url === 'string'
    ? user.user_metadata.avatar_url
    : undefined
  const metadataName = user?.user_metadata.full_name
  const accountName = typeof metadataName === 'string' ? metadataName : user?.email ?? 'Account'
  const initials = accountName.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'C'

  function openExplore(query = search) {
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    navigate(`/explore${params.size ? `?${params.toString()}` : ''}`)
    setSearchOpen(false)
  }

  const searchControl = (
    <div className="relative w-full">
      <div className="relative">
        <Search aria-hidden="true" className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={searchRef}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onFocus={() => setSearchOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') openExplore()
            if (event.key === 'Escape') setSearchOpen(false)
          }}
          placeholder="Search restaurants or dishes"
          aria-label="Search restaurants or dishes"
          aria-expanded={searchOpen && Boolean(debounced)}
          className="h-10 rounded-full border-border/70 bg-muted/60 pr-4 pl-10"
        />
      </div>
      {searchOpen && debounced && (
        <div
          className="absolute top-[calc(100%+0.5rem)] right-0 left-0 z-50 max-h-[min(70vh,30rem)] overflow-y-auto rounded-2xl border bg-popover p-3 text-popover-foreground shadow-xl"
          onMouseDown={(event) => event.preventDefault()}
        >
          <div className="flex items-center justify-between px-2 py-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Restaurants</p>
            <button className="text-xs font-medium text-primary" onClick={() => openExplore()}>See all</button>
          </div>
          {restaurants.length ? restaurants.map((vendor) => (
            <Link
              key={vendor.id}
              to={`/explore/vendors/${vendor.id}`}
              onClick={() => setSearchOpen(false)}
              className="flex items-center gap-3 rounded-xl p-2 hover:bg-accent focus-visible:outline-2 focus-visible:outline-primary"
            >
              <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-secondary text-primary">
                {vendor.cover_url || vendor.logo_url ? <img src={vendor.cover_url || vendor.logo_url || ''} alt="" className="size-full object-cover" /> : vendor.name.slice(0, 1)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{vendor.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{vendor.cuisine || 'Restaurant'}</span>
              </span>
              <BadgeCheck className="size-4 text-primary" aria-label="Approved by Chopza" />
            </Link>
          )) : <p className="px-2 py-2 text-sm text-muted-foreground">No matching restaurants.</p>}
          <div className="mt-2 border-t pt-2">
            <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dishes</p>
            {dishError ? <p role="alert" className="px-2 py-2 text-sm text-destructive">{dishError.message}</p> : dishes.length ? dishes.map((dish) => {
              const vendor = vendors.find((item) => item.id === dish.vendor_id)
              return (
                <Link
                  key={dish.id}
                  to={`/explore/vendors/${dish.vendor_id}`}
                  onClick={() => setSearchOpen(false)}
                  className="flex items-center justify-between gap-3 rounded-xl p-2 hover:bg-accent"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{dish.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{vendor?.name}</span>
                  </span>
                  <span className="shrink-0 text-sm">{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(Number(dish.price))}</span>
                </Link>
              )
            }) : <p className="px-2 py-2 text-sm text-muted-foreground">No matching dishes.</p>}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-3 pt-3 sm:px-5">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-[1.4rem] border border-border/70 bg-card/95 p-2 shadow-lg shadow-primary/5 sm:flex sm:gap-3 sm:rounded-full sm:px-4 sm:py-2">
          <Link to="/explore" className="flex min-w-0 items-center gap-2 rounded-full px-1.5 focus-visible:outline-2 focus-visible:outline-primary" aria-label={`${appName} explore`}>
            {settings?.logo_url ? <img src={settings.logo_url} alt="" className="size-8 rounded-full object-cover" /> : <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><UtensilsCrossed className="size-4" /></span>}
            <span className="max-w-24 truncate text-sm font-bold sm:max-w-32">{appName}</span>
          </Link>

          <Popover open={areaOpen} onOpenChange={setAreaOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="h-10 min-w-0 justify-start gap-2 rounded-full px-2 sm:min-w-40 sm:px-3">
                <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="min-w-0 text-left leading-tight">
                  <span className="hidden text-[9px] font-bold tracking-[0.12em] text-muted-foreground sm:block">DELIVERY TO</span>
                  <span className="block max-w-24 truncate text-xs font-semibold sm:max-w-32 sm:text-sm">{selectedArea?.name ?? 'All of Kano'}</span>
                </span>
                <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 rounded-2xl p-2">
              <PopoverHeader className="px-2 py-1">
                <PopoverTitle>Choose your delivery area</PopoverTitle>
              </PopoverHeader>
              <button onClick={() => { setAreaId(null); setAreaOpen(false) }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-accent">
                <MapPin className="size-4 text-primary" />
                <span className="flex-1 text-sm">All of Kano</span>
                {!areaId && <span className="text-xs font-medium text-primary">Selected</span>}
              </button>
              {areas.map((area) => (
                <button key={area.id} onClick={() => { setAreaId(area.id); setAreaOpen(false) }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-accent">
                  <MapPin className="size-4 text-muted-foreground" />
                  <span className="flex-1 text-sm">{area.name}</span>
                  {areaId === area.id && <span className="text-xs font-medium text-primary">Selected</span>}
                </button>
              ))}
              {!areas.length && <p className="px-3 py-2 text-xs text-muted-foreground">No active service areas are available.</p>}
            </PopoverContent>
          </Popover>

          <div className="hidden min-w-52 flex-1 sm:block">{searchControl}</div>

          <div className="flex items-center justify-end gap-1 sm:gap-2">
            <Button asChild variant="ghost" size="icon" className="hidden rounded-full sm:inline-flex" aria-label="Favourites">
              <Link to="/favorites"><Heart aria-hidden="true" /></Link>
            </Button>
            <Button asChild className="h-10 rounded-full bg-primary px-3 text-primary-foreground hover:bg-primary/90 sm:px-4" aria-label={`Cart${cartCount ? `, ${cartCount} items` : ''}`}>
              <Link to="/cart"><ShoppingCart aria-hidden="true" /><span className="hidden sm:inline">Cart</span>{cartCount > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-primary-foreground px-1 text-xs font-bold text-primary">{cartCount}</span>}</Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 gap-2 rounded-full px-1.5 sm:px-2" aria-label="Open account menu">
                  <Avatar className="size-8">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="bg-secondary text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <Menu className="hidden size-4 text-muted-foreground sm:block" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl">
                <DropdownMenuLabel className="truncate">{user ? accountName : 'Welcome to Chopza'}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/orders"><ShoppingBag />My orders</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/favorites"><Heart />Favourites</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/account">Account settings</Link></DropdownMenuItem>
                <DropdownMenuItem className="cursor-default" onSelect={(event) => event.preventDefault()}><ModeToggle /></DropdownMenuItem>
                <DropdownMenuSeparator />
                {user ? (
                  <DropdownMenuItem onSelect={(event) => { event.preventDefault(); void logout().catch((cause: unknown) => toast.error(cause instanceof Error ? cause.message : 'Unable to sign out.')) }}>
                    <LogOut />Sign out
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem asChild><Link to="/login">Sign in</Link></DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="relative mt-2 sm:hidden">{searchControl}</div>

        <nav aria-label="Restaurant categories" className="mt-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max items-center gap-2">
            <CategoryButton label="Browse all" active={!new URLSearchParams(location.search).has('cuisine')} onClick={() => openExplore('')} icon={UtensilsCrossed} />
            {cuisines.map((cuisine) => (
              <CategoryButton
                key={cuisine}
                label={cuisine}
                active={new URLSearchParams(location.search).get('cuisine') === cuisine}
                icon={getCuisineIcon(cuisine)}
                onClick={() => navigate(`/explore?cuisine=${encodeURIComponent(cuisine)}`)}
              />
            ))}
          </div>
        </nav>
      </div>

      <nav aria-label="Customer navigation" className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t bg-background/95 px-2 pt-2 pb-[max(.5rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:hidden">
        <BottomNavLink to="/explore" label="Explore" icon={Store} active={location.pathname === '/explore'} />
        <button onClick={() => { navigate('/explore'); window.dispatchEvent(new Event('customer-search-focus')) }} className="flex flex-col items-center gap-1 py-1 text-xs text-muted-foreground focus-visible:outline-2 focus-visible:outline-primary">
          <Search className="size-5" aria-hidden="true" /><span>Search</span>
        </button>
        <BottomNavLink to="/favorites" label="Favourites" icon={Heart} active={location.pathname === '/favorites'} />
        <BottomNavLink to="/orders" label="Orders" icon={ShoppingBag} active={location.pathname.startsWith('/orders')} />
        <BottomNavLink to="/account" label="Account" icon={Menu} active={location.pathname === '/account'} />
      </nav>
    </header>
  )
}

function CategoryButton({
  label,
  active,
  icon: Icon,
  onClick,
}: {
  label: string
  active: boolean
  icon: typeof UtensilsCrossed
  onClick: () => void
}) {
  return (
    <button onClick={onClick} aria-pressed={active} className={`relative inline-flex h-11 items-center gap-2 px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-primary ${active ? 'font-semibold text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-primary' : 'text-muted-foreground hover:text-foreground'}`}>
      <Icon className="size-4" aria-hidden="true" />{label}
    </button>
  )
}

function BottomNavLink({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string
  label: string
  icon: typeof Store
  active: boolean
}) {
  return (
    <Link to={to} aria-current={active ? 'page' : undefined} className={`flex flex-col items-center gap-1 py-1 text-xs ${active ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
      <Icon className="size-5" aria-hidden="true" />{label}
    </Link>
  )
}
