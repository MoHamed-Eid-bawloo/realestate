export type Lang = 'en' | 'ar';
export type Theme = 'light' | 'dark';

export type Role =
  | 'super_admin'
  | 'owner'
  | 'manager'
  | 'agent'
  | 'developer'
  | 'broker'
  | 'customer';

export type PropertyType =
  | 'apartment'
  | 'villa'
  | 'townhouse'
  | 'penthouse'
  | 'duplex'
  | 'chalet'
  | 'office'
  | 'retail';

export type ListingType = 'sale' | 'rent' | 'resale';
export type PropertyStatus =
  | 'available'
  | 'reserved'
  | 'sold'
  | 'rented'
  | 'unavailable'
  | 'pending_review';
export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'interested'
  | 'viewing'
  | 'negotiation'
  | 'won'
  | 'lost';
export type LeadSource =
  | 'website'
  | 'whatsapp'
  | 'facebook'
  | 'instagram'
  | 'referral'
  | 'walk_in'
  | 'call_center'
  | 'broker'
  | 'campaign';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type DealStage =
  | 'new'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'reservation'
  | 'won'
  | 'lost';
export type PipelineId = 'primary' | 'resale' | 'rental' | 'commercial' | 'developer';
export type CooperationStatus =
  | 'pending'
  | 'negotiation'
  | 'accepted'
  | 'rejected'
  | 'completed'
  | 'cancelled';

export interface Company {
  id: string;
  name: string;
  nameAr: string;
  type: 'brokerage' | 'developer' | 'hybrid';
  license: string;
  verified: boolean;
  status: 'active' | 'pending' | 'suspended';
  subscriptionId: string;
  branches: number;
  rating: number;
  employees: number;
  createdAt: string;
  logoColor: string;
  email: string;
  phone: string;
  city: string;
}

export interface Developer {
  id: string;
  name: string;
  nameAr: string;
  logoColor: string;
  verified: boolean;
  founded: number;
  projects: number;
  description: string;
  email: string;
  phone: string;
}

export interface Employee {
  id: string;
  companyId: string;
  name: string;
  nameAr: string;
  role: 'owner' | 'manager' | 'agent';
  title: string;
  titleAr: string;
  email: string;
  phone: string;
  teamId: string;
  managerId?: string;
  avatarColor: string;
  target: number;
  achieved: number;
  leadsAssigned: number;
  dealsWon: number;
  conversion: number;
  status: 'active' | 'on_leave' | 'inactive';
  joinedAt: string;
  attendance: number;
  permissions: string[];
}

export interface Team {
  id: string;
  companyId: string;
  name: string;
  nameAr: string;
  managerId: string;
  memberIds: string[];
  target: number;
  achieved: number;
  territory: string;
}

export interface PaymentPlan {
  downPaymentPct: number;
  years: number;
  monthly: number;
  deliveryDate: string;
}

export interface Property {
  id: string;
  code: string;
  title: string;
  titleAr: string;
  type: PropertyType;
  listingType: ListingType;
  location: string;
  locationAr: string;
  address: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  floor: number;
  finishing: 'finished' | 'semi_finished' | 'core_shell';
  deliveryDate: string;
  readyToMove: boolean;
  developerId?: string;
  projectId?: string;
  companyId: string;
  brokerId?: string;
  ownerName: string;
  status: PropertyStatus;
  listingStatus: 'published' | 'draft' | 'archived';
  verified: boolean;
  featured: boolean;
  images: string[];
  description: string;
  descriptionAr: string;
  amenities: string[];
  paymentPlan: PaymentPlan;
  lat: number;
  lng: number;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  developerId: string;
  name: string;
  nameAr: string;
  location: string;
  description: string;
  descriptionAr: string;
  images: string[];
  amenities: string[];
  phases: { name: string; status: 'planning' | 'construction' | 'delivered'; delivery: string }[];
  priceFrom: number;
  totalUnits: number;
  availableUnits: number;
  reservedUnits: number;
  soldUnits: number;
  deliveryDate: string;
  status: 'selling' | 'sold_out' | 'upcoming';
  featured: boolean;
}

export interface Unit {
  id: string;
  projectId: string;
  developerId: string;
  building: string;
  floor: number;
  unitNumber: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  price: number;
  type: PropertyType;
  status: 'available' | 'reserved' | 'sold';
  brokerId?: string;
  deliveryDate: string;
  paymentPlan: PaymentPlan;
}

export interface Note {
  id: string;
  author: string;
  text: string;
  at: string;
}

export interface Activity {
  id: string;
  type: 'call' | 'whatsapp' | 'email' | 'meeting' | 'viewing' | 'note' | 'status' | 'system' | 'task';
  title: string;
  detail: string;
  at: string;
  actor: string;
}

export interface Lead {
  id: string;
  companyId: string;
  name: string;
  nameAr?: string;
  phone: string;
  email: string;
  source: LeadSource;
  campaign?: string;
  location: string;
  budgetMin: number;
  budgetMax: number;
  propertyType: PropertyType;
  preferredArea: string;
  paymentPreference: 'cash' | 'installments' | 'mortgage';
  assigneeId: string;
  status: LeadStatus;
  priority: Priority;
  score: number;
  notes: Note[];
  activities: Activity[];
  lastContact: string;
  nextFollowUp: string;
  createdAt: string;
  lostReason?: string;
  tags: string[];
}

export interface Customer {
  id: string;
  companyId: string;
  name: string;
  nameAr?: string;
  phone: string;
  email: string;
  type: 'buyer' | 'seller' | 'tenant' | 'investor';
  budgetMin: number;
  budgetMax: number;
  preferredLocations: string[];
  preferredType: PropertyType;
  bedrooms: number;
  assignedTo: string;
  createdAt: string;
  avatarColor: string;
  notes: Note[];
  lastInteraction: string;
  source: LeadSource;
  timeline: Activity[];
}

export interface Deal {
  id: string;
  code: string;
  companyId: string;
  customerId?: string;
  customerName: string;
  propertyId: string;
  propertyTitle: string;
  value: number;
  stage: DealStage;
  pipelineId: PipelineId;
  agentId: string;
  developerId?: string;
  brokerId?: string;
  probability: number;
  expectedClose: string;
  reservationStatus: 'none' | 'pending' | 'confirmed';
  contractStatus: 'none' | 'draft' | 'signed';
  commissionPct: number;
  createdAt: string;
  updatedAt: string;
  lastActivity: string;
  lostReason?: string;
  cooperationId?: string;
}

export interface Transaction {
  id: string;
  companyId: string;
  dealId: string;
  customerName: string;
  propertyTitle: string;
  amount: number;
  commission: number;
  date: string;
  status: 'completed' | 'pending' | 'overdue';
  type: 'sale' | 'rent' | 'resale';
  invoiceNo: string;
  agentId: string;
}

export interface Broker {
  id: string;
  name: string;
  companyId?: string;
  companyName: string;
  verified: boolean;
  rating: number;
  activeListings: number;
  dealsClosed: number;
  commissionRate: number;
  phone: string;
  avatarColor: string;
  zone: string;
}

export interface Commission {
  id: string;
  companyId: string;
  dealId: string;
  beneficiaryId: string;
  beneficiaryName: string;
  role: 'company' | 'agent' | 'broker' | 'partner';
  amount: number;
  pct: number;
  status: 'paid' | 'pending' | 'overdue';
  dueDate: string;
  paidAt?: string;
}

export interface CooperationRequest {
  id: string;
  code: string;
  requestingCompanyId: string;
  owningCompanyId: string;
  propertyId: string;
  requesterBrokerId: string;
  ownerBrokerId: string;
  customerNameMasked: string;
  customerProtected: boolean;
  commissionPct: number;
  commissionSplit: { party: string; pct: number }[];
  status: CooperationStatus;
  terms: string;
  createdAt: string;
  updatedAt: string;
  milestones: { label: string; done: boolean; date: string }[];
  activities: Activity[];
  notes: Note[];
  dispute?: 'none' | 'open' | 'resolved';
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  userLimit: number;
  propertyLimit: number;
  features: string[];
  popular?: boolean;
}

export interface Subscription {
  companyId: string;
  planId: string;
  status: 'active' | 'trial' | 'past_due' | 'cancelled';
  renewalDate: string;
  seatsUsed: number;
  propertyCount: number;
}

export interface Notification {
  id: string;
  companyId?: string;
  type:
    | 'lead'
    | 'assignment'
    | 'followup'
    | 'cooperation'
    | 'cooperation_accepted'
    | 'reservation'
    | 'property'
    | 'commission'
    | 'payment'
    | 'message'
    | 'approval';
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  category: 'crm' | 'properties' | 'exchange' | 'finance' | 'system';
  href?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: 'customer' | 'agent' | 'system';
  text: string;
  at: string;
  channel: 'whatsapp' | 'email' | 'chat' | 'note';
}

export interface Conversation {
  id: string;
  companyId: string;
  customerName: string;
  customerId?: string;
  channel: 'whatsapp' | 'email' | 'chat';
  phone: string;
  avatarColor: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
  assigneeId: string;
  status: 'open' | 'pending' | 'closed';
  messages: Message[];
  aiSummary?: string;
}

export interface Task {
  id: string;
  companyId: string;
  title: string;
  type: 'call' | 'whatsapp' | 'email' | 'meeting' | 'viewing' | 'document' | 'contract' | 'payment';
  priority: Priority;
  status: 'todo' | 'in_progress' | 'done';
  dueDate: string;
  assigneeId: string;
  customerName?: string;
  propertyTitle?: string;
  notes?: string;
  reminder?: boolean;
}

export interface Viewing {
  id: string;
  companyId: string;
  customerName: string;
  propertyTitle: string;
  agentId: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
}

export interface SupportTicket {
  id: string;
  code: string;
  companyId: string;
  customerName: string;
  subject: string;
  category: 'maintenance' | 'complaint' | 'payment' | 'delivery' | 'inquiry';
  priority: Priority;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  description: string;
  satisfaction?: number;
}

export interface Workflow {
  id: string;
  companyId: string;
  name: string;
  description: string;
  trigger: string;
  conditions: { field: string; operator: string; value: string }[];
  actions: { type: string; value: string }[];
  enabled: boolean;
  runs: number;
  lastRun: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: string;
  createdAt: string;
  alerts: boolean;
}

export interface ViewingAppointment {
  id: string;
  propertyId: string;
  customerName: string;
  date: string;
  time: string;
  status: 'requested' | 'confirmed' | 'completed' | 'cancelled';
  agentName: string;
}

export interface RolePermission {
  role: string;
  description: string;
  members: number;
  permissions: string[];
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  target: string;
}

export interface CrmSettings {
  leadSources: string[]
  propertyTypes: string[]
  activityTypes: string[]
  customFields: { id: string; entity: string; label: string; type: string; required: boolean }[]
  commissionRules: { id: string; name: string; pct: number; appliesTo: string }[]
  notificationPrefs: { email: boolean; whatsapp: boolean; push: boolean; digest: boolean }
  autoAssign: boolean
  currency: string
}

export interface PlatformSettings {
  name: string
  supportEmail: string
  defaultCurrency: string
  timezone: string
  marketplaceEnabled: boolean
  exchangeEnabled: boolean
  aiAssistantEnabled: boolean
  developerPortalEnabled: boolean
  autoModeration: boolean
  maintenanceMode: boolean
  minListingPrice: number
  maxListingsPerCompany: number
}

export interface BuyerRequest {
  id: string
  title: string
  locations: string[]
  budget: number
  status: string
  createdAt: string
}

export interface Profile {
  id: string
  email: string
  fullName: string
  role: Role
  companyId?: string | null
  developerId?: string | null
  brokerId?: string | null
  employeeId?: string | null
  avatarColor: string
  language: Lang
  theme: Theme
  createdAt?: string
}

export interface SearchFilters {
  q: string;
  listingType: ListingType | 'all';
  type: PropertyType | 'all';
  location: string;
  minPrice: number;
  maxPrice: number;
  bedrooms: number;
  bathrooms: number;
  developerId: string;
  projectId: string;
  finishing: string;
  readyToMove: boolean;
  verifiedOnly: boolean;
  sort: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
