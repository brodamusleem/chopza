import * as React from 'react'
import { AlertDialog as AlertDialogPrimitive } from 'radix-ui'
import { cn } from '@/shared/lib/utils'
import { buttonVariants } from '@/shared/components/ui/button'

function AlertDialog(props: React.ComponentProps<typeof AlertDialogPrimitive.Root>) { return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} /> }
function AlertDialogTrigger(props: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) { return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} /> }
function AlertDialogPortal(props: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) { return <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} /> }
function AlertDialogOverlay({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) { return <AlertDialogPrimitive.Overlay data-slot="alert-dialog-overlay" className={cn('fixed inset-0 z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs', className)} {...props} /> }
function AlertDialogContent({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Content>) { return <AlertDialogPortal><AlertDialogOverlay /><AlertDialogPrimitive.Content data-slot="alert-dialog-content" className={cn('fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-6 text-popover-foreground shadow-lg ring-1 ring-foreground/10 sm:max-w-sm', className)} {...props} /></AlertDialogPortal> }
function AlertDialogHeader(props: React.ComponentProps<'div'>) { return <div data-slot="alert-dialog-header" className="flex flex-col gap-2" {...props} /> }
function AlertDialogFooter(props: React.ComponentProps<'div'>) { return <div data-slot="alert-dialog-footer" className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end" {...props} /> }
function AlertDialogTitle(props: React.ComponentProps<typeof AlertDialogPrimitive.Title>) { return <AlertDialogPrimitive.Title data-slot="alert-dialog-title" className="font-heading text-base font-medium" {...props} /> }
function AlertDialogDescription(props: React.ComponentProps<typeof AlertDialogPrimitive.Description>) { return <AlertDialogPrimitive.Description data-slot="alert-dialog-description" className="text-sm text-muted-foreground" {...props} /> }
function AlertDialogAction({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Action>) { return <AlertDialogPrimitive.Action data-slot="alert-dialog-action" className={cn(buttonVariants(), className)} {...props} /> }
function AlertDialogCancel({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) { return <AlertDialogPrimitive.Cancel data-slot="alert-dialog-cancel" className={cn(buttonVariants({ variant: 'outline' }), className)} {...props} /> }

export { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, AlertDialogPortal, AlertDialogTitle, AlertDialogTrigger }
