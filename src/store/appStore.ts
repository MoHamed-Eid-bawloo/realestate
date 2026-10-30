import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import { defaultPlatform, defaultSettings } from '@/data/defaults'
import { fetchCompanySettings, fetchPublicData, fetchWorkspace, dbDelete, dbDeleteMatch, dbPatch, dbRpc, dbUpsert, dbUpsertMany, setRepoErrorHandler } from '@/services/supabaseRepo'
import type {
  AuditEntry, Broker, BuyerRequest, Commission, Company, Conversation, CooperationRequest, CooperationStatus, CrmSettings,
  Customer, Deal, DealStage, Developer, Employee, Lang, Lead, LeadStatus, Note, Notification, PlatformSettings, Priority,
  Profile, Project, Property, PropertyStatus, Role, RolePermission, SavedSearch, Subscription, SubscriptionPlan, SupportTicket,
  Task, Team, Theme, Transaction, Unit, Viewing, ViewingAppointment, Workflow,
} from '@/types'
import type { Inquiry } from '@/types/extra'

export type { CrmSettings, PlatformSettings } from '@/types'

export interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'success' | 'error' | 'info' | 'warning'
}

export interface NewLeadInput {
  name: string
  phone: string
  email: string
  source: Lead['source']
  location: string
  budgetMin: number
  budgetMax: number
  propertyType: Lead['propertyType']
  assigneeId: string
  status?: LeadStatus
  priority?: Priority
  notes?: string
}

const uid = (p: string) => `${p}${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`
const nowIso = () => new Date().toISOString()
const addDays = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString()
}

const writeRow = (table: string, row: object) => { void dbUpsert(table, row as Record<string, unknown>) }
const writeRows = (table: string, rows: object[]) => { void dbUpsertMany(table, rows as Record<string, unknown>[]) }
const writePatch = (table: string, id: string, patch: object, idColumn = 'id') => { void dbPatch(table, id, patch as Record<string, unknown>, idColumn) }
const writeDelete = (table: string, ids: string | string[]) => { void dbDelete(table, ids) }

const emptyData = () => ({
  companies: [] as Company[],
  developers: [] as Developer[],
  employees: [] as Employee[],
  teams: [] as Team[],
  properties: [] as Property[],
  projects: [] as Project[],
  units: [] as Unit[],
  leads: [] as Lead[],
  customers: [] as Customer[],
  deals: [] as Deal[],
  transactions: [] as Transaction[],
  brokers: [] as Broker[],
  cooperationRequests: [] as CooperationRequest[],
  commissions: [] as Commission[],
  subscriptions: [] as Subscription[],
  subscriptionPlans: [] as SubscriptionPlan[],
  conversations: [] as Conversation[],
  tasks: [] as Task[],
  viewings: [] as Viewing[],
  tickets: [] as SupportTicket[],
  workflows: [] as Workflow[],
  notifications: [] as Notification[],
  savedSearches: [] as SavedSearch[],
  rolePermissions: [] as RolePermission[],
  audit: [] as AuditEntry[],
  settings: defaultSettings,
  platform: defaultPlatform,
  favorites: [] as string[],
  inquiries: [] as Inquiry[],
  viewingAppointments: [] as ViewingAppointment[],
  buyerRequests: [] as BuyerRequest[],
})

const emptyCompany: Company = {
  id: '', name: 'Nawyati', nameAr: 'نواتي', type: 'hybrid', license: '', verified: false, status: 'active',
  subscriptionId: '', branches: 0, rating: 0, employees: 0, createdAt: '', logoColor: '#142B45', email: '', phone: '', city: '',
}

const emptyEmployee: Employee = {
  id: '', companyId: '', name: 'Team member', nameAr: '', role: 'agent', title: '', titleAr: '', email: '', phone: '',
  teamId: '', avatarColor: '#334E68', target: 0, achieved: 0, leadsAssigned: 0, dealsWon: 0, conversion: 0,
  status: 'active', joinedAt: '', attendance: 0, permissions: [],
}

interface AppState {
  profile: Profile | null
  userId: string | null
  hydrated: boolean
  role: Role
  language: Lang
  theme: Theme
  activeCompanyId: string
  activeDeveloperId: string
  activeBrokerId: string
  sidebarCollapsed: boolean
  commandOpen: boolean
  notificationsOpen: boolean
  toasts: Toast[]
  selectedPipeline: string

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

  hydratePublic: () => Promise<void>
  hydrateWorkspace: (profile: Profile) => Promise<void>
  clearWorkspace: () => void
  reload: () => Promise<void>

  setLanguage: (l: Lang) => void
  setTheme: (t: Theme) => void
  toggleTheme: () => void
  setActiveCompany: (id: string) => void
  setActiveDeveloper: (id: string) => void
  setActiveBroker: (id: string) => void
  toggleSidebar: () => void
  setCommandOpen: (v: boolean) => void
  setNotificationsOpen: (v: boolean) => void
  setSelectedPipeline: (id: string) => void
  toast: (title: string, description?: string, variant?: Toast['variant']) => void
  dismissToast: (id: string) => void

  addLead: (input: NewLeadInput) => Lead
  updateLead: (id: string, patch: Partial<Lead>) => void
  deleteLeads: (ids: string[]) => void
  assignLeads: (ids: string[], employeeId: string) => void
  addLeadNote: (id: string, text: string, author: string) => void
  addLeadActivity: (id: string, type: Lead['activities'][number]['type'], title: string, detail: string, actor: string) => void
  addCustomer: (customer: Customer) => void
  updateCustomer: (id: string, patch: Partial<Customer>) => void

  addDeal: (deal: Deal) => void
  updateDeal: (id: string, patch: Partial<Deal>) => void
  moveDeal: (id: string, stage: DealStage) => { ok: boolean; message: string }
  convertLead: (leadId: string, propertyId: string) => Deal | null
  addTransaction: (tx: Transaction) => void

  addProperty: (property: Property) => void
  updateProperty: (id: string, patch: Partial<Property>) => void
  archiveProperty: (id: string) => void
  duplicateProperty: (id: string) => Property | null
  setPropertyStatus: (id: string, status: PropertyStatus) => { ok: boolean; message: string }
  reserveUnit: (unitId: string) => { ok: boolean; message: string }
  releaseUnit: (unitId: string) => void

  addTask: (task: Task) => void
  updateTask: (id: string, patch: Partial<Task>) => void
  deleteTask: (id: string) => void
  addViewing: (v: Viewing) => void
  updateViewing: (id: string, patch: Partial<Viewing>) => void

  addProject: (project: Project) => void
  updateProject: (id: string, patch: Partial<Project>) => void
  addUnits: (units: Unit[]) => void
  updateTransactionStatus: (id: string, status: Transaction['status']) => void
  addEmployee: (employee: Employee) => void
  updateEmployee: (id: string, patch: Partial<Employee>) => void
  deleteEmployee: (id: string) => void
  updateTeam: (id: string, patch: Partial<Team>) => void

  sendMessage: (conversationId: string, text: string) => void
  addInternalNote: (conversationId: string, text: string) => void
  markConversationRead: (id: string) => void
  assignConversation: (id: string, employeeId: string) => void
  convertConversation: (id: string) => void

  addCooperation: (req: CooperationRequest) => void
  updateCooperation: (id: string, patch: Partial<CooperationRequest>) => void
  updateCooperationStatus: (id: string, status: CooperationStatus) => void
  addCooperationNote: (id: string, text: string) => void
  updateCommissionStatus: (id: string, status: Commission['status']) => void
  payCommissions: (ids: string[]) => void
  addBroker: (broker: Broker) => void
  updateBroker: (id: string, patch: Partial<Broker>) => void

  updateWorkflow: (id: string, patch: Partial<Workflow>) => void
  addWorkflow: (wf: Workflow) => void

  addTicket: (ticket: SupportTicket) => void
  updateTicket: (id: string, patch: Partial<SupportTicket>) => void

  addNotification: (n: Omit<Notification, 'id' | 'createdAt' | 'read'> & { read?: boolean }) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  deleteNotification: (id: string) => void

  updateCompany: (id: string, patch: Partial<Company>) => void
  updateSubscription: (companyId: string, planId: string) => void
  updateSettings: (patch: Partial<CrmSettings>) => void
  updatePlatform: (patch: Partial<PlatformSettings>) => void
  addCustomField: (field: CrmSettings['customFields'][number]) => void
  removeCustomField: (id: string) => void
  addCommissionRule: (rule: CrmSettings['commissionRules'][number]) => void
  removeCommissionRule: (id: string) => void
  addSavedSearch: (s: SavedSearch) => void
  removeSavedSearch: (id: string) => void
  toggleFavorite: (propertyId: string) => void
  addInquiry: (property: Property, name: string, phone: string, message: string) => void
  requestViewing: (property: Property, name: string, date: string, time: string) => void
  cancelViewingRequest: (id: string) => void
  addBuyerRequest: (r: { title: string; locations: string[]; budget: number }) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      profile: null,
      userId: null,
      hydrated: false,
      role: 'customer',
      language: 'en',
      theme: 'light',
      activeCompanyId: '',
      activeDeveloperId: '',
      activeBrokerId: '',
      sidebarCollapsed: false,
      commandOpen: false,
      notificationsOpen: false,
      toasts: [],
      selectedPipeline: 'primary',
      ...emptyData(),

      hydratePublic: async () => {
        const data = await fetchPublicData()
        set({
          properties: data.properties,
          projects: data.projects,
          developers: data.developers,
          subscriptionPlans: data.subscriptionPlans,
          platform: data.platform,
        })
      },
      hydrateWorkspace: async (profile) => {
        set({ profile, userId: profile.id, role: profile.role, language: profile.language ?? get().language, theme: profile.theme ?? get().theme })
        const data = await fetchWorkspace(profile)
        const currentCompany = get().activeCompanyId
        const activeCompanyId = data.companies.some((c) => c.id === currentCompany)
          ? currentCompany
          : profile.companyId ?? data.companies[0]?.id ?? ''
        const currentDeveloper = get().activeDeveloperId
        const activeDeveloperId = data.developers.some((d) => d.id === currentDeveloper)
          ? currentDeveloper
          : profile.developerId ?? data.developers[0]?.id ?? ''
        const currentBroker = get().activeBrokerId
        const activeBrokerId = data.brokers.some((b) => b.id === currentBroker)
          ? currentBroker
          : profile.brokerId ?? data.brokers[0]?.id ?? ''
        set({ ...data, activeCompanyId, activeDeveloperId, activeBrokerId, hydrated: true })
      },
      clearWorkspace: () => {
        set({ ...emptyData(), profile: null, userId: null, role: 'customer', hydrated: false, activeCompanyId: '', activeDeveloperId: '', activeBrokerId: '' })
        void get().hydratePublic()
      },
      reload: async () => {
        const profile = get().profile
        if (!profile) {
          await get().hydratePublic()
          return
        }
        const data = await fetchWorkspace(profile)
        const currentCompany = get().activeCompanyId
        const activeCompanyId = data.companies.some((c) => c.id === currentCompany)
          ? currentCompany
          : profile.companyId ?? data.companies[0]?.id ?? ''
        set({ ...data, activeCompanyId, hydrated: true })
      },

      setLanguage: (language) => {
        set({ language })
        const userId = get().userId
        if (userId) writePatch('profiles', userId, { language })
      },
      setTheme: (theme) => {
        set({ theme })
        const userId = get().userId
        if (userId) writePatch('profiles', userId, { theme })
      },
      toggleTheme: () => get().setTheme(get().theme === 'light' ? 'dark' : 'light'),
      setActiveCompany: (activeCompanyId) => {
        set({ activeCompanyId })
        if (get().role === 'super_admin') {
          void fetchCompanySettings(activeCompanyId).then((settings) => {
            if (settings) set({ settings })
          })
        }
      },
      setActiveDeveloper: (activeDeveloperId) => set({ activeDeveloperId }),
      setActiveBroker: (activeBrokerId) => set({ activeBrokerId }),
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setCommandOpen: (commandOpen) => set({ commandOpen }),
      setNotificationsOpen: (notificationsOpen) => set({ notificationsOpen }),
      setSelectedPipeline: (selectedPipeline) => set({ selectedPipeline }),

      toast: (title, description, variant = 'success') => {
        const id = uid('toast')
        set({ toasts: [...get().toasts, { id, title, description, variant }] })
        setTimeout(() => get().dismissToast(id), 4200)
      },
      dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),

      addLead: (input) => {
        const lead: Lead = {
          id: uid('l'),
          companyId: get().activeCompanyId,
          name: input.name,
          phone: input.phone,
          email: input.email,
          source: input.source,
          location: input.location,
          budgetMin: input.budgetMin,
          budgetMax: input.budgetMax,
          propertyType: input.propertyType,
          preferredArea: input.location,
          paymentPreference: 'installments',
          assigneeId: input.assigneeId,
          status: input.status ?? 'new',
          priority: input.priority ?? 'medium',
          score: 45 + Math.floor(Math.random() * 30),
          notes: input.notes ? [{ id: uid('note'), author: 'You', text: input.notes, at: nowIso() }] : [],
          activities: [{ id: uid('act'), type: 'system', title: 'Lead created', detail: `Created manually from the CRM by ${get().role}.`, at: nowIso(), actor: 'You' }],
          lastContact: nowIso(),
          nextFollowUp: addDays(1),
          createdAt: nowIso(),
          tags: [input.location],
        }
        set({ leads: [lead, ...get().leads] })
        writeRow('leads', lead)
        get().addNotification({ type: 'lead', title: 'New lead created', body: `${lead.name} was added to the CRM and assigned.`, category: 'crm', href: `/crm/leads/${lead.id}`, companyId: lead.companyId })
        return lead
      },
      updateLead: (id, patch) => {
        const lastContact = nowIso()
        set({ leads: get().leads.map((l) => (l.id === id ? { ...l, ...patch, lastContact } : l)) })
        writePatch('leads', id, { ...patch, lastContact })
      },
      deleteLeads: (ids) => {
        const names = get().leads.filter((l) => ids.includes(l.id)).map((l) => l.name)
        set({ leads: get().leads.filter((l) => !ids.includes(l.id)) })
        writeDelete('leads', ids)
        get().toast(`${ids.length} lead${ids.length > 1 ? 's' : ''} deleted`, names.slice(0, 2).join(', ') + (names.length > 2 ? ` +${names.length - 2} more` : ''), 'info')
      },
      assignLeads: (ids, employeeId) => {
        const employee = get().employees.find((e) => e.id === employeeId)
        const changed = get().leads
          .filter((l) => ids.includes(l.id))
          .map((l) => ({ ...l, assigneeId: employeeId, activities: [...l.activities, { id: uid('a'), type: 'status' as const, title: 'Lead reassigned', detail: `Reassigned to ${employee?.name}.`, at: nowIso(), actor: 'You' }] }))
        set({ leads: get().leads.map((l) => changed.find((c) => c.id === l.id) ?? l) })
        writeRows('leads', changed)
        get().toast('Leads reassigned', `${ids.length} lead(s) assigned to ${employee?.name}.`)
      },
      addLeadNote: (id, text, author) => {
        const note: Note = { id: uid('n'), author, text, at: nowIso() }
        const lead = get().leads.find((l) => l.id === id)
        if (!lead) return
        const notes = [note, ...lead.notes]
        set({ leads: get().leads.map((l) => (l.id === id ? { ...l, notes } : l)) })
        writePatch('leads', id, { notes })
      },
      addLeadActivity: (id, type, title, detail, actor) => {
        const lead = get().leads.find((l) => l.id === id)
        if (!lead) return
        const lastContact = nowIso()
        const activities = [{ id: uid('a'), type, title, detail, at: lastContact, actor }, ...lead.activities]
        set({ leads: get().leads.map((l) => (l.id === id ? { ...l, lastContact, activities } : l)) })
        writePatch('leads', id, { lastContact, activities })
        get().toast('Activity logged', `${title} was added to the lead timeline.`)
      },
      addCustomer: (customer) => {
        set({ customers: [customer, ...get().customers] })
        writeRow('customers', customer)
      },
      updateCustomer: (id, patch) => {
        set({ customers: get().customers.map((c) => (c.id === id ? { ...c, ...patch } : c)) })
        writePatch('customers', id, patch)
      },

      addDeal: (deal) => {
        set({ deals: [deal, ...get().deals] })
        writeRow('deals', deal)
        get().toast('Deal created', `${deal.code} · ${deal.propertyTitle}`)
      },
      updateDeal: (id, patch) => {
        const updatedAt = nowIso()
        set({ deals: get().deals.map((d) => (d.id === id ? { ...d, ...patch, updatedAt, lastActivity: updatedAt } : d)) })
        writePatch('deals', id, { ...patch, updatedAt, lastActivity: updatedAt })
      },
      moveDeal: (id, stage) => {
        const deal = get().deals.find((d) => d.id === id)
        if (!deal) return { ok: false, message: 'Deal not found.' }
        if (stage === 'reservation') {
          const prop = get().properties.find((p) => p.id === deal.propertyId)
          if (!prop) return { ok: false, message: 'Linked property not found.' }
          if (prop.status !== 'available' && prop.status !== 'pending_review') {
            return { ok: false, message: `Cannot reserve: ${prop.title} is currently ${prop.status}.` }
          }
          set({
            properties: get().properties.map((p) => (p.id === prop.id ? { ...p, status: 'reserved', updatedAt: nowIso() } : p)),
            deals: get().deals.map((d) => (d.id === id ? { ...d, stage, reservationStatus: 'confirmed', probability: 90, updatedAt: nowIso(), lastActivity: nowIso() } : d)),
          })
        } else if (stage === 'won') {
          set({
            deals: get().deals.map((d) => (d.id === id ? { ...d, stage, probability: 100, contractStatus: 'signed', updatedAt: nowIso(), lastActivity: nowIso() } : d)),
            properties: get().properties.map((p) => (p.id === deal.propertyId ? { ...p, status: p.listingType === 'rent' ? 'rented' : 'sold', updatedAt: nowIso() } : p)),
          })
        } else {
          set({ deals: get().deals.map((d) => (d.id === id ? { ...d, stage, updatedAt: nowIso(), lastActivity: nowIso() } : d)) })
        }
        void dbRpc<{ ok: boolean; message: string }>('move_deal', { p_deal_id: id, p_stage: stage }).then((result) => {
          if (!result.ok || result.data?.ok === false) {
            get().toast('Stage change rejected', result.error ?? result.data?.message ?? 'The server rejected this change.', 'error')
            void get().reload()
          }
        })
        return { ok: true, message: `Deal moved to ${stage}.` }
      },
      convertLead: (leadId, propertyId) => {
        const lead = get().leads.find((l) => l.id === leadId)
        const prop = get().properties.find((p) => p.id === propertyId)
        if (!lead || !prop) return null
        const deal: Deal = {
          id: uid('dl'), code: `DL-${Math.floor(2500 + Math.random() * 400)}`, companyId: lead.companyId,
          customerName: lead.name, propertyId: prop.id, propertyTitle: prop.title, value: prop.price,
          stage: 'qualified', pipelineId: prop.listingType === 'resale' ? 'resale' : 'primary', agentId: lead.assigneeId,
          developerId: prop.developerId, probability: 30, expectedClose: addDays(30), reservationStatus: 'none',
          contractStatus: 'none', commissionPct: 2.5, createdAt: nowIso(), updatedAt: nowIso(), lastActivity: nowIso(),
        }
        const activities = [{ id: uid('a'), type: 'status' as const, title: 'Converted to opportunity', detail: `${deal.code} created for ${prop.title}.`, at: nowIso(), actor: 'You' }, ...lead.activities]
        set({
          deals: [deal, ...get().deals],
          leads: get().leads.map((l) => (l.id === leadId ? { ...l, status: 'qualified', activities } : l)),
        })
        writeRow('deals', deal)
        writePatch('leads', leadId, { status: 'qualified', activities })
        get().toast('Lead converted', `${lead.name} was converted into opportunity ${deal.code}.`)
        return deal
      },
      addTransaction: (tx) => {
        set({ transactions: [tx, ...get().transactions] })
        writeRow('transactions', tx)
      },

      addProperty: (property) => {
        set({ properties: [property, ...get().properties] })
        writeRow('properties', property)
        get().toast('Property created', `${property.code} · ${property.title}`)
      },
      updateProperty: (id, patch) => {
        const updatedAt = nowIso()
        set({ properties: get().properties.map((p) => (p.id === id ? { ...p, ...patch, updatedAt } : p)) })
        writePatch('properties', id, { ...patch, updatedAt })
        get().toast('Property updated', 'The listing changes were saved.')
      },
      archiveProperty: (id) => {
        const updatedAt = nowIso()
        set({ properties: get().properties.map((p) => (p.id === id ? { ...p, listingStatus: 'archived', status: 'unavailable', updatedAt } : p)) })
        writePatch('properties', id, { listingStatus: 'archived', status: 'unavailable', updatedAt })
        get().toast('Listing archived', 'The property was removed from the active inventory.', 'info')
      },
      duplicateProperty: (id) => {
        const p = get().properties.find((x) => x.id === id)
        if (!p) return null
        const copy: Property = { ...p, id: uid('p'), code: `${p.code}-C`, title: `${p.title} (Copy)`, status: 'pending_review', listingStatus: 'draft', verified: false, featured: false, createdAt: nowIso(), updatedAt: nowIso() }
        set({ properties: [copy, ...get().properties] })
        writeRow('properties', copy)
        get().toast('Property duplicated', 'A draft copy was created for editing.')
        return copy
      },
      setPropertyStatus: (id, status) => {
        const p = get().properties.find((x) => x.id === id)
        if (!p) return { ok: false, message: 'Property not found.' }
        if (p.status === 'sold' && status === 'available') return { ok: false, message: 'A sold property cannot be moved back to available.' }
        const updatedAt = nowIso()
        set({ properties: get().properties.map((x) => (x.id === id ? { ...x, status, updatedAt } : x)) })
        writePatch('properties', id, { status, updatedAt })
        get().addNotification({ type: 'property', title: 'Property status updated', body: `${p.title} is now ${status.replace('_', ' ')}.`, category: 'properties', companyId: p.companyId, href: '/inventory' })
        return { ok: true, message: `Status updated to ${status.replace('_', ' ')}.` }
      },
      reserveUnit: (unitId) => {
        const unit = get().units.find((u) => u.id === unitId)
        if (!unit) return { ok: false, message: 'Unit not found.' }
        if (unit.status !== 'available') return { ok: false, message: `Unit ${unit.unitNumber} is already ${unit.status}.` }
        set({ units: get().units.map((u) => (u.id === unitId ? { ...u, status: 'reserved' } : u)) })
        void dbRpc<{ ok: boolean; message: string }>('reserve_unit', { p_unit_id: unitId }).then((result) => {
          if (!result.ok || result.data?.ok === false) {
            get().toast('Reservation failed', result.error ?? result.data?.message ?? 'The unit is no longer available.', 'error')
            void get().reload()
          }
        })
        get().toast('Unit reserved', `${unit.unitNumber} is now reserved for 48 hours.`)
        return { ok: true, message: `${unit.unitNumber} reserved.` }
      },
      releaseUnit: (unitId) => {
        const unit = get().units.find((u) => u.id === unitId)
        set({ units: get().units.map((u) => (u.id === unitId ? { ...u, status: 'available' } : u)) })
        void dbRpc('release_unit', { p_unit_id: unitId })
        get().toast('Hold released', `${unit?.unitNumber ?? 'Unit'} is available again.`, 'info')
      },

      addTask: (task) => {
        set({ tasks: [task, ...get().tasks] })
        writeRow('tasks', task)
      },
      updateTask: (id, patch) => {
        set({ tasks: get().tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })
        writePatch('tasks', id, patch)
      },
      deleteTask: (id) => {
        set({ tasks: get().tasks.filter((t) => t.id !== id) })
        writeDelete('tasks', id)
        get().toast('Task deleted', undefined, 'info')
      },
      addViewing: (v) => {
        set({ viewings: [v, ...get().viewings] })
        writeRow('viewings', v)
      },
      updateViewing: (id, patch) => {
        set({ viewings: get().viewings.map((v) => (v.id === id ? { ...v, ...patch } : v)) })
        writePatch('viewings', id, patch)
        get().toast('Viewing updated', 'The viewing record was saved.')
      },

      addProject: (project) => {
        set({ projects: [project, ...get().projects] })
        writeRow('projects', project)
        get().toast('Project created', `${project.name} was added to the developer portfolio.`)
      },
      updateProject: (id, patch) => {
        set({ projects: get().projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) })
        writePatch('projects', id, patch)
        get().toast('Project updated', 'The project details were saved.')
      },
      addUnits: (units) => {
        set({ units: [...units, ...get().units] })
        writeRows('units', units)
      },
      updateTransactionStatus: (id, status) => {
        set({ transactions: get().transactions.map((tx) => (tx.id === id ? { ...tx, status } : tx)) })
        writePatch('transactions', id, { status })
        get().toast('Transaction updated', `Invoice marked as ${status}.`)
      },
      addEmployee: (employee) => {
        set({ employees: [...get().employees, employee] })
        writeRow('employees', employee)
        get().toast('Team member added', `${employee.name} joined ${get().companies.find((c) => c.id === employee.companyId)?.name}.`)
      },
      updateEmployee: (id, patch) => {
        set({ employees: get().employees.map((e) => (e.id === id ? { ...e, ...patch } : e)) })
        writePatch('employees', id, patch)
        get().toast('Team member updated', 'The employee record was saved.')
      },
      deleteEmployee: (id) => {
        set({ employees: get().employees.filter((e) => e.id !== id) })
        writeDelete('employees', id)
        get().toast('Team member removed', 'The seat is now available.', 'info')
      },
      updateTeam: (id, patch) => {
        set({ teams: get().teams.map((team) => (team.id === id ? { ...team, ...patch } : team)) })
        writePatch('teams', id, patch)
        get().toast('Team updated', 'The team settings were saved.')
      },

      sendMessage: (conversationId, text) => {
        const conv = get().conversations.find((c) => c.id === conversationId)
        if (!conv) return
        const message = { id: uid('m'), conversationId, sender: 'agent' as const, text, at: nowIso(), channel: conv.channel === 'email' ? 'email' as const : conv.channel === 'chat' ? 'chat' as const : 'whatsapp' as const }
        const messages = [...conv.messages, message]
        set({ conversations: get().conversations.map((c) => (c.id === conversationId ? { ...c, messages, lastMessage: text, lastAt: nowIso(), unread: 0 } : c)) })
        writePatch('conversations', conversationId, { messages, lastMessage: text, lastAt: nowIso(), unread: 0 })
      },
      addInternalNote: (conversationId, text) => {
        const conv = get().conversations.find((c) => c.id === conversationId)
        if (!conv) return
        const message = { id: uid('m'), conversationId, sender: 'agent' as const, text, at: nowIso(), channel: 'note' as const }
        const messages = [...conv.messages, message]
        set({ conversations: get().conversations.map((c) => (c.id === conversationId ? { ...c, messages } : c)) })
        writePatch('conversations', conversationId, { messages })
        get().toast('Internal note added', 'Only your team can see this note.', 'info')
      },
      markConversationRead: (id) => {
        set({ conversations: get().conversations.map((c) => (c.id === id ? { ...c, unread: 0 } : c)) })
        writePatch('conversations', id, { unread: 0 })
      },
      assignConversation: (id, employeeId) => {
        set({ conversations: get().conversations.map((c) => (c.id === id ? { ...c, assigneeId: employeeId } : c)) })
        writePatch('conversations', id, { assigneeId: employeeId })
        get().toast('Conversation assigned', `Assigned to ${get().employees.find((e) => e.id === employeeId)?.name}.`)
      },
      convertConversation: (id) => {
        const conv = get().conversations.find((c) => c.id === id)
        if (!conv) return
        const existing = get().leads.find((l) => l.name === conv.customerName)
        if (existing) {
          get().toast('Lead already exists', `${conv.customerName} is already in the CRM.`, 'info')
          return
        }
        get().addLead({ name: conv.customerName, phone: conv.phone, email: `${conv.customerName.split(' ')[0].toLowerCase()}@example.com`, source: 'whatsapp', location: 'New Cairo', budgetMin: 7000000, budgetMax: 12000000, propertyType: 'apartment', assigneeId: conv.assigneeId, priority: 'high', notes: `Converted from ${conv.channel} conversation.` })
        set({ conversations: get().conversations.map((c) => (c.id === id ? { ...c, status: 'closed' } : c)) })
        writePatch('conversations', id, { status: 'closed' })
        get().toast('Conversation converted', `${conv.customerName} was added as a new lead.`)
      },

      addCooperation: (req) => {
        set({ cooperationRequests: [req, ...get().cooperationRequests] })
        writeRow('cooperation_requests', req)
        get().addNotification({ type: 'cooperation', title: 'Cooperation request created', body: `${req.code} was sent to the owning company.`, category: 'exchange', href: `/exchange/requests/${req.id}`, companyId: req.requestingCompanyId })
        get().toast('Cooperation request sent', 'The owning company will review availability and terms.')
      },
      updateCooperation: (id, patch) => {
        const updatedAt = nowIso()
        set({ cooperationRequests: get().cooperationRequests.map((r) => (r.id === id ? { ...r, ...patch, updatedAt } : r)) })
        writePatch('cooperation_requests', id, { ...patch, updatedAt })
      },
      updateCooperationStatus: (id, status) => {
        const req = get().cooperationRequests.find((r) => r.id === id)
        if (!req) return
        const updatedAt = nowIso()
        const activities = [...req.activities, { id: uid('ca'), type: 'status' as const, title: `Status changed to ${status}`, detail: 'Updated by the cooperation desk.', at: updatedAt, actor: 'You' }]
        set({ cooperationRequests: get().cooperationRequests.map((r) => (r.id === id ? { ...r, status, updatedAt, activities } : r)) })
        writePatch('cooperation_requests', id, { status, updatedAt, activities })
        if (status === 'accepted') get().addNotification({ type: 'cooperation_accepted', title: 'Cooperation accepted', body: `${req.code} is now active. Customer details can be shared within the workspace.`, category: 'exchange', href: `/exchange/requests/${id}`, companyId: req.requestingCompanyId })
        get().toast('Cooperation updated', `Status set to ${status.replace('_', ' ')}.`)
      },
      addCooperationNote: (id, text) => {
        const req = get().cooperationRequests.find((r) => r.id === id)
        if (!req) return
        const notes = [{ id: uid('n'), author: 'You', text, at: nowIso() }, ...req.notes]
        set({ cooperationRequests: get().cooperationRequests.map((r) => (r.id === id ? { ...r, notes } : r)) })
        writePatch('cooperation_requests', id, { notes })
        get().toast('Note added', 'The partnership desk can see your note.', 'info')
      },
      updateCommissionStatus: (id, status) => {
        const paidAt = status === 'paid' ? nowIso() : undefined
        set({ commissions: get().commissions.map((c) => (c.id === id ? { ...c, status, paidAt } : c)) })
        writePatch('commissions', id, { status, paidAt: paidAt ?? null })
        get().toast('Commission updated', `Marked as ${status}.`)
      },
      payCommissions: (ids) => {
        const selected = get().commissions.filter((c) => ids.includes(c.id) && c.status !== 'paid')
        if (!selected.length) {
          get().toast('Nothing to settle', 'The selected commissions are already paid.', 'info')
          return
        }
        const paidAt = nowIso()
        const updated = selected.map((c) => ({ ...c, status: 'paid' as const, paidAt }))
        set({ commissions: get().commissions.map((c) => updated.find((u) => u.id === c.id) ?? c) })
        writeRows('commissions', updated)
        const total = new Intl.NumberFormat('en-EG', { maximumFractionDigits: 0 }).format(selected.reduce((s, c) => s + c.amount, 0))
        get().toast('Payout recorded', `${selected.length} commission entries worth ${total} EGP were settled.`)
      },
      addBroker: (broker) => {
        set({ brokers: [broker, ...get().brokers] })
        writeRow('brokers', broker)
        get().toast('Partner added', `${broker.name} joined the broker network.`)
      },
      updateBroker: (id, patch) => {
        set({ brokers: get().brokers.map((b) => (b.id === id ? { ...b, ...patch } : b)) })
        writePatch('brokers', id, patch)
        get().toast('Broker updated', 'The partner profile was saved.')
      },

      updateWorkflow: (id, patch) => {
        set({ workflows: get().workflows.map((w) => (w.id === id ? { ...w, ...patch } : w)) })
        writePatch('workflows', id, patch)
      },
      addWorkflow: (wf) => {
        set({ workflows: [wf, ...get().workflows] })
        writeRow('workflows', wf)
        get().toast('Workflow created', 'It is now enabled and will run on the selected trigger.')
      },

      addTicket: (ticket) => {
        set({ tickets: [ticket, ...get().tickets] })
        writeRow('tickets', ticket)
      },
      updateTicket: (id, patch) => {
        const updatedAt = nowIso()
        set({ tickets: get().tickets.map((t) => (t.id === id ? { ...t, ...patch, updatedAt } : t)) })
        writePatch('tickets', id, { ...patch, updatedAt })
      },

      addNotification: (n) => {
        const notification: Notification = { ...n, id: uid('n'), read: n.read ?? false, createdAt: nowIso() }
        set({ notifications: [notification, ...get().notifications] })
        const ownCompany = get().profile?.companyId
        if (get().role === 'super_admin' || (ownCompany && notification.companyId === ownCompany)) {
          writeRow('notifications', notification)
        }
      },
      markNotificationRead: (id) => {
        set({ notifications: get().notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })
        writePatch('notifications', id, { read: true })
      },
      markAllNotificationsRead: () => {
        const changed = get().notifications.filter((n) => !n.read).map((n) => ({ ...n, read: true }))
        set({ notifications: get().notifications.map((n) => ({ ...n, read: true })) })
        writeRows('notifications', changed)
      },
      deleteNotification: (id) => {
        set({ notifications: get().notifications.filter((n) => n.id !== id) })
        writeDelete('notifications', id)
      },

      updateCompany: (id, patch) => {
        set({ companies: get().companies.map((c) => (c.id === id ? { ...c, ...patch } : c)) })
        writePatch('companies', id, patch)
        get().toast('Company updated', 'Platform records were saved.')
      },
      updateSubscription: (companyId, planId) => {
        const plan = get().subscriptionPlans.find((p) => p.id === planId)
        const renewalDate = addDays(30)
        set({ subscriptions: get().subscriptions.map((s) => (s.companyId === companyId ? { ...s, planId, status: 'active', renewalDate } : s)) })
        writePatch('subscriptions', companyId, { planId, status: 'active', renewalDate }, 'company_id')
        get().toast('Subscription updated', `${get().companies.find((c) => c.id === companyId)?.name} moved to ${plan?.name}.`)
      },
      updateSettings: (patch) => {
        const settings = { ...get().settings, ...patch }
        set({ settings })
        const companyId = get().activeCompanyId
        if (companyId) void dbUpsert('crm_settings', { companyId, data: settings }, 'company_id')
      },
      updatePlatform: (patch) => {
        const platform = { ...get().platform, ...patch }
        set({ platform })
        void dbUpsert('platform_settings', { id: 1, data: platform }, 'id')
      },
      addCustomField: (field) => {
        const settings = { ...get().settings, customFields: [...get().settings.customFields, field] }
        get().updateSettings({ customFields: settings.customFields })
        get().toast('Custom field added', `${field.label} is available on ${field.entity}.`)
      },
      removeCustomField: (id) => {
        get().updateSettings({ customFields: get().settings.customFields.filter((f) => f.id !== id) })
      },
      addCommissionRule: (rule) => {
        get().updateSettings({ commissionRules: [...get().settings.commissionRules, rule] })
        get().toast('Commission rule saved', `${rule.name} · ${rule.pct}%`)
      },
      removeCommissionRule: (id) => {
        get().updateSettings({ commissionRules: get().settings.commissionRules.filter((r) => r.id !== id) })
      },
      addSavedSearch: (s) => {
        const userId = get().userId
        if (!userId) {
          get().toast('Sign in required', 'Create an account to save searches and get alerts.', 'info')
          return
        }
        set({ savedSearches: [s, ...get().savedSearches] })
        writeRow('saved_searches', { ...s, userId })
        get().toast('Search saved', 'We will notify you about matching properties.')
      },
      removeSavedSearch: (id) => {
        set({ savedSearches: get().savedSearches.filter((s) => s.id !== id) })
        writeDelete('saved_searches', id)
      },
      toggleFavorite: (propertyId) => {
        const userId = get().userId
        if (!userId) {
          get().toast('Sign in required', 'Sign in to save properties to your favorites.', 'info')
          return
        }
        const exists = get().favorites.includes(propertyId)
        set({ favorites: exists ? get().favorites.filter((id) => id !== propertyId) : [...get().favorites, propertyId] })
        if (exists) void dbDeleteMatch('favorites', { userId, propertyId })
        else void dbUpsert('favorites', { userId, propertyId }, 'user_id,property_id')
        get().toast(exists ? 'Removed from favorites' : 'Saved to favorites', exists ? undefined : 'Find it anytime in your account.', 'info')
      },
      addInquiry: (property, name, phone, message) => {
        const inquiry: Inquiry = { id: uid('inq'), propertyId: property.id, propertyTitle: property.title, name, phone, message, at: nowIso(), status: 'pending' }
        set({ inquiries: [inquiry, ...get().inquiries] })
        writeRow('inquiries', { ...inquiry, userId: get().userId })
        get().toast('Inquiry sent', 'A consultant will contact you within 30 minutes.')
      },
      requestViewing: (property, name, date, time) => {
        const appt: ViewingAppointment = { id: uid('va'), propertyId: property.id, customerName: name, date, time, status: 'requested', agentName: 'Nile Crest consultant' }
        set({ viewingAppointments: [appt, ...get().viewingAppointments] })
        writeRow('viewing_appointments', { ...appt, userId: get().userId })
        get().toast('Viewing requested', `Requested for ${date} at ${time}. We will confirm shortly.`)
      },
      cancelViewingRequest: (id) => {
        set({ viewingAppointments: get().viewingAppointments.map((v) => (v.id === id ? { ...v, status: 'cancelled' } : v)) })
        writePatch('viewing_appointments', id, { status: 'cancelled' })
        get().toast('Viewing cancelled', 'The consultant has been notified.', 'info')
      },
      addBuyerRequest: (r) => {
        const request: BuyerRequest = { id: uid('br'), ...r, status: 'Active', createdAt: nowIso() }
        set({ buyerRequests: [request, ...get().buyerRequests] })
        writeRow('buyer_requests', { ...request, userId: get().userId })
        get().toast('Buyer request submitted', 'Verified agencies can now send matching proposals.')
      },
    }),
    {
      name: 'nawyati-preferences-v1',
      partialize: (s) => ({
        language: s.language,
        theme: s.theme,
        sidebarCollapsed: s.sidebarCollapsed,
        selectedPipeline: s.selectedPipeline,
      }),
    },
  ),
)

setRepoErrorHandler((message) => {
  const store = useAppStore.getState()
  store.toast('Sync error', message, 'error')
})

export const useActiveCompany = () => useAppStore((s) => s.companies.find((c) => c.id === s.activeCompanyId) ?? s.companies[0] ?? emptyCompany)
export const useActiveEmployee = () => useAppStore((s) => s.employees.find((e) => e.id === s.profile?.employeeId) ?? s.employees[0] ?? emptyEmployee)
export const useCompanyEmployees = () => useAppStore(useShallow((s) => s.employees.filter((e) => e.companyId === s.activeCompanyId)))
export const useCompanyLeads = () => useAppStore(useShallow((s) => s.leads.filter((l) => l.companyId === s.activeCompanyId)))
export const useCompanyDeals = () => useAppStore(useShallow((s) => s.deals.filter((d) => d.companyId === s.activeCompanyId)))
export const useCompanyProperties = () => useAppStore(useShallow((s) => s.properties.filter((p) => p.companyId === s.activeCompanyId)))
export const useCompanyTransactions = () => useAppStore(useShallow((s) => s.transactions.filter((t) => t.companyId === s.activeCompanyId)))
export const useCompanyCommissions = () => useAppStore(useShallow((s) => s.commissions.filter((t) => t.companyId === s.activeCompanyId)))
export const useCompanyTasks = () => useAppStore(useShallow((s) => s.tasks.filter((t) => t.companyId === s.activeCompanyId)))
export const useCompanyConversations = () => useAppStore(useShallow((s) => s.conversations.filter((t) => t.companyId === s.activeCompanyId)))
export const useCompanyNotifications = () => useAppStore(useShallow((s) => s.notifications.filter((n) => !n.companyId || n.companyId === s.activeCompanyId)))
