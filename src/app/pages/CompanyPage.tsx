import { Link } from 'react-router'
import { ArrowRight, Mail, MapPin, Route } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { PublicFaq } from '@/app/components/PublicFaq'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'

export function Component() {
  return (
    <div className="space-y-16 pb-8">
      <section className="rounded-3xl bg-primary px-6 py-14 text-primary-foreground sm:px-12 sm:py-20">
        <Badge className="mb-6 bg-amber-300 text-green-950">
          <MapPin aria-hidden="true" /> Built for Kano
        </Badge>
        <h1 className="max-w-3xl text-4xl leading-tight font-bold tracking-tight sm:text-6xl">
          Making local food delivery feel close to home.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-primary-foreground/80">
          Chopza connects Kano restaurants and customers through one simple
          platform, with live delivery tracking from kitchen to doorstep.
        </p>
      </section>

      <section
        className="grid gap-8 lg:grid-cols-2"
        aria-labelledby="why-we-exist"
      >
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Why we exist
          </p>
          <h2
            id="why-we-exist"
            className="mt-2 text-3xl font-semibold tracking-tight"
          >
            Kano deserves a service made with its streets in mind.
          </h2>
        </div>
        <div className="space-y-4 leading-7 text-muted-foreground">
          <p>
            Major delivery platforms have not yet made Kano their home. Chopza
            is a student project exploring a practical, local-first way for
            people to discover nearby restaurants and follow their orders
            clearly.
          </p>
          <p>
            We are still early and currently onboarding restaurants across Kano.
            That means listening closely, keeping the experience useful, and
            growing responsibly.
          </p>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <Route className="mb-2 size-7 text-primary" aria-hidden="true" />
            <CardTitle>One clear delivery journey</CardTitle>
          </CardHeader>
          <CardContent className="leading-6 text-muted-foreground">
            From choosing a meal to seeing it on the way, Chopza keeps the order
            journey in one place.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Mail className="mb-2 size-7 text-primary" aria-hidden="true" />
            <CardTitle>Get in touch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 leading-6 text-muted-foreground">
            <p>
              Questions, feedback, or a restaurant you would like to see on
              Chopza? We would love to hear from you.
            </p>
            <Button asChild variant="outline">
              <a href="mailto:hello@chopza.example">
                Email Chopza <ArrowRight aria-hidden="true" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </section>

      <Button asChild size="lg">
        <Link to="/register">
          Order food <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
      <PublicFaq
        title="About Chopza"
        items={[
          {
            question: 'Is Chopza already operating across Kano?',
            answer:
              'Chopza is an early student project focused on building and testing a useful delivery experience for Kano. Restaurants are currently being onboarded.',
          },
          {
            question: 'What makes Chopza different?',
            answer:
              'It is designed around a local delivery journey: nearby restaurants, a clear order flow, and live rider tracking.',
          },
          {
            question: 'How can I share feedback?',
            answer:
              'You can reach the team through the contact link on this page. Feedback from Kano residents and businesses helps shape the project.',
          },
        ]}
      />
    </div>
  )
}
