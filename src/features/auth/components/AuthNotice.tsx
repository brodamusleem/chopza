import type { ReactNode } from 'react'
import { CircleAlert, CircleCheck } from 'lucide-react'

export function AuthNotice({
  children,
  variant,
}: {
  children: ReactNode
  variant: 'error' | 'success'
}) {
  const isError = variant === 'error'
  const Icon = isError ? CircleAlert : CircleCheck

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-xl border p-3.5 text-sm leading-5 ${
        isError
          ? 'border-destructive/20 bg-destructive/5 text-destructive'
          : 'border-emerald-600/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
      }`}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  )
}
