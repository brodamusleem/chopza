import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'

export class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  state = { hasError: false, error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Unhandled application error', error, info) }
  render() {
    if (!this.state.hasError) return this.props.children
    return <main className="mx-auto max-w-xl px-5 py-16"><Card role="alert"><CardHeader><CardTitle>Something went wrong</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-muted-foreground">The page could not be displayed. Reload the page to try again.</p>{this.state.error?.message && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{this.state.error.message}</p>}<Button onClick={() => window.location.reload()}>Reload page</Button></CardContent></Card></main>
  }
}
