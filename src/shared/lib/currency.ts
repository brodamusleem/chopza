const formatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
})
export function formatNaira(kobo: number) {
  return formatter.format(kobo / 100)
}
