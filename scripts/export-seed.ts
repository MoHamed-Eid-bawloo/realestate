import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import * as seed from '../src/data/seed.ts'
import { defaultPlatform, defaultSettings } from '../src/data/defaults.ts'

const payload = {
  companies: seed.companies,
  developers: seed.developers,
  employees: seed.employees,
  teams: seed.teams,
  projects: seed.projects,
  units: seed.units,
  properties: seed.properties,
  customers: seed.customers,
  leads: seed.leads,
  brokers: seed.brokers,
  cooperationRequests: seed.cooperationRequests,
  deals: seed.deals,
  transactions: seed.transactions,
  commissions: seed.commissions,
  subscriptionPlans: seed.subscriptionPlans,
  subscriptions: seed.subscriptions,
  conversations: seed.conversations,
  tasks: seed.tasks,
  viewings: seed.viewings,
  tickets: seed.tickets,
  workflows: seed.workflows,
  notifications: seed.notifications,
  savedSearches: seed.savedSearches,
  rolePermissions: seed.rolePermissions,
  audit: seed.auditEntries,
  settings: defaultSettings,
  platform: defaultPlatform,
}

const out = fileURLToPath(new URL('../supabase/seed-data.json', import.meta.url))
writeFileSync(out, JSON.stringify(payload, null, 2))
console.log('seed-data.json written')
for (const [key, value] of Object.entries(payload)) {
  console.log(`  ${key}: ${Array.isArray(value) ? value.length : 1}`)
}
