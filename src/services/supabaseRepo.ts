import { supabase } from '@/lib/supabase'
import { defaultPlatform, defaultSettings } from '@/data/defaults'
import type {
  AuditEntry, Broker, BuyerRequest, Commission, Company, Conversation, CooperationRequest, CrmSettings, Customer,
  Deal, Developer, Employee, Lead, Notification, PlatformSettings, Profile, Project, Property, RolePermission,
  SavedSearch, Subscription, SubscriptionPlan, SupportTicket, Task, Team, Transaction, Unit, Viewing,
  ViewingAppointment, Workflow,
} from '@/types'
import type { Inquiry } from '@/types/extra'

export interface WorkspaceSnapshot {
  companies: Company[]
  developers: Developer[]
  employees: Employee[]
  teams: Team[]
  properties: Property[]
  projects: Project[]
  units: Unit[]
  leads: Lead[]
  customers: Customer[]
  deals: Deal[]
  transactions: Transaction[]
  brokers: Broker[]
  cooperationRequests: CooperationRequest[]
  commissions: Commission[]
  subscriptions: Subscription[]
  subscriptionPlans: SubscriptionPlan[]
  conversations: Conversation[]
  tasks: Task[]
  viewings: Viewing[]
  tickets: SupportTicket[]
  workflows: Workflow[]
  notifications: Notification[]
  savedSearches: SavedSearch[]
  rolePermissions: RolePermission[]
  audit: AuditEntry[]
  settings: CrmSettings
  platform: PlatformSettings
  favorites: string[]
  inquiries: Inquiry[]
  viewingAppointments: ViewingAppointment[]
  buyerRequests: BuyerRequest[]
}

let onError: (message: string) => void = (message) => console.error('[supabase]', message)

export function setRepoErrorHandler(handler: (message: string) => void) {
  onError = handler
}

function fail(message: string) {
  console.error('[supabase]', message)
  onError(message)
}

const camelKey = (key: string) => key.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase())
const snakeKey = (key: string) => key.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`)

export function camelRow<T>(row: Record<string, unknown>): T {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) out[camelKey(key)] = value
  return out as T
}

export function toDbRow(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(input)) {
    if (key.startsWith('_') || value === undefined) continue
    out[snakeKey(key)] = value
  }
  return out
}

async function fetchTable<T>(table: string): Promise<T[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from(table).select('*')
  if (error) {
    fail(`Could not load ${table}: ${error.message}`)
    return []
  }
  return (data ?? []).map((row) => camelRow<T>(row as Record<string, unknown>))
}

export async function fetchPublicData(): Promise<{
  properties: Property[]
  projects: Project[]
  developers: Developer[]
  subscriptionPlans: SubscriptionPlan[]
  platform: PlatformSettings
}> {
  const [properties, projects, developers, subscriptionPlans, platformRows] = await Promise.all([
    fetchTable<Property>('properties'),
    fetchTable<Project>('projects'),
    fetchTable<Developer>('developers'),
    fetchTable<SubscriptionPlan>('subscription_plans'),
    fetchTable<{ id: number; data: PlatformSettings }>('platform_settings'),
  ])
  return { properties, projects, developers, subscriptionPlans, platform: platformRows[0]?.data ?? defaultPlatform }
}

export async function fetchWorkspace(profile: Profile): Promise<WorkspaceSnapshot> {
  const [
    companies, developers, employees, teams, properties, projects, units, leads, customers, deals,
    transactions, brokers, cooperationRequests, commissions, subscriptionPlans, subscriptions, conversations,
    tasks, viewings, tickets, workflows, notifications, savedSearches, rolePermissions, audit,
    crmRows, platformRows, favoriteRows, inquiries, viewingAppointments, buyerRequests,
  ] = await Promise.all([
    fetchTable<Company>('companies'),
    fetchTable<Developer>('developers'),
    fetchTable<Employee>('employees'),
    fetchTable<Team>('teams'),
    fetchTable<Property>('properties'),
    fetchTable<Project>('projects'),
    fetchTable<Unit>('units'),
    fetchTable<Lead>('leads'),
    fetchTable<Customer>('customers'),
    fetchTable<Deal>('deals'),
    fetchTable<Transaction>('transactions'),
    fetchTable<Broker>('brokers'),
    fetchTable<CooperationRequest>('cooperation_requests'),
    fetchTable<Commission>('commissions'),
    fetchTable<SubscriptionPlan>('subscription_plans'),
    fetchTable<Subscription>('subscriptions'),
    fetchTable<Conversation>('conversations'),
    fetchTable<Task>('tasks'),
    fetchTable<Viewing>('viewings'),
    fetchTable<SupportTicket>('tickets'),
    fetchTable<Workflow>('workflows'),
    fetchTable<Notification>('notifications'),
    fetchTable<SavedSearch>('saved_searches'),
    fetchTable<RolePermission>('role_permissions'),
    fetchTable<AuditEntry>('audit_log'),
    fetchTable<{ companyId: string; data: CrmSettings }>('crm_settings'),
    fetchTable<{ id: number; data: PlatformSettings }>('platform_settings'),
    fetchTable<{ propertyId: string }>('favorites'),
    fetchTable<Inquiry>('inquiries'),
    fetchTable<ViewingAppointment>('viewing_appointments'),
    fetchTable<BuyerRequest>('buyer_requests'),
  ])

  const ownSettings = profile.companyId
    ? crmRows.find((row) => row.companyId === profile.companyId)?.data
    : undefined

  return {
    companies,
    developers,
    employees,
    teams,
    properties,
    projects,
    units,
    leads,
    customers,
    deals,
    transactions,
    brokers,
    cooperationRequests,
    commissions,
    subscriptions,
    subscriptionPlans,
    conversations,
    tasks,
    viewings,
    tickets,
    workflows,
    notifications,
    savedSearches,
    rolePermissions,
    audit,
    settings: ownSettings ?? crmRows[0]?.data ?? defaultSettings,
    platform: platformRows[0]?.data ?? defaultPlatform,
    favorites: favoriteRows.map((row) => row.propertyId),
    inquiries,
    viewingAppointments,
    buyerRequests,
  }
}

export async function fetchCompanySettings(companyId: string): Promise<CrmSettings | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('crm_settings').select('data').eq('company_id', companyId).maybeSingle()
  if (error) {
    fail(`Could not load workspace settings: ${error.message}`)
    return null
  }
  return (data?.data as CrmSettings | undefined) ?? null
}

export async function fetchPlatformSettings(): Promise<PlatformSettings | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('platform_settings').select('data').eq('id', 1).maybeSingle()
  if (error) {
    fail(`Could not load platform settings: ${error.message}`)
    return null
  }
  return (data?.data as PlatformSettings | undefined) ?? null
}

export async function dbUpsert(table: string, row: Record<string, unknown>, onConflict = 'id') {
  if (!supabase) return
  const { error } = await supabase.from(table).upsert(toDbRow(row), { onConflict })
  if (error) fail(`Could not save ${table}: ${error.message}`)
}

export async function dbUpsertMany(table: string, rows: Record<string, unknown>[], onConflict = 'id') {
  if (!supabase || !rows.length) return
  for (let i = 0; i < rows.length; i += 400) {
    const chunk = rows.slice(i, i + 400).map(toDbRow)
    const { error } = await supabase.from(table).upsert(chunk, { onConflict })
    if (error) {
      fail(`Could not save ${table}: ${error.message}`)
      return
    }
  }
}

export async function dbInsert(table: string, row: Record<string, unknown>) {
  if (!supabase) return
  const { error } = await supabase.from(table).insert(toDbRow(row))
  if (error) fail(`Could not insert into ${table}: ${error.message}`)
}

export async function dbPatch(table: string, id: string, patch: Record<string, unknown>, idColumn = 'id') {
  if (!supabase) return
  const { error } = await supabase.from(table).update(toDbRow(patch)).eq(idColumn, id)
  if (error) fail(`Could not update ${table}: ${error.message}`)
}

export async function dbDelete(table: string, ids: string | string[], idColumn = 'id') {
  if (!supabase) return
  const list = Array.isArray(ids) ? ids : [ids]
  if (!list.length) return
  const { error } = await supabase.from(table).delete().in(idColumn, list)
  if (error) fail(`Could not delete from ${table}: ${error.message}`)
}

export async function dbDeleteMatch(table: string, match: Record<string, unknown>) {
  if (!supabase) return
  let query: any = supabase.from(table).delete()
  for (const [key, value] of Object.entries(match)) query = query.eq(snakeKey(key), value)
  const { error } = await query
  if (error) fail(`Could not delete from ${table}: ${error.message}`)
}

export async function dbRpc<T = unknown>(fn: string, args: Record<string, unknown> = {}): Promise<{ ok: boolean; data?: T; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase is not configured.' }
  const { data, error } = await supabase.rpc(fn, args)
  if (error) return { ok: false, error: error.message }
  return { ok: true, data: data as T }
}
