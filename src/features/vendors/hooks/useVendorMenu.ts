import { demoVendors, getDemoMenu } from '../api/vendors.api'
export function useVendorMenu(id: string) {
  return {
    vendor: demoVendors.find((vendor) => vendor.id === id),
    items: getDemoMenu(id),
    isDemo: true as const,
  }
}
