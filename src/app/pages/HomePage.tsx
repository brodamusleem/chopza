import { Link } from 'react-router'
import {
  ArrowRight,
  Bike,
  MapPin,
  Sparkles,
  Store,
  Timer,
  UtensilsCrossed,
} from 'lucide-react'
import { AnimatedGreeting } from '@/app/components/AnimatedGreeting'
import { PublicFaq } from '@/app/components/PublicFaq'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'

const foodImages = [
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85',
]

const roles = [
  {
    icon: UtensilsCrossed,
    title: 'Hungry?',
    text: 'Find a meal worth getting excited about.',
    action: 'Start ordering',
    href: '/explore',
  },
  {
    icon: Store,
    title: 'Own a kitchen?',
    text: 'Put your menu in front of new customers.',
    action: 'For vendors',
    href: '/vendors',
  },
  {
    icon: Bike,
    title: 'Ready to ride?',
    text: 'Deliver on a schedule that fits your day.',
    action: 'For riders',
    href: '/riders',
  },
]

const steps = [
  {
    icon: UtensilsCrossed,
    number: '01',
    title: 'Pick your craving',
    text: 'Find local restaurants and meals you feel like having.',
  },
  {
    icon: Timer,
    number: '02',
    title: 'Place your order',
    text: 'Send your order to the kitchen in a few taps.',
  },
  {
    icon: Bike,
    number: '03',
    title: 'Watch it come home',
    text: 'Follow your rider live, right up to your door.',
  },
]

export function Component() {
  return (
    <div className="space-y-16 pb-8 sm:space-y-24 sm:pb-10 lg:space-y-32">
      <section className="hero-shine relative isolate overflow-hidden rounded-3xl bg-[#32140c] px-4 py-8 text-[#fff8f3] sm:rounded-[2rem] sm:px-10 sm:py-16 lg:px-14 lg:py-20">
        <div className="absolute -top-24 -left-16 size-72 rounded-full bg-[#ff8d4d]/30 blur-3xl" />
        <div className="absolute right-0 bottom-0 size-80 rounded-full bg-[#f6b33f]/15 blur-3xl" />
        <div className="relative grid gap-8 sm:gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div className="max-w-2xl">
            <Badge className="mb-5 max-w-full border-0 bg-[#ffdd70] px-3 py-1 text-xs leading-5 text-[#4a2108] sm:mb-7 sm:text-sm">
              <MapPin aria-hidden="true" /> Kano’s local food delivery spot
            </Badge>
            <p className="mb-4 text-sm font-bold tracking-[0.18em] text-[#ffc8aa] uppercase">
              Your next good meal is nearby
            </p>
            <h1 className="text-4xl leading-[0.98] font-black tracking-[-0.06em] sm:text-6xl lg:text-7xl">
              <AnimatedGreeting />
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#f7d9ca] sm:mt-7 sm:text-lg sm:leading-8">
              From familiar favourites to something new, Chopza brings Kano’s
              kitchens closer—with live tracking from the first stir to your
              doorstep.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:flex-wrap">
              <Button
                asChild
                size="lg"
                className="h-11 w-full rounded-full bg-[#ffdd70] px-5 text-[#3b180d] hover:bg-[#ffe89d] sm:w-auto sm:px-6"
              >
                <Link to="/explore">
                  Order food <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-11 w-full rounded-full border-[#fff8f3]/25 bg-transparent text-[#fff8f3] hover:bg-white/10 hover:text-white sm:w-auto"
              >
                <Link to="/vendors">List your restaurant</Link>
              </Button>
            </div>
          </div>
          <div className="relative mx-auto h-[270px] w-full max-w-[320px] sm:h-[400px] sm:max-w-md lg:h-[430px]">
            <div className="float-gentle absolute top-0 left-2 h-[72%] w-[64%] overflow-hidden rounded-[2rem] border-4 border-[#fff8f3]/90 shadow-2xl">
              <img
                src={foodImages[0]}
                alt="Fresh pizza ready to enjoy"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="float-slow absolute right-0 bottom-2 h-[56%] w-[54%] overflow-hidden rounded-[2rem] border-4 border-[#fff8f3]/90 shadow-2xl">
              <img
                src={foodImages[1]}
                alt="Colourful prepared meal"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute top-[52%] left-[7%] rounded-2xl bg-[#fff8f3] px-4 py-3 text-[#3b180d] shadow-xl">
              <p className="text-xs font-bold text-primary">TRACKED LIVE</p>
              <p className="mt-1 flex items-center gap-1 text-sm font-bold">
                <span className="size-2 animate-pulse rounded-full bg-[#e75c28]" />{' '}
                On its way to you
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        className="grid gap-4 sm:gap-5 md:grid-cols-3"
        aria-label="Chopza audiences"
      >
        {roles.map(({ icon: Icon, title, text, action, href }) => (
          <Link
            key={title}
            to={href}
            className="group rounded-2xl border bg-card p-5 transition duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 sm:rounded-[1.5rem] sm:p-6"
          >
            <Icon className="mb-5 size-7 text-primary sm:mb-8 sm:size-8" aria-hidden="true" />
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            <p className="mt-2 leading-6 text-muted-foreground">{text}</p>
            <span className="mt-7 inline-flex items-center gap-2 font-bold text-primary">
              {action}{' '}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </section>

      <section className="grid gap-7 sm:gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
            Made to feel local
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] sm:mt-4 sm:text-5xl">
            Food discovery, without the guesswork.
          </h2>
          <p className="mt-5 max-w-md leading-7 text-muted-foreground">
            Explore what is cooking around Kano, order with confidence, and know
            where your food is every step of the way.
          </p>
          <Button asChild variant="link" className="mt-5 px-0 text-primary">
            <Link to="/company">
              Why Chopza exists <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          <img
            src={foodImages[2]}
            alt="Warm bowl of food"
            className="float-slow h-56 w-full rounded-3xl object-cover shadow-lg sm:mt-8 sm:h-80 sm:rounded-[2rem]"
          />
          <div className="rounded-3xl bg-secondary p-6 sm:rounded-[2rem] sm:p-8">
            <Sparkles className="size-8 text-primary" aria-hidden="true" />
            <p className="mt-8 text-xl font-bold leading-tight sm:mt-12">
              Made for the places and flavours Kano calls home.
            </p>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              One simple platform for customers, restaurants, and riders.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-foreground px-5 py-9 text-background sm:rounded-[2rem] sm:px-10 sm:py-16">
        <div className="max-w-xl">
          <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
            Simple from start to finish
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] sm:text-4xl">
            A better way to get dinner sorted.
          </h2>
        </div>
        <div className="mt-8 grid gap-6 sm:mt-12 sm:gap-8 md:grid-cols-3">
          {steps.map(({ icon: Icon, number, title, text }) => (
            <div key={number} className="border-t border-background/20 pt-5">
              <div className="flex items-center justify-between">
                <Icon className="size-6 text-primary" />
                <span className="font-mono text-sm text-background/45">
                  {number}
                </span>
              </div>
              <h3 className="mt-5 text-xl font-bold sm:mt-8">{title}</h3>
              <p className="mt-2 leading-6 text-background/65">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 sm:gap-8 lg:grid-cols-2">
        <div className="rounded-3xl bg-[#ffcf84] p-6 sm:rounded-[2rem] sm:p-10">
          <p className="text-xs font-bold tracking-[0.2em] text-[#61300d] uppercase">
            For food lovers
          </p>
          <h2 className="mt-3 text-2xl font-black tracking-[-0.05em] text-[#3b180d] sm:text-3xl">
            Your new favourite meal might be one tap away.
          </h2>
          <Button
            asChild
            className="mt-8 rounded-full bg-[#3b180d] text-white hover:bg-[#552010]"
          >
            <Link to="/explore">
              Explore Chopza <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <div className="rounded-3xl bg-primary p-6 text-primary-foreground sm:rounded-[2rem] sm:p-10">
          <p className="text-xs font-bold tracking-[0.2em] text-primary-foreground/70 uppercase">
            For local businesses
          </p>
          <h2 className="mt-3 text-2xl font-black tracking-[-0.05em] sm:text-3xl">
            Turn every hungry scroll into a possible order.
          </h2>
          <Button
            asChild
            variant="outline"
            className="mt-8 rounded-full border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
          >
            <Link to="/vendors">
              Meet your vendor tools <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>

      <PublicFaq
        title="Ordering should feel easy."
        items={[
          {
            question: 'Where is Chopza available?',
            answer:
              'Chopza is built around Kano and is currently growing its local restaurant network there.',
          },
          {
            question: 'Can I track my order?',
            answer:
              'Yes. Once an order is out for delivery, the tracking flow is designed to show its live delivery progress.',
          },
          {
            question: 'How can my restaurant join?',
            answer:
              'Visit the Vendors page to see the available tools, then use the application form to start onboarding.',
          },
        ]}
      />
    </div>
  )
}
