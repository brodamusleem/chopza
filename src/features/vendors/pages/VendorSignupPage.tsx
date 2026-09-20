import { Link } from 'react-router'
import { SignupForm } from '@/features/auth'
export function Component() { return <section className="mx-auto max-w-md rounded-2xl border bg-card p-7"><h1 className="mb-2 text-3xl font-semibold">Sell on Chopza</h1><p className="mb-7 text-muted-foreground">Create an account to submit your restaurant for review.</p><SignupForm role="vendor" redirectTo="/vendor/onboarding" /><Link className="mt-5 block text-sm underline" to="/login">Already have an account? Sign in</Link></section> }
