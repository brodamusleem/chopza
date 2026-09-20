import * as React from 'react'
import { cn } from '@/shared/lib/utils'

export function Switch({ className, checked, onCheckedChange, disabled, ...props }: {
  className?: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
} & Omit<React.ComponentProps<'button'>, 'onChange'>) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn('relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50', checked ? 'bg-primary' : 'bg-muted', className)}
      {...props}
    >
      <span className={cn('pointer-events-none block size-5 rounded-full bg-background shadow transition-transform', checked ? 'translate-x-5' : 'translate-x-0')} />
    </button>
  )
}
