import { Link } from 'react-router'
import { ArrowRight, BarChart3, ClipboardList, CookingPot } from 'lucide-react'
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
    icon: CookingPot,
    title: 'Manage your menu',
    text: 'Add and edit menu items, set prices, and toggle availability when dishes run out.',
  },
  {
    icon: ClipboardList,
    title: 'Track orders live',
    text: 'See incoming orders in one queue and update their status as your kitchen prepares them.',
  },
  {
    icon: BarChart3,
    title: 'One dashboard for your business',
    text: 'Keep your restaurant profile, settings, and dashboard information together.',
  },
]

export function Component() {
  return (
    <div className="space-y-16 pb-8">
      <section className="rounded-3xl bg-secondary px-6 py-14 sm:px-12 sm:py-20">
        <Badge
          variant="outline"
          className="mb-6 border-primary/25 text-primary"
        >
          For restaurants in Kano
        </Badge>
        <h1 className="max-w-3xl text-4xl leading-tight font-bold tracking-tight sm:text-6xl">
          Sell more food. Reach more Kano customers.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          Reach customers across Kano through one platform and manage the
          essentials from one dashboard.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link to="/register/vendor">
            Start selling on Chopza <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </section>
      <section aria-labelledby="vendor-tools">
        <div className="mb-8 max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Built for the daily work
          </p>
          <h2
            id="vendor-tools"
            className="mt-2 text-3xl font-semibold tracking-tight"
          >
            Tools your restaurant can use today.
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
          <h2 className="text-2xl font-semibold">
            Ready to put your kitchen on Chopza?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Complete the vendor application to get started.
          </p>
        </div>
        <Button asChild size="lg">
          <Link to="/register/vendor">
            Start selling on Chopza <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </section>
      <PublicFaq
        eyebrow="Vendor FAQ"
        title="Questions from restaurant owners."
        items={[
          {
            question: 'Can I update my menu myself?',
            answer:
              'Yes. The vendor tools let you add and edit menu items, adjust prices, and toggle availability when an item is unavailable.',
          },
          {
            question: 'Where do I manage incoming orders?',
            answer:
              'Your vendor dashboard includes an order queue, where you can see incoming orders and update their progress.',
          },
          {
            question: 'How do I start?',
            answer:
              'Select “Start selling on Chopza” to complete the vendor registration form. The team can then review your application.',
          },
        ]}
      />
    </div>
  )
}
