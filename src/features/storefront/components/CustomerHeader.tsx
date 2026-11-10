import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import {
  ArrowRight,
  BadgeCheck,
  Beef,
  CakeSlice,
  ChevronDown,
  Coffee,
  BookmarkPlus,
  CheckCircle2,
  Flame,
  Heart,
  LogOut,
  LocateFixed,
  MapPin,
  Menu,
  Pizza,
  Search,
  ShoppingBag,
  ShoppingCart,
  Soup,
  Store,
  UtensilsCrossed,
  UserRound,
} from 'lucide-react'
import { logout, useAuth } from '@/features/auth'
import { useCart } from '@/features/ordering/hooks/useCart'
import { ModeToggle } from '@/shared/components/ModeToggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet'
import { toast } from 'sonner'
import { getAvailableDishes, type SearchDish } from '../api'
import { useStorefront } from '../context'
import { useDeliveryArea, useDeliveryLocation, type DeliveryLocation } from '../state'
import { CustomerLocationMap } from './CustomerLocationMap'

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
  const deliveryLocation = useDeliveryLocation()
  const { items } = useCart()
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const navigate = useNavigate()
  const location = useLocation()
  const searchRef = useRef<HTMLInputElement>(null)
  const [addressOpen, setAddressOpen] = useState(false)
  const [addressQuery, setAddressQuery] = useState('')
  const [locationError, setLocationError] = useState('')
  const [deliveryPin, setDeliveryPin] = useState<[number, number] | null>(null)
  const [locating, setLocating] = useState(false)
  const [savedAddresses, setSavedAddresses] = useState<DeliveryLocation[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [dishes, setDishes] = useState<SearchDish[]>([])
  const [dishError, setDishError] = useState<Error | null>(null)

  const selectedArea = areas.find((area) => area.id === areaId)
  const matchingAreas = areas.filter((area) => area.name.toLocaleLowerCase().includes(addressQuery.trim().toLocaleLowerCase()))
  const matchingVendors = addressQuery.trim()
    ? vendors.filter((vendor) => `${vendor.name} ${vendor.address}`.toLocaleLowerCase().includes(addressQuery.trim().toLocaleLowerCase())).slice(0, 4)
    : []
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
      setAddressOpen(true)
    }
  }, [areaId, areas.length])

  useEffect(() => {
    if (!user) {
      setSavedAddresses([])
      return
    }
    try {
      const value = localStorage.getItem(`chopza-saved-addresses-${user.id}`)
      const parsed: unknown = value ? JSON.parse(value) : []
      setSavedAddresses(Array.isArray(parsed)
        ? parsed.flatMap((item): DeliveryLocation[] => {
            if (typeof item === 'string') return [{ address: item, latitude: null, longitude: null }]
            if (!item || typeof item !== 'object' || !('address' in item) || typeof item.address !== 'string') return []
            return [{
              address: item.address,
              latitude: 'latitude' in item && typeof item.latitude === 'number' ? item.latitude : null,
              longitude: 'longitude' in item && typeof item.longitude === 'number' ? item.longitude : null,
            }]
          })
        : [])
    } catch {
      setSavedAddresses([])
    }
  }, [user?.id])

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

  function chooseArea(areaIdValue: string | null, address: string) {
    setAreaId(areaIdValue)
    deliveryLocation.setLocation({ address, latitude: null, longitude: null })
    setDeliveryPin(null)
    setAddressOpen(false)
    setLocationError('')
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationError('Location is unavailable in this browser. Enter your address instead.')
      return
    }
    setLocating(true)
    setLocationError('')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const address = `Current location (${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)})`
        setAreaId(null)
        setDeliveryPin([coords.latitude, coords.longitude])
        deliveryLocation.setLocation({ address, latitude: coords.latitude, longitude: coords.longitude })
        setAddressQuery('')
        setLocating(false)
        setAddressOpen(false)
      },
      () => {
        setLocationError('We could not access your location. Allow location access or enter an address manually.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }

  function saveAddress() {
    if (!deliveryLocation.address) {
      setAddressOpen(true)
      setLocationError('Choose or enter a delivery address first.')
      return
    }
    if (!user) {
      navigate('/login', { state: { message: 'Sign in to save this delivery address.', role: 'customer' } })
      setAddressOpen(false)
      return
    }
    const nextAddresses = [deliveryLocation, ...savedAddresses.filter((saved) => saved.address !== deliveryLocation.address)]
    try {
      localStorage.setItem(`chopza-saved-addresses-${user.id}`, JSON.stringify(nextAddresses))
      setSavedAddresses(nextAddresses)
      toast.success('Delivery address saved on this device.')
    } catch {
      toast.error('Unable to save this address on this device.')
    }
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
    <>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-3 pt-3 sm:px-5">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-[1.4rem] border border-border/70 bg-card/95 p-2 shadow-lg shadow-primary/5 sm:flex sm:gap-3 sm:rounded-full sm:px-4 sm:py-2">
          <Link to="/explore" className="flex min-w-0 items-center gap-2 rounded-full px-1.5 focus-visible:outline-2 focus-visible:outline-primary" aria-label={`${appName} explore`}>
            {settings?.logo_url ? <img src={settings.logo_url} alt="" className="size-8 rounded-full object-cover" /> : <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><UtensilsCrossed className="size-4" /></span>}
            <span className="max-w-24 truncate text-sm font-bold sm:max-w-32">{appName}</span>
          </Link>

          <Dialog open={addressOpen} onOpenChange={(open) => {
            setAddressOpen(open)
            if (open) {
              setAddressQuery(deliveryLocation.address)
              setDeliveryPin(
                deliveryLocation.latitude !== null && deliveryLocation.longitude !== null
                  ? [deliveryLocation.latitude, deliveryLocation.longitude]
                  : null,
              )
              setLocationError('')
            }
          }}>
            <Button variant="ghost" onClick={() => {
              setAddressQuery(deliveryLocation.address)
              setLocationError('')
              setAddressOpen(true)
            }} className="h-10 min-w-0 justify-start gap-2 rounded-full px-2 sm:min-w-40 sm:px-3">
              <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="min-w-0 text-left leading-tight">
                <span className="hidden text-[9px] font-bold tracking-[0.12em] text-muted-foreground sm:block">DELIVERY TO</span>
                <span className="block max-w-24 truncate text-xs font-semibold sm:max-w-40 sm:text-sm">{deliveryLocation.address || selectedArea?.name || 'Choose address'}</span>
              </span>
              <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
            </Button>
            <DialogContent className="top-auto bottom-0 left-0 max-h-[90dvh] w-full max-w-none translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-t-3xl p-0 sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
              <DialogHeader className="border-b px-5 pb-4 pt-6 sm:px-7 sm:pt-7">
                <DialogTitle className="text-2xl font-bold tracking-tight">Delivery address</DialogTitle>
                <DialogDescription>Choose where you want your order delivered.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 overflow-y-auto px-5 py-5 sm:px-7">
                <form onSubmit={(event) => {
                  event.preventDefault()
                  const address = addressQuery.trim()
                  if (address.length < 5) {
                    setLocationError('Enter a more complete delivery address.')
                    return
                  }
                  if (!deliveryPin) {
                    setLocationError('Drop a pin on the map to find restaurants near this address.')
                    return
                  }
                  setAreaId(null)
                  deliveryLocation.setLocation({ address, latitude: deliveryPin[0], longitude: deliveryPin[1] })
                  setAddressOpen(false)
                  setLocationError('')
                }} className="relative">
                  <Search aria-hidden="true" className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-emerald-700" />
                  <Input
                    value={addressQuery}
                    onChange={(event) => {
                      setAddressQuery(event.target.value)
                      if (event.target.value.trim() !== deliveryLocation.address)
                        setDeliveryPin(null)
                      setLocationError('')
                    }}
                    placeholder="Enter a new address"
                    aria-label="Enter a delivery address"
                    className="h-14 rounded-2xl border-0 bg-muted/70 pl-12 pr-4 text-sm focus-visible:ring-emerald-600"
                  />
                </form>

                <button type="button" onClick={useCurrentLocation} disabled={locating} className="flex w-full items-start gap-3 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-emerald-50 disabled:opacity-60 dark:hover:bg-emerald-950/30">
                  <LocateFixed className="mt-0.5 size-5 shrink-0 text-emerald-700" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-emerald-700">{locating ? 'Finding your location…' : 'Use your current location'}</span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">{deliveryLocation.latitude !== null && deliveryLocation.longitude !== null ? `${deliveryLocation.latitude.toFixed(4)}, ${deliveryLocation.longitude.toFixed(4)}` : 'Use GPS or pin the map to find restaurants near you.'}</span>
                  </span>
                </button>
                {locationError && <p role="alert" className="rounded-xl bg-destructive/5 px-3 py-2 text-sm text-destructive">{locationError}</p>}

                <section className="space-y-2 border-t pt-4">
                  <div>
                    <p className="text-sm font-semibold">Pin your delivery location</p>
                    <p className="text-xs text-muted-foreground">Tap the map where you are. Nearby restaurants are selected from this pin.</p>
                  </div>
                  <CustomerLocationMap
                    pin={deliveryPin}
                    onPin={(pin) => {
                      setDeliveryPin(pin)
                      if (!addressQuery.trim())
                        setAddressQuery(`Pinned location (${pin[0].toFixed(5)}, ${pin[1].toFixed(5)})`)
                      setAreaId(null)
                      setLocationError('')
                    }}
                  />
                </section>

                {savedAddresses.length > 0 && (
                  <section className="space-y-1 border-t pt-3">
                    <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Saved addresses</p>
                    {savedAddresses.map((address) => <button key={address.address} type="button" onClick={() => {
                      if (address.latitude === null || address.longitude === null) {
                        setAddressQuery(address.address)
                        setDeliveryPin(null)
                        setLocationError('Pin this saved address on the map to find restaurants nearby.')
                        return
                      }
                      setAreaId(null)
                      deliveryLocation.setLocation(address)
                      setDeliveryPin([address.latitude, address.longitude])
                      setAddressOpen(false)
                    }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-accent"><MapPin className="size-4 shrink-0 text-muted-foreground" /><span className="truncate">{address.address}</span></button>)}
                  </section>
                )}

                {(matchingVendors.length > 0 || matchingAreas.length > 0) && (
                  <section className="max-h-48 space-y-1 overflow-y-auto border-t pt-3">
                    <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Suggested addresses and areas</p>
                    {matchingVendors.map((vendor) => <button key={vendor.id} type="button" onClick={() => chooseArea(vendor.service_area_id, vendor.address)} className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-accent"><MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><span className="min-w-0"><span className="block truncate text-sm font-medium">{vendor.address}</span><span className="block truncate text-xs text-muted-foreground">{vendor.name}</span></span></button>)}
                    {matchingAreas.map((area) => <button key={area.id} type="button" onClick={() => chooseArea(area.id, `${area.name}, Kano, Nigeria`)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-accent"><MapPin className="size-4 shrink-0 text-muted-foreground" /><span className="flex-1 text-sm">{area.name}, Kano</span>{area.id === areaId && <CheckCircle2 className="size-4 text-emerald-700" />}</button>)}
                  </section>
                )}

                <div className="flex items-center justify-between gap-3 border-t pt-4">
                  <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><BookmarkPlus className="size-4" />Save new address</span>
                  {user ? <Button type="button" variant="secondary" className="rounded-full text-emerald-800" onClick={saveAddress}>Save address <ArrowRight className="size-4" /></Button> : <Button type="button" variant="secondary" className="rounded-full text-emerald-800" onClick={saveAddress}>Log in to save <ArrowRight className="size-4" /></Button>}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <div className="hidden min-w-52 flex-1 sm:block">{searchControl}</div>

          <div className="flex items-center justify-end gap-1 sm:gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full sm:hidden"
              aria-label="Open navigation menu"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu aria-hidden="true" />
            </Button>
            <Button asChild variant="ghost" size="icon" className="hidden rounded-full sm:inline-flex" aria-label="Favourites">
              <Link to="/favorites"><Heart aria-hidden="true" /></Link>
            </Button>
            <Button asChild className="h-10 rounded-full bg-primary px-3 text-primary-foreground hover:bg-primary/90 sm:px-4" aria-label={`Cart${cartCount ? `, ${cartCount} items` : ''}`}>
              <Link to="/cart"><ShoppingCart aria-hidden="true" /><span className="hidden sm:inline">Cart</span>{cartCount > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-primary-foreground px-1 text-xs font-bold text-primary">{cartCount}</span>}</Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="hidden h-10 gap-2 rounded-full px-1.5 sm:flex sm:px-2" aria-label="Open account menu">
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

        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-[min(20rem,85vw)] max-w-sm gap-0 p-0 sm:hidden">
            <SheetHeader className="border-b px-5 py-5">
              <SheetTitle className="text-left text-lg font-bold">{appName}</SheetTitle>
              <p className="text-sm text-muted-foreground">Find restaurants and manage your orders.</p>
            </SheetHeader>
            <nav aria-label="Mobile navigation" className="flex flex-col gap-1 p-3">
              {[
                { label: 'Explore restaurants', to: '/explore', icon: Store },
                { label: 'Favourites', to: '/favorites', icon: Heart },
                { label: 'My orders', to: '/orders', icon: ShoppingBag },
                { label: 'Account settings', to: '/account', icon: Menu },
                { label: 'Cart', to: '/cart', icon: ShoppingCart },
              ].map(({ label, to, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-accent"
                >
                  <Icon className="size-5 text-primary" aria-hidden="true" />{label}
                </Link>
              ))}
              {user ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    void logout().catch((cause: unknown) => toast.error(cause instanceof Error ? cause.message : 'Unable to sign out.'))
                  }}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium hover:bg-accent"
                >
                  <LogOut className="size-5 text-primary" aria-hidden="true" />Sign out
                </button>
              ) : (
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-accent">
                  Sign in
                </Link>
              )}
            </nav>
          </SheetContent>
        </Sheet>

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

      </header>
      <nav aria-label="Customer navigation" className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-border/70 bg-background px-2 pt-1.5 pb-[max(.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.04)] sm:hidden">
        <BottomNavLink to="/explore" label="Home" icon={Store} active={location.pathname.startsWith('/explore')} />
        <BottomNavLink to="/favorites" label="Favorites" icon={Heart} active={location.pathname.startsWith('/favorites')} />
        <BottomNavLink to="/cart" label="Cart" icon={ShoppingCart} active={location.pathname.startsWith('/cart')} badge={cartCount} />
        <BottomNavLink to="/account" label="Profile" icon={UserRound} active={location.pathname.startsWith('/account')} />
      </nav>
    </>
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
  badge,
}: {
  to: string
  label: string
  icon: typeof Store
  active: boolean
  badge?: number
}) {
  return (
    <Link to={to} aria-current={active ? 'page' : undefined} className={`flex min-h-12 flex-col items-center justify-center gap-0.5 py-1 text-[10px] transition-colors focus-visible:outline-2 focus-visible:outline-primary ${active ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
      <span className="relative">
        <Icon className="size-5" aria-hidden="true" />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1.5 -right-2 grid min-h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-primary-foreground">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </span>
      {label}
    </Link>
  )
}
