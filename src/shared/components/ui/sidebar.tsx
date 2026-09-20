import * as React from 'react'
import { Menu } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from './button'
import { Sheet, SheetContent } from './sheet'

type SidebarContextValue = { open: boolean; setOpen: (open: boolean) => void; isMobile: boolean }
const SidebarContext = React.createContext<SidebarContextValue | null>(null)

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) throw new Error('useSidebar must be used within SidebarProvider')
  return context
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(true)
  const [isMobile, setIsMobile] = React.useState(false)
  React.useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const update = () => {
      setIsMobile(media.matches)
      if (media.matches) setOpen(false)
    }
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return <SidebarContext.Provider value={{ open, setOpen, isMobile }}>{children}</SidebarContext.Provider>
}

export function Sidebar({ children, className }: { children: React.ReactNode; className?: string }) {
  const { open, setOpen, isMobile } = useSidebar()
  if (isMobile) {
    return <Sheet open={open} onOpenChange={setOpen}><SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground">{children}</SheetContent></Sheet>
  }
  return <aside data-collapsible={open ? 'none' : 'icon'} className={cn('group relative hidden shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:block', open ? 'w-64' : 'w-16', className)}>{children}</aside>
}

export function SidebarTrigger({ className }: { className?: string }) {
  const { open, setOpen } = useSidebar()
  return <Button variant="ghost" size="icon" className={className} onClick={() => setOpen(!open)} aria-label={open ? 'Collapse sidebar' : 'Open sidebar'}><Menu className="size-5" /></Button>
}

export function SidebarHeader({ children, className }: { children: React.ReactNode; className?: string }) { return <div className={cn('p-4', className)}>{children}</div> }
export function SidebarContent({ children, className }: { children: React.ReactNode; className?: string }) { return <div className={cn('flex-1 overflow-y-auto px-3', className)}>{children}</div> }
export function SidebarFooter({ children, className }: { children: React.ReactNode; className?: string }) { return <div className={cn('mt-auto p-3', className)}>{children}</div> }
export function SidebarGroup({ children, className }: { children: React.ReactNode; className?: string }) { return <section className={cn('mb-5', className)}>{children}</section> }
export function SidebarGroupLabel({ children }: { children: React.ReactNode }) { return <h2 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">{children}</h2> }
export function SidebarMenu({ children }: { children: React.ReactNode }) { return <ul className="grid gap-1">{children}</ul> }
export function SidebarMenuItem({ children }: { children: React.ReactNode }) { return <li>{children}</li> }
export function SidebarMenuButton({ children, asChild = false, className, tooltip, onClick }: { children: React.ReactNode; asChild?: boolean; className?: string; tooltip?: string; onClick?: () => void }) {
  const styles = cn('flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-white', className)
  if (asChild && React.isValidElement<{ className?: string; title?: string }>(children)) return React.cloneElement(children, { className: cn(styles, children.props.className), title: tooltip })
  return <button title={tooltip} className={styles} onClick={onClick}>{children}</button>
}
export function SidebarMenuBadge({ children }: { children: React.ReactNode }) { return <span className="ml-auto rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-semibold text-white">{children}</span> }
export function SidebarMenuSub({ children }: { children: React.ReactNode }) { return <ul className="ml-4">{children}</ul> }
export function SidebarMenuSubItem({ children }: { children: React.ReactNode }) { return <li>{children}</li> }
export function SidebarMenuSubButton({ children }: { children: React.ReactNode }) { return <button className="flex w-full items-center gap-2 px-3 py-1 text-sm">{children}</button> }
