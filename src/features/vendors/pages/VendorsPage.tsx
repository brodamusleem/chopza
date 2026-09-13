import { VendorList } from '../components/VendorList'
export function Component() {
  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          Explore Kano
        </p>
        <h1 className="mt-2 text-3xl font-semibold">What are you craving?</h1>
        <p className="mt-3 text-muted-foreground">
          Sample restaurants and menus to explore the ordering experience.
        </p>
      </div>
      <VendorList />
    </div>
  )
}
