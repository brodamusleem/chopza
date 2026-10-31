import { Link } from 'react-router'
import { ArrowRight, MapPinned, Radio, ListChecks } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { PublicFaq } from '@/app/components/PublicFaq'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'

const features = [
  {
    icon: Radio,
    title: 'Go online when you want',
    text: 'Use the online and offline toggle to decide when you are available for deliveries.',
  },
  {
    icon: ListChecks,
    title: 'Pick your jobs',
    text: 'See available deliveries in the jobs queue and take the ones that work for you.',
  },
  {
    icon: MapPinned,
    title: 'Live navigation & tracking',
    text: 'Use the active delivery flow to share your location while an order is on the move.',
  },
]

export function Component() {
  return (
    <div className="space-y-16 pb-8">
      <section className="rounded-3xl bg-primary px-6 py-14 text-primary-foreground sm:px-12 sm:py-20">
        <Badge className="mb-6 bg-amber-300 text-green-950">
          For riders in Kano
        </Badge>
        <h1 className="max-w-3xl text-4xl leading-tight font-bold tracking-tight sm:text-6xl">
          Earn on a schedule that works for you.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-primary-foreground/80">
          Deliver food across Kano with flexible work that fits around your day.
        </p>
        <Button
          asChild
          size="lg"
          className="mt-8 bg-amber-300 text-green-950 hover:bg-amber-200"
        >
          <Link to="/register/rider">
            Become a rider <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </section>
      <section aria-labelledby="rider-tools">
        <div className="mb-8 max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Made for the road
          </p>
          <h2
            id="rider-tools"
            className="mt-2 text-3xl font-semibold tracking-tight"
          >
            Stay in control of every delivery.
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <Card key={title} className="h-full">
              <CardHeader>
                <Icon className="mb-3 size-7 text-primary" aria-hidden="true" />
                <CardTitle className="text-xl">{title}</CardTitle>
              </CardHeader>
              <CardContent className="leading-6 text-muted-foreground">
                {text}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <section className="flex flex-col items-start justify-between gap-5 rounded-2xl border bg-card p-8 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-semibold">Ready to start delivering?</h2>
          <p className="mt-2 text-muted-foreground">
            Apply to ride with Chopza and take the next step.
          </p>
        </div>
        <Button asChild size="lg">
          <Link to="/register/rider">
            Become a rider <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </section>
      <PublicFaq
        eyebrow="Rider FAQ"
        title="Questions from people ready to ride."
        items={[
          {
            question: 'Can I choose when to work?',
            answer:
              'Yes. The rider experience includes an online and offline toggle, so you can set your availability when you are ready for deliveries.',
          },
          {
            question: 'How do I get deliveries?',
            answer:
              'Available deliveries appear in the jobs queue. You can see the jobs available and take the ones that work for you.',
          },
          {
            question: 'How do I apply?',
            answer:
              'Choose “Become a rider” to open the existing rider registration form and start your application.',
          },
        ]}
      />
    </div>
  )
}
