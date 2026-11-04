import {
  BadgeCheck,
  Building2,
  Check,
  Clock3,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
} from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import type { VendorApplication } from '../../api/vendorOnboarding.api'

export function PendingReviewPage({
  application,
  onRefresh,
  isRefreshing,
}: {
  application: VendorApplication
  onRefresh: () => void
  isRefreshing: boolean
}) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <Card className="overflow-hidden rounded-3xl border-0 bg-white py-0 shadow-xl shadow-emerald-950/5 ring-1 ring-emerald-950/10">
        <div className="h-2 bg-gradient-to-r from-emerald-600 via-emerald-500 to-lime-400" />
        <CardHeader className="items-center px-6 pt-8 text-center sm:px-10 sm:pt-10">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-8 ring-emerald-50/60">
            <BadgeCheck className="size-8" strokeWidth={1.8} />
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-800 uppercase">
            Application received
          </span>
          <h1 className="mt-3 font-heading text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            You’re one step closer!
          </h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-600 sm:text-base">
            Your vendor application was submitted successfully. Our team will
            review your details and update you when a decision is made.
          </p>
        </CardHeader>

        <CardContent className="px-6 pb-8 sm:px-10 sm:pb-10">
          <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200">
                <Building2 className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                  Submitted business
                </p>
                <p className="mt-1 truncate font-semibold text-slate-950">
                  {application.name}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {application.address}
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200/80">
                <Clock3 className="size-3.5" /> In review
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="flex gap-3 rounded-2xl border border-slate-100 p-4">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                <Check className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Submitted</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Your business details are safely with us.
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-2xl border border-slate-100 p-4">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Team review</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  We’ll check your application before your store goes live.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-col items-center gap-3 border-t border-slate-100 pt-6 text-center">
            <p className="text-sm text-slate-600">
              You can check back here for the latest application status.
            </p>
            <Button
              className="w-full sm:w-auto"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={isRefreshing ? 'animate-spin' : ''}
                aria-hidden="true"
              />
              {isRefreshing ? 'Checking status…' : 'Check application status'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
