export const statusTone: Record<string, 'default' | 'navy' | 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'outline'> = {
  new: 'blue', contacted: 'amber', qualified: 'green', interested: 'purple', viewing: 'purple',
  negotiation: 'amber', won: 'green', lost: 'red', available: 'green', reserved: 'amber', sold: 'blue',
  rented: 'purple', unavailable: 'default', pending_review: 'amber', pending: 'amber', negotiation_req: 'amber',
  accepted: 'green', rejected: 'red', completed: 'green', cancelled: 'default', open: 'blue',
  in_progress: 'amber', resolved: 'green', closed: 'default', active: 'green', trial: 'blue',
  past_due: 'red', suspended: 'red', on_leave: 'amber', inactive: 'default', draft: 'default',
  published: 'green', archived: 'default', paid: 'green', overdue: 'red', todo: 'default', done: 'green',
  urgent: 'red', high: 'amber', medium: 'blue', low: 'default', planned: 'default', scheduled: 'blue',
  no_show: 'red', requested: 'amber', confirmed: 'green', negotiation_status: 'amber', signed: 'green',
  trial_active: 'blue', vip: 'purple', buyer: 'blue', seller: 'purple', tenant: 'amber', investor: 'green',
  low_priority: 'default', selling: 'green', sold_out: 'blue', upcoming: 'amber', planning: 'default',
  construction: 'amber', delivered: 'green', on_time: 'green', delayed: 'red',
}

export const sourceLabel: Record<string, string> = {
  website: 'Website', whatsapp: 'WhatsApp', facebook: 'Facebook', instagram: 'Instagram',
  referral: 'Referral', walk_in: 'Walk-in', call_center: 'Call center', broker: 'Broker', campaign: 'Campaign',
}

export const roleLabel: Record<string, string> = {
  super_admin: 'Super Admin', owner: 'Company Owner', manager: 'Sales Manager', agent: 'Sales Agent',
  developer: 'Property Developer', broker: 'Independent Broker', customer: 'Customer',
}

export const sourceColors = ['#142B45', '#10B981', '#0EA5E9', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#64748B', '#EF4444']
