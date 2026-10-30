import type { LucideIcon } from 'lucide-react'
import {
  Activity, BadgeCheck, BarChart3, Bell, Bookmark, BrainCircuit, BriefcaseBusiness, Building2, CalendarCheck,
  CalendarDays, ChartPie, ClipboardCheck, Contact, Copy, CreditCard, Database, Eye, FileSignature, FileText,
  FileX2, Flag, GitBranch, GitPullRequest, Globe2, Handshake, History, Home, Inbox, Landmark, Layers,
  LayoutDashboard, LifeBuoy, Lightbulb, LineChart, ListTodo, LockKeyhole, Mail, MapPin, MapPinned, MessageCircle,
  MessagesSquare, Network, Percent, PhoneCall, PieChart, Radio, ReceiptText, Settings, ShieldAlert, ShieldCheck,
  SlidersHorizontal, Smartphone, Sparkles, Star, StickyNote, Store, Tags, Target, TrendingUp, Trophy, UserCheck,
  UserCog, Users, UsersRound, Video, Wallet, Workflow, Wrench,
} from 'lucide-react'
import type { Role } from '@/types'

export interface NavItem {
  label: string
  href: string
  icon?: LucideIcon
  tab?: string
  roles?: Role[]
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

const crmRoles: Role[] = ['super_admin', 'owner', 'manager', 'agent']
const managerOnly: Role[] = ['super_admin', 'owner', 'manager']

export const crmNav: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Executive Dashboard', href: '/crm', icon: LayoutDashboard },
      { label: 'Sales Overview', href: '/crm/sales', icon: TrendingUp },
      { label: 'Activity Overview', href: '/crm/activity', icon: Activity },
      { label: 'Sales Forecast', href: '/crm/forecast', icon: Target },
    ],
  },
  {
    label: 'Leads & Customers',
    items: [
      { label: 'All Leads', href: '/crm/leads', icon: Users },
      { label: 'Lead Inbox', href: '/crm/leads?tab=inbox', icon: Inbox },
      { label: 'Lead Sources', href: '/crm/leads?tab=sources', icon: Radio },
      { label: 'Lead Distribution', href: '/crm/leads?tab=distribution', icon: GitBranch },
      { label: 'Lead Scoring', href: '/crm/leads?tab=scoring', icon: PieChart },
      { label: 'Lead Segments', href: '/crm/leads?tab=segments', icon: Tags },
      { label: 'Customers', href: '/crm/customers', icon: Contact },
      { label: 'Customer 360', href: '/crm/customers?tab=360', icon: UserCheck },
      { label: 'Duplicate Management', href: '/crm/leads?tab=duplicates', icon: Copy },
    ],
  },
  {
    label: 'Sales Management',
    items: [
      { label: 'Sales Pipelines', href: '/crm/pipeline', icon: Layers },
      { label: 'Opportunities', href: '/crm/pipeline?tab=opportunities', icon: Lightbulb },
      { label: 'Deals', href: '/crm/pipeline?tab=deals', icon: Handshake },
      { label: 'Transactions', href: '/crm/pipeline?tab=transactions', icon: ReceiptText },
      { label: 'Reservations', href: '/crm/pipeline?tab=reservations', icon: Bookmark },
      { label: 'Contracts', href: '/crm/pipeline?tab=contracts', icon: FileSignature },
      { label: 'Lost Deals', href: '/crm/pipeline?tab=lost', icon: FileX2 },
      { label: 'Sales Forecasting', href: '/crm/pipeline?tab=forecast', icon: BarChart3 },
    ],
  },
  {
    label: 'Sales Operations',
    items: [
      { label: 'Sales Teams', href: '/crm/operations', icon: UsersRound },
      { label: 'Employees', href: '/crm/operations?tab=employees', icon: UserCog },
      { label: 'Sales Targets', href: '/crm/operations?tab=targets', icon: Target, roles: managerOnly },
      { label: 'Sales Territories', href: '/crm/operations?tab=territories', icon: MapPinned, roles: managerOnly },
      { label: 'Agent Performance', href: '/crm/operations?tab=performance', icon: Trophy },
      { label: 'Team Performance', href: '/crm/operations?tab=teams', icon: Users, roles: managerOnly },
      { label: 'Assignment Rules', href: '/crm/operations?tab=rules', icon: GitPullRequest, roles: managerOnly },
      { label: 'Approval Requests', href: '/crm/operations?tab=approvals', icon: ClipboardCheck, roles: managerOnly },
    ],
  },
  {
    label: 'Activities & Productivity',
    items: [
      { label: 'Tasks', href: '/crm/activities', icon: ListTodo },
      { label: 'Follow-ups', href: '/crm/activities?tab=follow-ups', icon: PhoneCall },
      { label: 'Calendar', href: '/crm/activities?tab=calendar', icon: CalendarDays },
      { label: 'Meetings', href: '/crm/activities?tab=meetings', icon: Video },
      { label: 'Property Viewings', href: '/crm/activities?tab=viewings', icon: Eye },
      { label: 'Call Logs', href: '/crm/activities?tab=calls', icon: History },
      { label: 'Activity Timeline', href: '/crm/activities?tab=timeline', icon: Activity },
    ],
  },
  {
    label: 'Communication Center',
    items: [
      { label: 'Unified Inbox', href: '/crm/inbox', icon: MessagesSquare },
      { label: 'WhatsApp', href: '/crm/inbox?tab=whatsapp', icon: MessageCircle },
      { label: 'Emails', href: '/crm/inbox?tab=email', icon: Mail },
      { label: 'Website Chat', href: '/crm/inbox?tab=chat', icon: Globe2 },
      { label: 'Call History', href: '/crm/inbox?tab=calls', icon: PhoneCall },
      { label: 'Message Templates', href: '/crm/inbox?tab=templates', icon: FileText, roles: managerOnly },
      { label: 'Internal Notes', href: '/crm/inbox?tab=notes', icon: StickyNote },
    ],
  },
  {
    label: 'Automation & AI',
    items: [
      { label: 'Workflow Builder', href: '/crm/automation', icon: Workflow },
      { label: 'Automation Rules', href: '/crm/automation?tab=rules', icon: GitPullRequest },
      { label: 'AI Sales Assistant', href: '/crm/ai', icon: Sparkles },
      { label: 'AI Lead Scoring', href: '/crm/ai?tab=scoring', icon: BrainCircuit },
      { label: 'Smart Recommendations', href: '/crm/ai?tab=recommendations', icon: Lightbulb },
      { label: 'AI Sales Insights', href: '/crm/ai?tab=insights', icon: LineChart },
    ],
  },
  {
    label: 'Customer Success',
    items: [
      { label: 'Support Tickets', href: '/crm/success', icon: LifeBuoy },
      { label: 'Complaints', href: '/crm/success?tab=complaints', icon: ShieldAlert },
      { label: 'After-Sales', href: '/crm/success?tab=after-sales', icon: Handshake },
      { label: 'Customer Satisfaction', href: '/crm/success?tab=csat', icon: Star },
      { label: 'Maintenance Requests', href: '/crm/success?tab=maintenance', icon: Wrench },
    ],
  },
  {
    label: 'CRM Intelligence',
    items: [
      { label: 'Sales Reports', href: '/crm/reports', icon: BarChart3 },
      { label: 'Conversion Analytics', href: '/crm/reports?tab=conversion', icon: ChartPie },
      { label: 'Lead Source Analytics', href: '/crm/reports?tab=sources', icon: Radio },
      { label: 'Agent Performance', href: '/crm/reports?tab=agents', icon: Trophy },
      { label: 'Revenue Analytics', href: '/crm/reports?tab=revenue', icon: Wallet },
      { label: 'Pipeline Analytics', href: '/crm/reports?tab=pipeline', icon: Layers },
      { label: 'Custom Reports', href: '/crm/reports?tab=custom', icon: FileText },
    ],
  },
  {
    label: 'CRM Configuration',
    items: [
      { label: 'Custom Fields', href: '/crm/settings?tab=fields', icon: Database, roles: managerOnly },
      { label: 'Custom Pipelines', href: '/crm/settings?tab=pipelines', icon: GitBranch, roles: managerOnly },
      { label: 'Lead Statuses', href: '/crm/settings?tab=statuses', icon: Flag, roles: managerOnly },
      { label: 'Activity Types', href: '/crm/settings?tab=activities', icon: Activity, roles: managerOnly },
      { label: 'Lead Assignment Rules', href: '/crm/settings?tab=assignment', icon: GitPullRequest, roles: managerOnly },
      { label: 'Roles & Permissions', href: '/crm/settings?tab=roles', icon: LockKeyhole, roles: managerOnly },
      { label: 'CRM Settings', href: '/crm/settings', icon: Settings, roles: managerOnly },
    ],
  },
]

export const workspaceNav: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { label: 'Inventory', href: '/inventory', icon: Building2, roles: crmRoles },
      { label: 'Finance', href: '/finance', icon: Wallet, roles: ['super_admin', 'owner', 'manager', 'developer', 'broker'] },
      { label: 'Analytics', href: '/analytics', icon: BarChart3, roles: ['super_admin', 'owner', 'manager', 'developer', 'broker'] },
      { label: 'Notifications', href: '/notifications', icon: Bell, roles: ['super_admin', 'owner', 'manager', 'agent', 'developer', 'broker'] },
      { label: 'Settings', href: '/settings', icon: Settings, roles: ['super_admin', 'owner', 'manager', 'agent', 'developer', 'broker'] },
    ],
  },
]

export const developerNav: NavGroup[] = [
  {
    label: 'Developer Portal',
    items: [
      { label: 'Overview', href: '/developer', icon: LayoutDashboard },
      { label: 'Projects', href: '/developer/projects', icon: Building2 },
      { label: 'Unit Inventory', href: '/developer/units', icon: Layers },
      { label: 'Broker Activity', href: '/developer/brokers', icon: Handshake },
      { label: 'Sales Performance', href: '/developer/sales', icon: TrendingUp },
    ],
  },
]

export const exchangeNav: NavGroup[] = [
  {
    label: 'Broker Network',
    items: [
      { label: 'Exchange Marketplace', href: '/exchange', icon: Store },
      { label: 'Cooperation Requests', href: '/exchange/requests', icon: Handshake },
      { label: 'Commission Management', href: '/exchange/commissions', icon: Percent },
      { label: 'Trust & Protection', href: '/exchange/trust', icon: ShieldCheck },
      { label: 'Partner Network', href: '/exchange/network', icon: Network },
    ],
  },
]

export const adminNav: NavGroup[] = [
  {
    label: 'Platform Administration',
    items: [
      { label: 'Platform Overview', href: '/admin', icon: LayoutDashboard },
      { label: 'Companies', href: '/admin/companies', icon: Building2 },
      { label: 'Users', href: '/admin/users', icon: Users },
      { label: 'Marketplace Moderation', href: '/admin/moderation', icon: ShieldCheck },
      { label: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
      { label: 'Platform Settings', href: '/admin/settings', icon: Settings },
    ],
  },
]

export function navForRole(role: Role): NavGroup[] {
  if (role === 'super_admin') return [...adminNav, ...crmNav.map((g) => ({ ...g, items: g.items.map((i) => ({ ...i, roles: undefined })) })), ...workspaceNav]
  if (role === 'developer') return [...developerNav, ...workspaceNav]
  if (role === 'broker') return [...exchangeNav, ...workspaceNav]
  if (role === 'customer') return []
  return [
    ...crmNav.map((g) => ({ ...g, items: g.items.filter((i) => !i.roles || i.roles.includes(role)) })),
    ...workspaceNav.map((g) => ({ ...g, items: g.items.filter((i) => !i.roles || i.roles.includes(role)) })),
  ].filter((g) => g.items.length > 0)
}

export function defaultPathForRole(role: Role): string {
  if (role === 'super_admin') return '/admin'
  if (role === 'developer') return '/developer'
  if (role === 'broker') return '/exchange'
  if (role === 'customer') return '/account'
  return '/crm'
}

export const roleIcons: Record<Role, LucideIcon> = {
  super_admin: ShieldCheck,
  owner: Landmark,
  manager: UsersRound,
  agent: BriefcaseBusiness,
  developer: Building2,
  broker: Handshake,
  customer: Home,
}

export const roleSummaries: Record<Role, string> = {
  super_admin: 'Manage companies, users, moderation and platform revenue.',
  owner: 'Company-wide CRM, finance, inventory and analytics.',
  manager: 'Team pipeline, assignment, approvals and performance.',
  agent: 'Your leads, tasks, viewings and personal pipeline.',
  developer: 'Projects, unit inventory and broker sales activity.',
  broker: 'Cooperation network, shared inventory and commissions.',
  customer: 'Saved homes, searches, inquiries and viewings.',
}
