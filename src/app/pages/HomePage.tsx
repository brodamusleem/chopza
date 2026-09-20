import { Link } from 'react-router'
import {
  ArrowRight,
  Bike,
  Check,
  Clock3,
  MapPin,
  Store,
  Truck,
  UtensilsCrossed,
} from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'

const roles = [
  {
    icon: UtensilsCrossed,
    title: 'Foodies',
    text: 'Browse restaurants across Kano and order in a few taps.',
    action: 'Sign up to order',
    href: '/register',
  },
  {
    icon: Store,
    title: 'Vendors',
    text: 'List your restaurant and reach more customers across the city.',
    action: 'Register your restaurant',
    href: '/register/vendor',
  },
  {
    icon: Bike,
    title: 'Riders',
    text: 'Earn by delivering orders on your own schedule.',
    action: 'Become a rider',
    href: '/register/rider',
  },
]

export function Component() {
  return (
    <div className="space-y-20 pb-8">
      <section className="relative overflow-hidden rounded-3xl bg-primary px-6 py-14 text-primary-foreground sm:px-12 sm:py-20 lg:px-16">
        <div className="pointer-events-none absolute -right-16 -bottom-24 size-72 rounded-full border-[36px] border-amber-300/25" />
        <div className="relative max-w-3xl">
          <Badge className="mb-6 border-amber-200/30 bg-amber-300 text-green-950">
            <MapPin aria-hidden="true" /> Built for Kano
          </Badge>
          <h1 className="max-w-2xl text-4xl leading-[1.05] font-bold tracking-tight sm:text-6xl">
            Food to your doorstep, tracked live.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-primary-foreground/80 sm:text-lg">
            Order from restaurants across Kano in one app, then follow your
            delivery in real time from kitchen to door.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="bg-amber-300 text-green-950 hover:bg-amber-200">
              <Link to="/register">
                Order food <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Link to="/register/vendor">Register as a vendor</Link>
            </Button>
            <Button asChild variant="link" className="text-primary-foreground/80 hover:text-primary-foreground">
              <Link to="/register/rider">Register as a rider</Link>
            </Button>
          </div>
        </div>
      </section>

      <section aria-labelledby="roles-heading">
        <div className="mb-7 max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Find your place at Chopza</p>
          <h2 id="roles-heading" className="mt-2 text-3xl font-semibold tracking-tight">One platform, three ways in.</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {roles.map(({ icon: Icon, title, text, action, href }) => (
            <Card key={title} className="h-full">
              <CardHeader>
                <Icon className="mb-3 size-7 text-primary" aria-hidden="true" />
                <CardTitle className="text-xl">{title}</CardTitle>
              </CardHeader>
              <CardContent className="flex h-full flex-col">
                <p className="min-h-14 leading-6 text-muted-foreground">{text}</p>
                <Button asChild variant="outline" className="mt-6 w-full">
                  <Link to={href}>{action} <ArrowRight aria-hidden="true" /></Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="how-heading" className="border-y py-12">
        <div className="mb-8 max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">How it works</p>
          <h2 id="how-heading" className="mt-2 text-3xl font-semibold tracking-tight">From craving to doorstep.</h2>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            { number: '01', icon: UtensilsCrossed, title: 'Browse & order', text: 'Choose a meal from your favourite local kitchen.' },
            { number: '02', icon: UtensilsCrossed, title: 'Your food is prepared', text: 'The restaurant gets cooking while you stay updated.' },
            { number: '03', icon: Truck, title: 'Track to your door', text: 'Follow your rider live until your order arrives.' },
          ].map(({ number, icon: Icon, title, text }) => (
            <div key={number} className="relative flex gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-primary">{number}</div>
              <div>
                <Icon className="mb-3 size-5 text-primary" aria-hidden="true" />
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="why-heading">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Why Chopza</p>
            <h2 id="why-heading" className="mt-2 text-3xl font-semibold tracking-tight">Local food, with fewer question marks.</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              { icon: Store, title: 'One app, many kitchens' },
              { icon: Clock3, title: 'Live rider tracking' },
              { icon: MapPin, title: 'Made for Kano' },
            ].map(({ icon: Icon, title }) => (
              <div key={title} className="border-l-2 border-primary/30 pl-4">
                <Icon className="mb-4 size-6 text-primary" aria-hidden="true" />
                <p className="font-medium leading-6">{title}</p>
                <Check className="mt-5 size-4 text-primary" aria-hidden="true" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="flex flex-col gap-5 border-t pt-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-foreground">chopza<span className="text-amber-500">.</span></p>
          <p className="mt-1">Good food. Right here in Kano.</p>
        </div>
        <nav aria-label="Footer navigation" className="flex gap-5">
          <a href="#about" className="hover:text-foreground">About</a>
          <a href="#contact" className="hover:text-foreground">Contact</a>
          <a href="#terms" className="hover:text-foreground">Terms</a>
        </nav>
      </footer>
    </div>
  )
}
