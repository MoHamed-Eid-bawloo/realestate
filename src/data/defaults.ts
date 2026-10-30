import type { CrmSettings, PlatformSettings } from '@/types'

export const defaultSettings: CrmSettings = {
  leadSources: ['Website', 'WhatsApp', 'Facebook', 'Instagram', 'Referral', 'Walk-in', 'Call center', 'Broker', 'Campaign'],
  propertyTypes: ['Apartment', 'Villa', 'Townhouse', 'Penthouse', 'Duplex', 'Chalet', 'Office', 'Retail'],
  activityTypes: ['Call', 'WhatsApp', 'Email', 'Meeting', 'Viewing', 'Task', 'Note'],
  customFields: [
    { id: 'cf1', entity: 'Lead', label: 'Move-in timeline', type: 'Select', required: false },
    { id: 'cf2', entity: 'Lead', label: 'Nationality', type: 'Text', required: false },
    { id: 'cf3', entity: 'Customer', label: 'Preferred floor', type: 'Number', required: false },
    { id: 'cf4', entity: 'Deal', label: 'Sales channel', type: 'Select', required: true },
  ],
  commissionRules: [
    { id: 'cr1', name: 'Primary sales', pct: 2.5, appliesTo: 'Developer sales' },
    { id: 'cr2', name: 'Resale', pct: 2, appliesTo: 'Resale transactions' },
    { id: 'cr3', name: 'Rentals', pct: 50, appliesTo: 'One month rent' },
    { id: 'cr4', name: 'Broker cooperation', pct: 2.25, appliesTo: 'Shared deals' },
  ],
  notificationPrefs: { email: true, whatsapp: true, push: true, digest: false },
  autoAssign: true,
  currency: 'EGP',
}

export const defaultPlatform: PlatformSettings = {
  name: 'Nawyati Real Estate OS',
  supportEmail: 'support@nawyati.example',
  defaultCurrency: 'EGP',
  timezone: 'Africa/Cairo',
  marketplaceEnabled: true,
  exchangeEnabled: true,
  aiAssistantEnabled: true,
  developerPortalEnabled: true,
  autoModeration: true,
  maintenanceMode: false,
  minListingPrice: 250_000,
  maxListingsPerCompany: 500,
}
