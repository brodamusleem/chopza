const lagosDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Africa/Lagos',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
export function dayKey(date: Date) {
  const parts = lagosDate.formatToParts(date)
  return ['year', 'month', 'day']
    .map((type) => parts.find((part) => part.type === type)?.value)
    .join('-')
}
export function startOfLagosDay(key: string) {
  return new Date(`${key}T00:00:00+01:00`).toISOString()
}
export function nextDay(key: string) {
  return new Date(Date.parse(`${key}T12:00:00Z`) + 86400000)
    .toISOString()
    .slice(0, 10)
}
export function calendarDayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export function sevenDayKeys(now = new Date()) {
  const today = dayKey(now)
  return Array.from({ length: 7 }, (_, index) =>
    new Date(Date.parse(`${today}T12:00:00Z`) - (6 - index) * 86400000)
      .toISOString()
      .slice(0, 10),
  )
}
export function countOrdersPerDay(
  rows: { created_at: string }[],
  now = new Date(),
) {
  const counts = new Map(sevenDayKeys(now).map((key) => [key, 0]))
  for (const row of rows) {
    const key = dayKey(new Date(row.created_at))
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts].map(([date, orders]) => ({
    date,
    label: new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      timeZone: 'Africa/Lagos',
    }).format(new Date(`${date}T12:00:00Z`)),
    orders,
  }))
}
