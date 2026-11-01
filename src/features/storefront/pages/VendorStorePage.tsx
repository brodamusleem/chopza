import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import {
  BadgeCheck,
  Heart,
  LockKeyhole,
  Minus,
  Plus,
  RotateCw,
  ShoppingCart,
  UtensilsCrossed,
} from 'lucide-react'
import { useCart } from '@/features/ordering/hooks/useCart'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { formatNaira } from '@/shared/lib/currency'
import { getMenuForVendor, getVendorById } from '../api'
import type { StorefrontVendor } from '../api'
import { useFavoriteToggle } from '../hooks'
import { useStorefront } from '../context'
import { useFavoriteState } from '../state'

type MenuRow = Awaited<ReturnType<typeof getMenuForVendor>>[number]

export function Component() {
  const { vendorId = '' } = useParams()
  const { settings } = useStorefront()
  const [vendor, setVendor] = useState<StorefrontVendor | null>(null)
  const [menu, setMenu] = useState<MenuRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [retryToken, setRetryToken] = useState(0)
  const [activeCategory, setActiveCategory] = useState('')

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setError(null)
    Promise.all([getVendorById(vendorId), getMenuForVendor(vendorId)])
      .then(([loadedVendor, loadedMenu]) => {
        if (!active) return
        setVendor(loadedVendor)
        setMenu(loadedMenu)
      })
      .catch((cause: unknown) => {
        if (active)
          setError(cause instanceof Error ? cause : new Error('Unable to load this restaurant.'))
      })
      .finally(() => active && setIsLoading(false))
    return () => {
      active = false
    }
  }, [vendorId, retryToken])

  const sections = useMemo(() => {
    const groups = new Map<string, MenuRow[]>()
    for (const item of menu) {
      const name = item.category?.trim() || 'Other'
      groups.set(name, [...(groups.get(name) ?? []), item])
    }
    return [...groups.entries()].sort(([left], [right]) => left.localeCompare(right))
  }, [menu])
  const categoryNames = sections.map(([name]) => name)
  const cart = useCart()
  const currentVendorItems = vendor ? cart.items.filter((item) => item.vendorId === vendor.id) : []
  const otherVendorCount = vendor ? cart.groups.filter((group) => group.vendorId !== vendor.id).length : 0
  const currentSubtotal = currentVendorItems.reduce((sum, item) => sum + item.unitPriceKobo * item.quantity, 0)
  const isClosed = vendor ? !vendor.is_open : false

  useEffect(() => {
    if (!categoryNames.length) return
    if (!activeCategory || !categoryNames.includes(activeCategory)) setActiveCategory(categoryNames[0])
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        const name = visible?.target.getAttribute('data-menu-category')
        if (name) setActiveCategory(name)
      },
      { rootMargin: '-25% 0px -65% 0px' },
    )
    for (const name of categoryNames) {
      const section = document.getElementById(categoryId(name))
      if (section) observer.observe(section)
    }
    return () => observer.disconnect()
  }, [categoryNames.join('|'), activeCategory])

  if (isLoading)
    return <div role="status" className="space-y-4 py-8"><div className="h-64 animate-pulse rounded-3xl bg-muted" /><div className="h-8 w-1/2 animate-pulse rounded bg-muted" /><div className="h-28 animate-pulse rounded-2xl bg-muted" /></div>
  if (error)
    return <div className="mx-auto max-w-xl rounded-2xl border p-8 text-center"><h1 className="text-xl font-semibold">Couldn’t load restaurant</h1><p role="alert" className="mt-2 text-sm text-muted-foreground">{error.message}</p><Button className="mt-5" onClick={() => setRetryToken((value) => value + 1)}><RotateCw />Retry</Button></div>
  if (!vendor)
    return <div className="py-14 text-center"><h1 className="text-2xl font-semibold">Restaurant not found</h1><Button asChild variant="link" className="mt-3"><Link to="/explore">Back to explore</Link></Button></div>

  return (
    <div className="pb-28 pt-5 sm:pb-12 sm:pt-8">
      <Link to="/explore" className="mb-4 inline-flex text-sm text-muted-foreground hover:text-foreground">← Back to restaurants</Link>
      <section className="relative overflow-hidden rounded-3xl border bg-card">
        <div className="relative aspect-[2.3/1] min-h-48 max-h-[26rem] bg-primary/10">
          {vendor.cover_url || vendor.logo_url ? (
            <img src={vendor.cover_url || vendor.logo_url || ''} alt={`${vendor.name} cover`} className={`size-full object-cover ${isClosed ? 'grayscale' : ''}`} />
          ) : (
            <div className="grid size-full place-items-center bg-primary/10 text-primary"><UtensilsCrossed className="size-12" aria-hidden="true" /></div>
          )}
          {isClosed && <div className="absolute inset-0 grid place-items-center bg-background/55"><span className="rounded-full bg-background/90 px-5 py-2 font-semibold"><LockKeyhole className="mr-2 inline size-4" />CLOSED</span></div>}
        </div>
        <div className="relative flex flex-col gap-4 px-5 pb-5 pt-12 sm:flex-row sm:items-end sm:justify-between sm:px-8">
          <div className="absolute -top-10 left-5 size-20 overflow-hidden rounded-2xl border-4 border-card bg-secondary shadow sm:left-8">
            {vendor.logo_url ? <img src={vendor.logo_url} alt={`${vendor.name} logo`} className="size-full object-cover" /> : <span className="grid size-full place-items-center text-2xl font-semibold text-primary">{vendor.name.slice(0, 1)}</span>}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold sm:text-3xl">{vendor.name}</h1>
              <span title="Approved by Chopza" aria-label="Approved by Chopza"><BadgeCheck className="size-5 text-primary" /></span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${vendor.is_open ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{vendor.is_open ? 'Open' : 'Closed'}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{vendor.cuisine || 'Restaurant'}{vendor.areaName ? ` · ${vendor.areaName}` : ''} · {vendor.address}</p>
            {settings && <p className="mt-1 text-sm text-muted-foreground">Delivery fee {formatNaira(Math.round(Number(settings.base_delivery_fee) * 100))}</p>}
          </div>
          <FavoriteButton vendor={vendor} />
        </div>
      </section>

      {isClosed && <div className="mt-5 rounded-2xl border border-border bg-muted/70 px-4 py-3 text-sm font-medium">This restaurant is closed right now. You can browse the menu, but ordering is disabled.</div>}

      <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="min-w-0">
          <nav aria-label="Menu categories" className="sticky top-[12.5rem] z-20 -mx-3 mb-6 overflow-x-auto border-b bg-background/95 px-3 backdrop-blur sm:top-[9.5rem] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max gap-2">
              {categoryNames.map((name) => <button key={name} onClick={() => scrollToCategory(name)} aria-current={activeCategory === name ? 'true' : undefined} className={`relative px-3 py-3 text-sm ${activeCategory === name ? 'font-semibold text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-primary' : 'text-muted-foreground'}`}>{name}</button>)}
            </div>
          </nav>
          {sections.length ? sections.map(([name, items]) => (
            <section key={name} id={categoryId(name)} data-menu-category={name} className="mb-9 scroll-mt-64">
              <h2 className="mb-3 text-xl font-semibold">{name}</h2>
              <div className="space-y-3">
                {items.map((item) => <MenuItemRow key={item.id} item={item} vendor={vendor} isClosed={isClosed} />)}
              </div>
            </section>
          )) : <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">This restaurant has not added menu items yet.</div>}
        </div>

        <aside className="hidden lg:block">
          <CartSummary vendor={vendor} items={currentVendorItems} subtotal={currentSubtotal} otherVendorCount={otherVendorCount} isClosed={isClosed} />
        </aside>
      </div>

      <div className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 lg:hidden">
        <Button asChild disabled={!currentVendorItems.length || isClosed} className="h-14 w-full justify-between rounded-2xl px-5 shadow-xl">
          <Link to="/cart"><span className="flex items-center gap-2"><ShoppingCart aria-hidden="true" />View cart ({currentVendorItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span><span>{formatNaira(currentSubtotal)}</span></Link>
        </Button>
      </div>
    </div>
  )
}

function FavoriteButton({ vendor }: { vendor: StorefrontVendor }) {
  const favoriteIds = useFavoriteState((state) => state.vendorIds)
  const { user, toggle } = useFavoriteToggle()
  const [saving, setSaving] = useState(false)
  const favorite = favoriteIds.includes(vendor.id)
  return (
    <Button
      variant="outline"
      disabled={saving}
      aria-label={favorite ? `Remove ${vendor.name} from favourites` : `Add ${vendor.name} to favourites`}
      aria-pressed={favorite}
      className="w-fit rounded-full"
      onClick={() => {
        if (!user) { window.location.assign('/login'); return }
        setSaving(true)
        void toggle(vendor.id).finally(() => setSaving(false))
      }}
    ><Heart className={favorite ? 'fill-primary text-primary' : ''} />{favorite ? 'Saved' : 'Save'}</Button>
  )
}

function MenuItemRow({ item, vendor, isClosed }: { item: MenuRow; vendor: StorefrontVendor; isClosed: boolean }) {
  const { items, addItem, setQuantity } = useCart()
  const cartItem = items.find((entry) => entry.vendorId === vendor.id && entry.menuItemId === item.id)
  const available = item.is_available && !isClosed
  const priceKobo = Math.round(Number(item.price) * 100)
  return (
    <Card className={`rounded-2xl ${item.is_available ? '' : 'opacity-60'}`}>
      <CardContent className="flex items-center gap-4 p-4 sm:p-5">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">{item.name}</h3>
          {item.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>}
          <p className="mt-3 font-semibold">{formatNaira(priceKobo)}</p>
          {!item.is_available && <p className="mt-1 text-xs font-medium text-muted-foreground">Unavailable</p>}
        </div>
        {item.image_url && <img src={item.image_url} alt="" loading="lazy" className="size-20 shrink-0 rounded-xl object-cover sm:size-24" />}
        {cartItem && item.is_available ? (
          <div className="flex shrink-0 items-center gap-1 rounded-full border p-1">
            <Button variant="ghost" size="icon" aria-label={`Remove one ${item.name}`} onClick={() => setQuantity(vendor.id, item.id, cartItem.quantity - 1)}><Minus /></Button>
            <span className="min-w-6 text-center text-sm font-semibold">{cartItem.quantity}</span>
            <Button variant="ghost" size="icon" aria-label={`Add one ${item.name}`} disabled={isClosed} onClick={() => addItem({ menuItemId: item.id, vendorId: vendor.id, vendorName: vendor.name, name: item.name, unitPriceKobo: priceKobo })}><Plus /></Button>
          </div>
        ) : (
          <Button aria-label={`Add ${item.name} to cart`} disabled={!available} className="shrink-0 rounded-full" onClick={() => addItem({ menuItemId: item.id, vendorId: vendor.id, vendorName: vendor.name, name: item.name, unitPriceKobo: priceKobo })}><Plus /><span className="hidden sm:inline">Add</span></Button>
        )}
      </CardContent>
    </Card>
  )
}

function CartSummary({ vendor, items, subtotal, otherVendorCount, isClosed }: { vendor: StorefrontVendor; items: ReturnType<typeof useCart>['items']; subtotal: number; otherVendorCount: number; isClosed: boolean }) {
  return (
    <Card className="sticky top-52 rounded-2xl">
      <CardHeader><CardTitle>Your order</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {items.length ? <div className="space-y-3">{items.map((item) => <div key={item.menuItemId} className="flex justify-between gap-3 text-sm"><span className="min-w-0 truncate">{item.quantity} × {item.name}</span><span className="shrink-0">{formatNaira(item.unitPriceKobo * item.quantity)}</span></div>)}</div> : <p className="text-sm text-muted-foreground">Add a menu item to start your order.</p>}
        {otherVendorCount > 0 && <p className="rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">Your cart also has items from {otherVendorCount} other restaurant{otherVendorCount === 1 ? '' : 's'}.</p>}
        <div className="flex justify-between border-t pt-3 font-semibold"><span>Subtotal</span><span>{formatNaira(subtotal)}</span></div>
        <Button asChild disabled={!items.length || isClosed} className="w-full rounded-full"><Link to="/cart">{isClosed ? 'Ordering unavailable while closed' : 'View cart and checkout'}</Link></Button>
        {isClosed && <p className="text-xs text-muted-foreground">{vendor.name} is closed and can’t accept this order right now.</p>}
      </CardContent>
    </Card>
  )
}

function categoryId(name: string) {
  return `menu-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
}

function scrollToCategory(name: string) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.getElementById(categoryId(name))?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })
}
