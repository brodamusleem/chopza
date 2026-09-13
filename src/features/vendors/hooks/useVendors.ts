import { demoVendors } from '../api/vendors.api'
export function useVendors() {
  return { vendors: demoVendors, isDemo: true as const }
}
