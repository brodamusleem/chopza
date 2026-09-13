import { Link } from 'react-router'
import { ArrowRight, Bike, MapPin, Store } from 'lucide-react'
export function Component() {
  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl bg-primary px-7 py-14 text-primary-foreground sm:px-12 sm:py-20">
        <p className="mb-5 flex items-center gap-2 text-sm font-medium">
          <MapPin size={16} aria-hidden="true" />
          Good food. Right here in Kano.
        </p>
        <h1 className="max-w-2xl text-4xl leading-tight font-bold tracking-tight sm:text-6xl">
          Your favourites,
          <br />
          from kitchen to doorstep.
        </h1>
        <p className="mt-6 max-w-lg text-lg opacity-85">
          Discover local kitchens, build your perfect order, and follow your
          delivery all the way home.
        </p>
        <Link
          to="/vendors"
          className="mt-8 inline-flex items-center gap-3 rounded-xl bg-amber-300 px-6 py-3 font-semibold text-green-950"
        >
          Explore restaurants
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>
      <section>
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Simple from the start
          </p>
          <h2 className="mt-2 text-3xl font-semibold">
            A little closer to your next meal.
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Store,
              title: 'Find your flavour',
              text: 'Explore sample menus inspired by Kano’s local food scene.',
            },
            {
              icon: Bike,
              title: 'One cart, more choice',
              text: 'Add dishes from different kitchens, grouped neatly by restaurant.',
            },
            {
              icon: MapPin,
              title: 'Follow every step',
              text: 'Live rider locations and order updates, ready for backend connection.',
            },
          ].map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-2xl border bg-card p-6">
              <Icon
                className="mb-5 text-primary"
                size={26}
                aria-hidden="true"
              />
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {text}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
