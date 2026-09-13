import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
export function RouteError() {
  const error = useRouteError()
  return (
    <main className="mx-auto max-w-xl space-y-4 p-10">
      <h1 className="text-2xl font-semibold">
        {isRouteErrorResponse(error) && error.status === 404
          ? 'Page not found'
          : 'Something went wrong'}
      </h1>
      <p>Try reloading the page or return to the home page.</p>
      <Link className="underline" to="/">
        Back to Chopza
      </Link>
    </main>
  )
}
