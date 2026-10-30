// Seeds a Supabase project with the Nawyati demo tenant.
// Usage: node --env-file=.env scripts/seed.mjs
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const DEMO_PASSWORD = 'Demo1234!'
const seed = JSON.parse(readFileSync(new URL('../supabase/seed-data.json', import.meta.url), 'utf8'))

const snake = (key) => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)

function row(input) {
  const out = {}
  for (const [key, value] of Object.entries(input)) {
    if (key.startsWith('_')) continue
    out[snake(key)] = value
  }
  return out
}

async function upsertRows(table, rows, onConflict = 'id') {
  if (!rows?.length) return
  for (let i = 0; i < rows.length; i += 400) {
    const chunk = rows.slice(i, i + 400)
    const { error } = await admin.from(table).upsert(chunk, { onConflict })
    if (error) throw new Error(`${table}: ${error.message}`)
  }
  console.log(`  ${table}: ${rows.length}`)
}

async function findUserByEmail(email) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw new Error(`listUsers: ${error.message}`)
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (found) return found
    if (data.users.length < 200) return null
  }
  return null
}

async function ensureUser(account) {
  const { data, error } = await admin.auth.admin.createUser({
    email: account.email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: account.fullName },
  })
  if (!error) return data.user
  if (!/already|registered|exists/i.test(error.message)) {
    throw new Error(`createUser ${account.email}: ${error.message}`)
  }
  const existing = await findUserByEmail(account.email)
  if (!existing) throw new Error(`Could not find existing user ${account.email}`)
  return existing
}

const accounts = [
  { email: 'admin@nawyati.demo', fullName: 'Platform Admin', role: 'super_admin' },
  { email: 'owner@nilecrest.demo', fullName: 'Tarek El-Masry', role: 'owner', companyId: 'c1', employeeId: 'e1', avatarColor: '#142B45' },
  { email: 'manager@nilecrest.demo', fullName: 'Omar El-Shazly', role: 'manager', companyId: 'c1', employeeId: 'e2', avatarColor: '#0F766E' },
  { email: 'agent@nilecrest.demo', fullName: 'Youssef Adel', role: 'agent', companyId: 'c1', employeeId: 'e3', avatarColor: '#334E68' },
  { email: 'developer@aurora.demo', fullName: 'Aurora Developer', role: 'developer', developerId: 'd1', avatarColor: '#142B45' },
  { email: 'broker@independent.demo', fullName: 'Karim El-Sherbiny', role: 'broker', brokerId: 'b1', avatarColor: '#334E68' },
  { email: 'customer@sara.demo', fullName: 'Sara Wagih', role: 'customer', avatarColor: '#B45309' },
]

async function main() {
  console.log('Creating demo accounts...')
  const users = {}
  for (const account of accounts) {
    const user = await ensureUser(account)
    users[account.role] = user
    const profile = {
      id: user.id,
      email: account.email,
      full_name: account.fullName,
      role: account.role,
      company_id: account.companyId ?? null,
      developer_id: account.developerId ?? null,
      broker_id: account.brokerId ?? null,
      employee_id: account.employeeId ?? null,
      avatar_color: account.avatarColor ?? '#142B45',
      language: 'en',
      theme: 'light',
    }
    const { error } = await admin.from('profiles').upsert(profile, { onConflict: 'id' })
    if (error) throw new Error(`profile ${account.email}: ${error.message}`)
    console.log(`  ${account.email} (${account.role})`)
  }

  console.log('Inserting tenant data...')
  await upsertRows('companies', seed.companies.map(row))
  await upsertRows('developers', seed.developers.map(row))
  await upsertRows('subscription_plans', seed.subscriptionPlans.map((plan) => ({ popular: false, ...row(plan) })))
  await upsertRows('subscriptions', seed.subscriptions.map(row), 'company_id')
  await upsertRows('employees', seed.employees.map(row))
  await upsertRows('teams', seed.teams.map(row))
  await upsertRows('projects', seed.projects.map(row))
  await upsertRows('units', seed.units.map(row))
  await upsertRows('properties', seed.properties.map(row))
  await upsertRows('customers', seed.customers.map(row))
  await upsertRows('leads', seed.leads.map(row))
  await upsertRows('brokers', seed.brokers.map(row))
  await upsertRows('cooperation_requests', seed.cooperationRequests.map(row))
  await upsertRows('deals', seed.deals.map(row))
  await upsertRows('transactions', seed.transactions.map(row))
  await upsertRows('commissions', seed.commissions.map(row))
  await upsertRows('conversations', seed.conversations.map(row))
  await upsertRows('tasks', seed.tasks.map(row))
  await upsertRows('viewings', seed.viewings.map(row))
  await upsertRows('tickets', seed.tickets.map(row))
  await upsertRows('workflows', seed.workflows.map(row))
  await upsertRows('notifications', seed.notifications.map(row))
  await upsertRows('role_permissions', seed.rolePermissions.map((r, i) => ({ id: `rp${i + 1}`, ...row(r) })))
  await upsertRows('audit_log', seed.audit.map(row))

  await upsertRows('crm_settings', [
    { company_id: 'c1', data: seed.settings },
    { company_id: 'c2', data: seed.settings },
  ], 'company_id')
  await upsertRows('platform_settings', [{ id: 1, data: seed.platform }], 'id')

  const customerId = users.customer?.id
  if (customerId) {
    console.log('Inserting customer workspace data...')
    await upsertRows('favorites', [
      { user_id: customerId, property_id: 'p2' },
      { user_id: customerId, property_id: 'p4' },
    ], 'user_id,property_id')
    await upsertRows('saved_searches', seed.savedSearches.map((s) => ({ ...row(s), user_id: customerId })))
    const now = Date.now()
    const daysAgo = (n) => new Date(now - n * 86_400_000).toISOString()
    const daysAhead = (n) => new Date(now + n * 86_400_000).toISOString()
    await upsertRows('inquiries', [
      { id: 'inq1', user_id: customerId, property_id: 'p2', property_title: 'Skyline 3BR Garden Apartment', name: 'Sara Wagih', phone: '+20 100 555 7712', message: 'Is this still available? I would like to see the payment plan.', at: daysAgo(4), status: 'contacted' },
      { id: 'inq2', user_id: customerId, property_id: 'p21', property_title: 'Beachfront Chalet — Solana', name: 'Sara Wagih', phone: '+20 100 555 7712', message: 'Can we arrange a viewing next weekend?', at: daysAgo(9), status: 'pending' },
    ])
    await upsertRows('viewing_appointments', [
      { id: 'va1', user_id: customerId, property_id: 'p2', customer_name: 'Sara Wagih', date: daysAhead(2).slice(0, 10), time: '12:30', status: 'confirmed', agent_name: 'Youssef Adel' },
      { id: 'va2', user_id: customerId, property_id: 'p4', customer_name: 'Sara Wagih', date: daysAhead(6).slice(0, 10), time: '16:00', status: 'requested', agent_name: 'Mariam Fathy' },
    ])
    await upsertRows('buyer_requests', [
      { id: 'br1', user_id: customerId, title: '4BR villa in West Cairo', locations: ['Sheikh Zayed', '6th of October'], budget: 18000000, status: 'Active', created_at: daysAgo(12) },
      { id: 'br2', user_id: customerId, title: 'Beachfront 3BR chalet', locations: ['North Coast', 'New Alamein'], budget: 11000000, status: 'Matched', created_at: daysAgo(5) },
    ])
  }

  console.log('')
  console.log('Seed complete. Demo password for every account:', DEMO_PASSWORD)
  for (const account of accounts) console.log(`  ${account.role.padEnd(12)} ${account.email}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
