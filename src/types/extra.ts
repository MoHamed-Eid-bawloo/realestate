export interface Inquiry {
  id: string
  propertyId: string
  propertyTitle: string
  name: string
  phone: string
  message: string
  at: string
  status: 'pending' | 'contacted' | 'closed'
}
