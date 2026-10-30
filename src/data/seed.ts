import type {
  AuditEntry, Broker, Commission, Company, CooperationRequest, Conversation, Customer, Deal,
  Developer, Employee, Lead, LeadSource, LeadStatus, Notification, Project, Property, RolePermission, SavedSearch,
  Subscription, SubscriptionPlan, SupportTicket, Task, Team, Transaction, Unit, Viewing, Workflow,
} from '@/types'

const iso = (days: number, hour = 10) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}
const img = (n: number) => `/img/p${n}.jpg`
const plan = (downPaymentPct: number, years: number, monthly: number, deliveryDate: string) => ({
  downPaymentPct, years, monthly, deliveryDate,
})

export const companies: Company[] = [
  { id: 'c1', name: 'Nile Crest Realty', nameAr: 'نايل كريست العقارية', type: 'brokerage', license: 'EG-BRK-10482', verified: true, status: 'active', subscriptionId: 'sub1', branches: 4, rating: 4.8, employees: 9, createdAt: iso(-820), logoColor: '#142B45', email: 'hello@nilecrest.eg', phone: '+20 2 2461 8800', city: 'New Cairo' },
  { id: 'c2', name: 'Cairo Prime Properties', nameAr: 'كايرو برايم العقارية', type: 'brokerage', license: 'EG-BRK-11924', verified: true, status: 'active', subscriptionId: 'sub2', branches: 2, rating: 4.6, employees: 5, createdAt: iso(-540), logoColor: '#0F766E', email: 'sales@cairoprime.eg', phone: '+20 2 2735 4410', city: 'Sheikh Zayed' },
  { id: 'c3', name: 'Delta Homes', nameAr: 'دلتا هومز', type: 'brokerage', license: 'EG-BRK-13006', verified: true, status: 'active', subscriptionId: 'sub3', branches: 1, rating: 4.3, employees: 3, createdAt: iso(-300), logoColor: '#334E68', email: 'team@deltahomes.eg', phone: '+20 2 2358 9921', city: 'Maadi' },
  { id: 'c4', name: 'Capital Estates', nameAr: 'كابيتال إستيتس', type: 'hybrid', license: 'EG-BRK-14220', verified: false, status: 'pending', subscriptionId: 'sub4', branches: 1, rating: 4.1, employees: 2, createdAt: iso(-48), logoColor: '#B45309', email: 'info@capitalestates.eg', phone: '+20 2 2345 7712', city: 'New Administrative Capital' },
  { id: 'c5', name: 'North Coast Realty', nameAr: 'نورث كوست العقارية', type: 'brokerage', license: 'EG-BRK-12871', verified: true, status: 'active', subscriptionId: 'sub1', branches: 2, rating: 4.5, employees: 4, createdAt: iso(-410), logoColor: '#0369A1', email: 'coast@northrealty.eg', phone: '+20 3 584 1120', city: 'New Alamein' },
  { id: 'c6', name: 'Atrium Real Estate', nameAr: 'أتريوم العقارية', type: 'brokerage', license: 'EG-BRK-15502', verified: false, status: 'suspended', subscriptionId: 'sub3', branches: 1, rating: 3.6, employees: 2, createdAt: iso(-190), logoColor: '#7C3AED', email: 'contact@atrium.eg', phone: '+20 2 2417 3300', city: 'Nasr City' },
]

export const developers: Developer[] = [
  { id: 'd1', name: 'Aurora Developments', nameAr: 'أورورا للتطوير العقاري', logoColor: '#142B45', verified: true, founded: 2008, projects: 4, description: 'Design-led communities across East and West Cairo, known for generous green spaces and on-time delivery.', email: 'partners@aurora-dev.eg', phone: '+20 2 2524 9000' },
  { id: 'd2', name: 'Misr Grand Developments', nameAr: 'مصر جراند للتطوير', logoColor: '#0F766E', verified: true, founded: 2001, projects: 3, description: 'Large-scale mixed-use developments in Mostakbal City and the New Administrative Capital.', email: 'brokers@misrgrand.eg', phone: '+20 2 2690 3300' },
  { id: 'd3', name: 'Skyline Communities', nameAr: 'سكايلاين كوميونيتيز', logoColor: '#0369A1', verified: true, founded: 2012, projects: 4, description: 'Coastal and resort living on the North Coast with a focus on hospitality-grade amenities.', email: 'hello@skyline-dev.eg', phone: '+20 3 590 2211' },
  { id: 'd4', name: 'Nile Edge Development', nameAr: 'نايل إيدج للتطوير', logoColor: '#B45309', verified: false, founded: 2016, projects: 2, description: 'Boutique residential and commercial projects in emerging Cairo districts.', email: 'info@nileedge.eg', phone: '+20 2 2180 7744' },
]

export const employees: Employee[] = [
  { id: 'e1', companyId: 'c1', name: 'Tarek El-Masry', nameAr: 'طارق المصري', role: 'owner', title: 'Managing Director', titleAr: 'العضو المنتدب', email: 'tarek@nilecrest.eg', phone: '+20 100 123 4567', teamId: 't1', avatarColor: '#142B45', target: 180000000, achieved: 146000000, leadsAssigned: 8, dealsWon: 9, conversion: 31, status: 'active', joinedAt: iso(-820), attendance: 98, permissions: ['all'] },
  { id: 'e2', companyId: 'c1', name: 'Omar El-Shazly', nameAr: 'عمر الشاذلي', role: 'manager', title: 'Head of Sales', titleAr: 'مدير المبيعات', email: 'omar@nilecrest.eg', phone: '+20 100 234 5678', teamId: 't1', managerId: 'e1', avatarColor: '#0F766E', target: 72000000, achieved: 58400000, leadsAssigned: 18, dealsWon: 7, conversion: 28, status: 'active', joinedAt: iso(-760), attendance: 96, permissions: ['leads.*', 'deals.*', 'reports.view', 'team.manage'] },
  { id: 'e3', companyId: 'c1', name: 'Youssef Adel', nameAr: 'يوسف عادل', role: 'agent', title: 'Senior Property Consultant', titleAr: 'مستشار عقاري أول', email: 'youssef@nilecrest.eg', phone: '+20 101 345 6789', teamId: 't1', managerId: 'e2', avatarColor: '#334E68', target: 30000000, achieved: 27600000, leadsAssigned: 34, dealsWon: 6, conversion: 34, status: 'active', joinedAt: iso(-620), attendance: 94, permissions: ['leads.view', 'leads.edit', 'deals.view'] },
  { id: 'e4', companyId: 'c1', name: 'Mariam Fathy', nameAr: 'مريم فتحي', role: 'agent', title: 'Property Consultant', titleAr: 'مستشارة عقارية', email: 'mariam@nilecrest.eg', phone: '+20 102 456 7890', teamId: 't2', managerId: 'e2', avatarColor: '#B45309', target: 28000000, achieved: 25100000, leadsAssigned: 38, dealsWon: 5, conversion: 29, status: 'active', joinedAt: iso(-540), attendance: 97, permissions: ['leads.view', 'leads.edit', 'deals.view'] },
  { id: 'e5', companyId: 'c1', name: 'Karim Nabil', nameAr: 'كريم نبيل', role: 'agent', title: 'Property Consultant', titleAr: 'مستشار عقاري', email: 'karim@nilecrest.eg', phone: '+20 106 567 8901', teamId: 't2', managerId: 'e2', avatarColor: '#0369A1', target: 25000000, achieved: 18900000, leadsAssigned: 31, dealsWon: 4, conversion: 24, status: 'active', joinedAt: iso(-430), attendance: 91, permissions: ['leads.view', 'leads.edit'] },
  { id: 'e6', companyId: 'c1', name: 'Salma Hany', nameAr: 'سلمى هاني', role: 'agent', title: 'Resale Specialist', titleAr: 'متخصصة إعادة البيع', email: 'salma@nilecrest.eg', phone: '+20 106 678 9012', teamId: 't1', managerId: 'e2', avatarColor: '#7C3AED', target: 24000000, achieved: 21700000, leadsAssigned: 27, dealsWon: 4, conversion: 33, status: 'active', joinedAt: iso(-390), attendance: 99, permissions: ['leads.view', 'leads.edit', 'deals.view'] },
  { id: 'e7', companyId: 'c1', name: 'Ahmed Tarek', nameAr: 'أحمد طارق', role: 'agent', title: 'Property Consultant', titleAr: 'مستشار عقاري', email: 'ahmed.t@nilecrest.eg', phone: '+20 109 789 0123', teamId: 't2', managerId: 'e2', avatarColor: '#BE123C', target: 22000000, achieved: 12400000, leadsAssigned: 29, dealsWon: 3, conversion: 19, status: 'active', joinedAt: iso(-310), attendance: 88, permissions: ['leads.view'] },
  { id: 'e8', companyId: 'c1', name: 'Farida Samir', nameAr: 'فريدة سمير', role: 'agent', title: 'Client Experience Lead', titleAr: 'مسؤولة تجربة العملاء', email: 'farida@nilecrest.eg', phone: '+20 111 890 1234', teamId: 't2', managerId: 'e2', avatarColor: '#0F766E', target: 20000000, achieved: 16800000, leadsAssigned: 22, dealsWon: 3, conversion: 27, status: 'active', joinedAt: iso(-240), attendance: 95, permissions: ['leads.view', 'leads.edit', 'support.*'] },
  { id: 'e9', companyId: 'c1', name: 'Hossam Eldin', nameAr: 'حسام الدين', role: 'agent', title: 'Junior Consultant', titleAr: 'مستشار مبتدئ', email: 'hossam@nilecrest.eg', phone: '+20 112 901 2345', teamId: 't1', managerId: 'e2', avatarColor: '#475569', target: 15000000, achieved: 6900000, leadsAssigned: 26, dealsWon: 2, conversion: 15, status: 'on_leave', joinedAt: iso(-160), attendance: 82, permissions: ['leads.view'] },
  { id: 'e10', companyId: 'c2', name: 'Ingy Farouk', nameAr: 'إنجي فاروق', role: 'owner', title: 'Founder', titleAr: 'المؤسسة', email: 'ingy@cairoprime.eg', phone: '+20 100 445 1122', teamId: 't3', avatarColor: '#0F766E', target: 90000000, achieved: 71200000, leadsAssigned: 4, dealsWon: 5, conversion: 30, status: 'active', joinedAt: iso(-540), attendance: 97, permissions: ['all'] },
  { id: 'e11', companyId: 'c2', name: 'Nour Hassan', nameAr: 'نور حسن', role: 'manager', title: 'Sales Manager', titleAr: 'مديرة المبيعات', email: 'nour@cairoprime.eg', phone: '+20 101 556 2233', teamId: 't3', managerId: 'e10', avatarColor: '#0369A1', target: 45000000, achieved: 39800000, leadsAssigned: 11, dealsWon: 4, conversion: 32, status: 'active', joinedAt: iso(-470), attendance: 94, permissions: ['leads.*', 'deals.*', 'team.manage'] },
  { id: 'e12', companyId: 'c2', name: 'Laila Mostafa', nameAr: 'ليلى مصطفى', role: 'agent', title: 'Property Consultant', titleAr: 'مستشارة عقارية', email: 'laila@cairoprime.eg', phone: '+20 106 667 3344', teamId: 't3', managerId: 'e11', avatarColor: '#BE123C', target: 20000000, achieved: 18400000, leadsAssigned: 19, dealsWon: 3, conversion: 31, status: 'active', joinedAt: iso(-320), attendance: 93, permissions: ['leads.view', 'leads.edit'] },
  { id: 'e13', companyId: 'c2', name: 'Hassan Kamel', nameAr: 'حسن كامل', role: 'agent', title: 'Property Consultant', titleAr: 'مستشار عقاري', email: 'hassan@cairoprime.eg', phone: '+20 109 778 4455', teamId: 't3', managerId: 'e11', avatarColor: '#7C3AED', target: 18000000, achieved: 11900000, leadsAssigned: 16, dealsWon: 2, conversion: 22, status: 'active', joinedAt: iso(-260), attendance: 90, permissions: ['leads.view'] },
  { id: 'e14', companyId: 'c2', name: 'Dina Raafat', nameAr: 'دينا رأفت', role: 'agent', title: 'Client Advisor', titleAr: 'مستشارة عملاء', email: 'dina@cairoprime.eg', phone: '+20 111 889 5566', teamId: 't3', managerId: 'e11', avatarColor: '#B45309', target: 16000000, achieved: 9800000, leadsAssigned: 14, dealsWon: 2, conversion: 25, status: 'active', joinedAt: iso(-200), attendance: 96, permissions: ['leads.view', 'leads.edit'] },
]

export const teams: Team[] = [
  { id: 't1', companyId: 'c1', name: 'Alpha Sales', nameAr: 'فريق ألفا', managerId: 'e2', memberIds: ['e2', 'e3', 'e6', 'e9'], target: 72000000, achieved: 58400000, territory: 'New Cairo & East' },
  { id: 't2', companyId: 'c1', name: 'Delta Sales', nameAr: 'فريق دلتا', managerId: 'e2', memberIds: ['e4', 'e5', 'e7', 'e8'], target: 68000000, achieved: 51200000, territory: 'Sheikh Zayed & West' },
  { id: 't3', companyId: 'c2', name: 'Prime Team', nameAr: 'فريق برايم', managerId: 'e11', memberIds: ['e11', 'e12', 'e13', 'e14'], target: 45000000, achieved: 39800000, territory: 'West Cairo' },
]

const propBase = (
  n: number, companyId: string, title: string, titleAr: string, type: Property['type'], listingType: Property['listingType'],
  location: string, locationAr: string, price: number, area: number, bedrooms: number, bathrooms: number,
  status: Property['status'], imgNums: number[], extras: Partial<Property> = {},
): Property => ({
  id: `p${n}`, code: `NC-${String(1000 + n)}`, title, titleAr, type, listingType, location, locationAr,
  address: `${location}, Egypt`, price, area, bedrooms, bathrooms, floor: Math.max(0, (n % 4)),
  finishing: n % 5 === 0 ? 'semi_finished' : 'finished', deliveryDate: iso(120 + n * 18, 12),
  readyToMove: n % 4 === 0, developerId: `d${((n - 1) % 4) + 1}`, projectId: `pr${((n - 1) % 10) + 1}`,
  companyId, ownerName: ['Private owner', 'Nile Crest Portfolio', 'Aurora Developments', 'Investor portfolio'][n % 4],
  status, listingStatus: n === 9 ? 'draft' : 'published', verified: n % 7 !== 0, featured: n <= 6 || n === 8,
  images: imgNums.map(img), description: `A thoughtfully designed ${type} in ${location} with generous natural light, premium finishes and access to landscaped community amenities. Ideally positioned minutes from major roads, schools and retail.`,
  descriptionAr: `وحدة ${type === 'villa' ? 'فيلا' : type === 'office' ? 'مكتب' : 'سكنية'} بتصميم مدروس في ${locationAr}، بإضاءة طبيعية وفيرة وتشطيبات فاخرة ووصول سهل للطرق الرئيسية والمدارس والخدمات.`,
  amenities: ['Clubhouse', 'Swimming pool', '24/7 security', 'Landscaped gardens', 'Kids area', 'Underground parking'],
  paymentPlan: plan(10 + (n % 3) * 5, 6 + (n % 3), Math.round((price * 0.8) / ((6 + (n % 3)) * 12)), iso(150 + n * 12, 12)),
  lat: 30.02 + (n % 8) * 0.013, lng: 31.45 + (n % 6) * 0.019, views: 180 + n * 47,
  createdAt: iso(-(n * 9)), updatedAt: iso(-(n % 5)), ...extras,
})

export const properties: Property[] = [
  propBase(1, 'c1', 'The Palm Residence — 4BR Villa', 'فيلا بالم ريزيدنس — ٤ غرف', 'villa', 'sale', 'Sheikh Zayed', 'الشيخ زايد', 18500000, 420, 4, 4, 'available', [1, 8, 9], { featured: true }),
  propBase(2, 'c1', 'Skyline 3BR Garden Apartment', 'شقة سكايلاين ٣ غرف بحديقة', 'apartment', 'sale', 'New Cairo', 'القاهرة الجديدة', 8900000, 185, 3, 2, 'available', [2, 10, 11], { featured: true }),
  propBase(3, 'c1', 'Verdant Park Duplex', 'دوبلكس فيردانت بارك', 'duplex', 'sale', 'Mostakbal City', 'مدينة المستقبل', 11200000, 260, 4, 3, 'available', [3, 12, 13]),
  propBase(4, 'c1', 'Azure Bay Waterfront Chalet', 'شاليه أزور باي على البحر', 'chalet', 'sale', 'North Coast', 'الساحل الشمالي', 9800000, 160, 3, 2, 'available', [4, 5, 14], { featured: true }),
  propBase(5, 'c1', 'Executive Office — New Capital', 'مكتب تنفيذي — العاصمة الإدارية', 'office', 'rent', 'New Administrative Capital', 'العاصمة الإدارية', 85000, 140, 0, 2, 'available', [13, 2, 7]),
  propBase(6, 'c1', 'Family Apartment in Maadi', 'شقة عائلية في المعادي', 'apartment', 'resale', 'Maadi', 'المعادي', 6400000, 170, 3, 2, 'available', [6, 9, 11], { verified: true, featured: true }),
  propBase(7, 'c1', 'Penthouse with Private Roof', 'بنتهاوس بسطح خاص', 'penthouse', 'sale', 'Sheikh Zayed', 'الشيخ زايد', 14500000, 240, 4, 3, 'reserved', [7, 10, 12]),
  propBase(8, 'c1', 'Swan Lake Townhouse', 'تاون هاوس سوان ليك', 'townhouse', 'sale', '6th of October', 'السادس من أكتوبر', 12700000, 225, 4, 3, 'available', [8, 1, 3], { featured: true }),
  propBase(9, 'c1', 'Studio in New Alamein', 'استوديو في العلمين الجديدة', 'apartment', 'sale', 'New Alamein', 'العلمين الجديدة', 3200000, 75, 1, 1, 'pending_review', [9, 5, 14], { listingStatus: 'draft', verified: false }),
  propBase(10, 'c1', 'Retail Unit — 90th Street', 'وحدة تجارية — شارع التسعين', 'retail', 'rent', 'New Cairo', 'القاهرة الجديدة', 55000, 90, 0, 1, 'available', [10, 13, 6]),
  propBase(11, 'c1', 'Garden Apartment — October', 'شقة بحديقة — أكتوبر', 'apartment', 'sale', '6th of October', 'السادس من أكتوبر', 4800000, 150, 3, 2, 'sold', [11, 3, 12]),
  propBase(12, 'c1', 'Twin House in East Cairo', 'توين هاوس شرق القاهرة', 'townhouse', 'sale', 'New Cairo', 'القاهرة الجديدة', 15900000, 300, 5, 4, 'available', [12, 1, 8], { featured: true }),
  propBase(13, 'c2', 'Contemporary Villa — New Zayed', 'فيلا معاصرة — زايد الجديدة', 'villa', 'sale', 'Sheikh Zayed', 'الشيخ زايد', 16900000, 380, 4, 4, 'available', [5, 1, 14], { companyId: 'c2', featured: true, verified: true }),
  propBase(14, 'c2', '2BR Apartment in Beverly Hills', 'شقة غرفتين في بيفرلي هيلز', 'apartment', 'sale', 'Sheikh Zayed', 'الشيخ زايد', 7100000, 145, 2, 2, 'available', [14, 2, 6], { companyId: 'c2' }),
  propBase(15, 'c2', 'Rent — Family Duplex', 'إيجار — دوبلكس عائلي', 'duplex', 'rent', '6th of October', 'السادس من أكتوبر', 32000, 210, 4, 3, 'rented', [3, 7, 11], { companyId: 'c2' }),
  propBase(16, 'c2', 'Resale Penthouse — West Cairo', 'بنتهاوس إعادة بيع — غرب القاهرة', 'penthouse', 'resale', 'Sheikh Zayed', 'الشيخ زايد', 10400000, 205, 3, 3, 'available', [7, 10, 1], { companyId: 'c2' }),
  propBase(17, 'c3', 'Maadi Courtyard Apartment', 'شقة بفناء في المعادي', 'apartment', 'resale', 'Maadi', 'المعادي', 5900000, 160, 3, 2, 'available', [6, 10, 13], { companyId: 'c3' }),
  propBase(18, 'c3', 'Nile View Apartment', 'شقة بإطلالة على النيل', 'apartment', 'sale', 'Maadi', 'المعادي', 12500000, 250, 4, 3, 'reserved', [11, 6, 2], { companyId: 'c3', featured: true }),
  propBase(19, 'c4', 'D01 Residence — New Capital', 'ريزيدنس دي٠١ — العاصمة', 'apartment', 'sale', 'New Administrative Capital', 'العاصمة الإدارية', 7400000, 165, 3, 2, 'available', [2, 12, 9], { companyId: 'c4' }),
  propBase(20, 'c4', 'Capital Business Suite', 'مكتب أعمال في العاصمة', 'office', 'sale', 'New Administrative Capital', 'العاصمة الإدارية', 9800000, 120, 0, 2, 'available', [13, 4, 5], { companyId: 'c4' }),
  propBase(21, 'c5', 'Beachfront Chalet — Solana', 'شاليه على البحر — سولانا', 'chalet', 'sale', 'New Alamein', 'العلمين الجديدة', 8700000, 140, 2, 2, 'available', [4, 14, 5], { companyId: 'c5', featured: true, verified: true }),
  propBase(22, 'c5', 'North Coast Lagoon Townhouse', 'تاون هاوس على البحيرات', 'townhouse', 'resale', 'North Coast', 'الساحل الشمالي', 13800000, 230, 4, 3, 'available', [8, 4, 1], { companyId: 'c5' }),
]

const projectDefs: Project[] = [
  { id: 'pr1', developerId: 'd1', name: 'Aurora Gardens', nameAr: 'حدائق أورورا', location: 'New Cairo', description: 'A green residential community with 60% open space, walkable boulevards and a boutique clubhouse in the heart of East Cairo.', descriptionAr: 'مجتمع سكني أخضر بمساحات مفتوحة ٦٠٪ وممرات للمشي ونادي صغير في قلب شرق القاهرة.', images: [img(1), img(2), img(8)], amenities: ['Clubhouse', 'Pool', 'Padel courts', 'Business lounge', 'International school'], phases: [{ name: 'Phase 1', status: 'delivered', delivery: '2024' }, { name: 'Phase 2', status: 'construction', delivery: '2027' }, { name: 'Phase 3', status: 'planning', delivery: '2029' }], priceFrom: 7200000, totalUnits: 320, availableUnits: 0, reservedUnits: 0, soldUnits: 0, deliveryDate: iso(420, 12), status: 'selling', featured: true },
  { id: 'pr2', developerId: 'd1', name: 'Palm Grove', nameAr: 'بالم جروف', location: 'Sheikh Zayed', description: 'Low-rise residences arranged around palm-lined courtyards, designed for families seeking calm on the west side.', descriptionAr: 'وحدات منخفضة الارتفاع حول أفنية تحيط بها النخيل، مصممة للعائلات الباحثة عن الهدوء في غرب القاهرة.', images: [img(2), img(7), img(10)], amenities: ['Pool', 'Kids club', 'Landscaped gardens', 'Gym', 'Retail strip'], phases: [{ name: 'Phase 1', status: 'construction', delivery: '2027' }], priceFrom: 8600000, totalUnits: 180, availableUnits: 0, reservedUnits: 0, soldUnits: 0, deliveryDate: iso(500, 12), status: 'selling', featured: true },
  { id: 'pr3', developerId: 'd2', name: 'Verdant Park', nameAr: 'فيردانت بارك', location: 'Mostakbal City', description: 'A 42-acre masterplan with parks, cycling loops and a central lifestyle hub in Mostakbal City.', descriptionAr: 'مخطط رئيسي على مساحة ٤٢ فداناً بحدائق ومسارات دراجات ومركز حياة مركزي في مدينة المستقبل.', images: [img(3), img(12), img(9)], amenities: ['Central park', 'Cycling tracks', 'Clubhouse', 'Medical clinic', 'Retail'], phases: [{ name: 'Phase A', status: 'construction', delivery: '2026' }, { name: 'Phase B', status: 'planning', delivery: '2028' }], priceFrom: 5400000, totalUnits: 260, availableUnits: 0, reservedUnits: 0, soldUnits: 0, deliveryDate: iso(300, 12), status: 'selling', featured: true },
  { id: 'pr4', developerId: 'd3', name: 'Azure Bay', nameAr: 'أزور باي', location: 'North Coast', description: 'A lagoon-front resort community with a private beach, beach club and serviced chalets.', descriptionAr: 'مجتمع سياحي على البحيرات مع شاطئ خاص ونادي شاطئي وشاليهات مخدومة.', images: [img(4), img(5), img(14)], amenities: ['Private beach', 'Beach club', 'Lagoon', 'Spa', 'Water sports'], phases: [{ name: 'Phase 1', status: 'delivered', delivery: '2025' }, { name: 'Phase 2', status: 'construction', delivery: '2028' }], priceFrom: 7800000, totalUnits: 210, availableUnits: 0, reservedUnits: 0, soldUnits: 0, deliveryDate: iso(380, 12), status: 'selling', featured: true },
  { id: 'pr5', developerId: 'd4', name: 'Nile Crest Tower', nameAr: 'نايل كريست تاور', location: 'New Cairo', description: 'A boutique tower of 96 residences with hotel-style concierge and a rooftop residents lounge.', descriptionAr: 'برج بوتيك يضم ٩٦ وحدة سكنية مع خدمة كونسيرج وصالة سكان على السطح.', images: [img(11), img(2), img(6)], amenities: ['Concierge', 'Rooftop lounge', 'Gym', 'Valet', 'Co-working'], phases: [{ name: 'Only phase', status: 'construction', delivery: '2027' }], priceFrom: 6200000, totalUnits: 96, availableUnits: 0, reservedUnits: 0, soldUnits: 0, deliveryDate: iso(340, 12), status: 'selling', featured: false },
  { id: 'pr6', developerId: 'd2', name: 'The Address', nameAr: 'ذا أدرس', location: 'New Administrative Capital', description: 'Downtown living in the New Administrative Capital with direct access to the Green River promenade.', descriptionAr: 'حياة وسط المدينة في العاصمة الإدارية بوصول مباشر لممشى النهر الأخضر.', images: [img(12), img(13), img(2)], amenities: ['Green River access', 'Retail plaza', 'Pool', 'Gym', 'Business center'], phases: [{ name: 'Phase 1', status: 'construction', delivery: '2027' }], priceFrom: 6900000, totalUnits: 240, availableUnits: 0, reservedUnits: 0, soldUnits: 0, deliveryDate: iso(460, 12), status: 'selling', featured: true },
  { id: 'pr7', developerId: 'd1', name: 'Swan Lake', nameAr: 'سوان ليك', location: '6th of October', description: 'Townhouses and villas around a central lake, with a focus on family life and mature landscaping.', descriptionAr: 'تاون هاوس وفيلات حول بحيرة مركزية، مع تركيز على حياة الأسرة والمساحات الخضراء.', images: [img(8), img(1), img(3)], amenities: ['Lake', 'Clubhouse', 'Schools', 'Sports courts', 'Mosque'], phases: [{ name: 'Phase 1', status: 'delivered', delivery: '2023' }, { name: 'Phase 2', status: 'construction', delivery: '2026' }], priceFrom: 11200000, totalUnits: 150, availableUnits: 0, reservedUnits: 0, soldUnits: 0, deliveryDate: iso(200, 12), status: 'selling', featured: false },
  { id: 'pr8', developerId: 'd3', name: 'Solana', nameAr: 'سولانا', location: 'New Alamein', description: 'Mediterranean-inspired residences moments from the New Alamein promenade and yacht marina.', descriptionAr: 'وحدات سكنية بطابع متوسطي على بعد دقائق من ممشى العلمين الجديدة ومارينا اليخوت.', images: [img(14), img(5), img(4)], amenities: ['Marina access', 'Pool', 'Beach shuttle', 'Retail', 'Kids area'], phases: [{ name: 'Phase 1', status: 'construction', delivery: '2026' }, { name: 'Phase 2', status: 'planning', delivery: '2029' }], priceFrom: 4900000, totalUnits: 300, availableUnits: 0, reservedUnits: 0, soldUnits: 0, deliveryDate: iso(260, 12), status: 'selling', featured: true },
  { id: 'pr9', developerId: 'd3', name: 'Coastline Villas', nameAr: 'كوستلاين فيلاز', location: 'North Coast', description: 'A limited collection of 48 seafront villas with private pools and uninterrupted sea views.', descriptionAr: 'مجموعة محدودة من ٤٨ فيلا على البحر بمسابح خاصة وإطلالات بحرية مباشرة.', images: [img(5), img(1), img(4)], amenities: ['Private pools', 'Sea view', 'Beach service', 'Security', 'Concierge'], phases: [{ name: 'Only phase', status: 'construction', delivery: '2028' }], priceFrom: 24000000, totalUnits: 48, availableUnits: 0, reservedUnits: 0, soldUnits: 0, deliveryDate: iso(520, 12), status: 'selling', featured: false },
  { id: 'pr10', developerId: 'd4', name: 'Grand Central Offices', nameAr: 'جراند سنترال أوفيسز', location: 'New Administrative Capital', description: 'Grade-A offices and retail in the government district, with flexible floor plates from 120 sqm.', descriptionAr: 'مكاتب من الفئة الأولى وتجزئة في الحي الحكومي، بمساحات مرنة تبدأ من ١٢٠ متراً.', images: [img(13), img(7), img(10)], amenities: ['Conference center', 'Valet', 'Cafés', 'Fibre connectivity', '24/7 security'], phases: [{ name: 'Phase 1', status: 'construction', delivery: '2027' }], priceFrom: 9800000, totalUnits: 120, availableUnits: 0, reservedUnits: 0, soldUnits: 0, deliveryDate: iso(430, 12), status: 'selling', featured: false },
]

const unitTypes: Property['type'][] = ['apartment', 'apartment', 'duplex', 'townhouse', 'penthouse', 'villa']
export const units: Unit[] = projectDefs.flatMap((project, pi) => {
  const list: Unit[] = []
  const count = 18
  for (let i = 0; i < count; i++) {
    const seed = (pi + 1) * (i + 3)
    const type = unitTypes[(pi + i) % unitTypes.length]
    const status: Unit['status'] = seed % 9 === 0 ? 'sold' : seed % 7 === 0 ? 'reserved' : 'available'
    const area = 95 + ((seed * 17) % 220)
    const floor = (i % 6) + 1
    const price = Math.round((project.priceFrom * (0.85 + (area / 600) + floor * 0.02)) / 100000) * 100000
    list.push({
      id: `u${pi + 1}-${i + 1}`, projectId: project.id, developerId: project.developerId,
      building: `Building ${String.fromCharCode(65 + (i % 3))}`, floor, unitNumber: `${String.fromCharCode(65 + (i % 3))}-${floor}0${(i % 4) + 1}`,
      area, bedrooms: type === 'villa' ? 5 : type === 'townhouse' ? 4 : type === 'penthouse' ? 4 : type === 'duplex' ? 4 : 2 + (seed % 2),
      bathrooms: type === 'villa' ? 4 : 2 + (seed % 2), price, type, status,
      brokerId: status === 'sold' ? `b${(seed % 10) + 1}` : seed % 4 === 0 ? `b${(seed % 10) + 1}` : undefined,
      deliveryDate: project.deliveryDate,
      paymentPlan: plan(10, 8, Math.round((price * 0.8) / 96), project.deliveryDate),
    })
  }
  return list
})

export const projects: Project[] = projectDefs.map((p) => {
  const own = units.filter((u) => u.projectId === p.id)
  return {
    ...p,
    totalUnits: own.length,
    availableUnits: own.filter((u) => u.status === 'available').length,
    reservedUnits: own.filter((u) => u.status === 'reserved').length,
    soldUnits: own.filter((u) => u.status === 'sold').length,
  }
})

export const customers: Customer[] = [
  ['Ahmed El-Sayed', 'أحمد السيد', 'buyer', 8000000, 12000000, 'New Cairo', 'apartment'],
  ['Nada Ibrahim', 'ندى إبراهيم', 'investor', 15000000, 20000000, 'Sheikh Zayed', 'villa'],
  ['Mostafa Kamal', 'مصطفى كمال', 'buyer', 5000000, 8000000, 'Mostakbal City', 'apartment'],
  ['Hana Youssef', 'هنا يوسف', 'buyer', 9000000, 15000000, 'New Cairo', 'townhouse'],
  ['Khaled Mansour', 'خالد منصور', 'seller', 12000000, 18000000, 'Maadi', 'apartment'],
  ['Rana Adel', 'رنا عادل', 'tenant', 20000, 40000, 'New Cairo', 'apartment'],
  ['Sherif Hassan', 'شريف حسن', 'investor', 20000000, 30000000, 'North Coast', 'chalet'],
  ['Mai Abdelrahman', 'مي عبد الرحمن', 'buyer', 6000000, 9000000, '6th of October', 'apartment'],
  ['Ziad Fahmy', 'زياد فهمي', 'buyer', 13000000, 17000000, 'Sheikh Zayed', 'penthouse'],
  ['Aya Gamal', 'آية جمال', 'tenant', 25000, 45000, 'New Administrative Capital', 'office'],
  ['Hussein Ali', 'حسين علي', 'investor', 7000000, 11000000, 'New Administrative Capital', 'apartment'],
  ['Sara Wagih', 'سارة وجيه', 'buyer', 10000000, 16000000, 'Mostakbal City', 'duplex'],
].map((c, i) => ({
  id: `cu${i + 1}`, companyId: i < 9 ? 'c1' : 'c2', name: c[0] as string, nameAr: c[1] as string,
  phone: `+20 10${i % 9} ${300 + i * 7} ${4000 + i * 31}`, email: `${(c[0] as string).split(' ')[0].toLowerCase()}${i + 1}@example.com`,
  type: c[2] as Customer['type'], budgetMin: c[3] as number, budgetMax: c[4] as number,
  preferredLocations: [c[5] as string], preferredType: c[6] as Property['type'], bedrooms: i % 3 === 0 ? 4 : 3,
  assignedTo: i < 9 ? employees[(i % 7) + 2].id : employees[(i % 3) + 11].id,
  createdAt: iso(-(40 + i * 13)), avatarColor: ['#0F766E', '#B45309', '#0369A1', '#7C3AED', '#BE123C'][i % 5],
  notes: [{ id: `cn${i}`, author: 'Sales team', text: i % 3 === 0 ? 'Prefers east-facing units with a garden. Cash-ready after selling an apartment in Maadi.' : 'Responds best on WhatsApp in the evening. Follow up with a shortlist and payment plan.', at: iso(-(3 + i)) }],
  lastInteraction: iso(-(i % 9)), source: (['website', 'instagram', 'referral', 'whatsapp', 'broker', 'facebook'] as const)[i % 6],
  timeline: [
    { id: `ct${i}a`, type: 'whatsapp', title: 'WhatsApp conversation', detail: 'Discussed availability and payment plan for a shortlisted unit.', at: iso(-(i % 9)), actor: 'Agent' },
    { id: `ct${i}b`, type: 'viewing', title: 'Property viewing', detail: 'Visited a 3-bedroom apartment in New Cairo.', at: iso(-(10 + i)), actor: 'Agent' },
    { id: `ct${i}c`, type: 'status', title: 'Customer created', detail: 'Added from an inbound website inquiry.', at: iso(-(40 + i * 13)), actor: 'System' },
  ],
}))

const leadNames: [string, string, LeadSource, LeadStatus, string, number, number, string][] = [
  ['Ahmed El-Sayed', 'أحمد السيد', 'website', 'qualified', 'New Cairo', 8000000, 12000000, 'e3'],
  ['Nada Ibrahim', 'ندى إبراهيم', 'instagram', 'viewing', 'Sheikh Zayed', 15000000, 20000000, 'e4'],
  ['Mostafa Kamal', 'مصطفى كمال', 'facebook', 'new', 'Mostakbal City', 5000000, 8000000, 'e5'],
  ['Hana Youssef', 'هنا يوسف', 'referral', 'interested', 'New Cairo', 9000000, 15000000, 'e6'],
  ['Khaled Mansour', 'خالد منصور', 'walk_in', 'negotiation', 'Maadi', 12000000, 18000000, 'e3'],
  ['Rana Adel', 'رنا عادل', 'whatsapp', 'contacted', 'New Cairo', 20000, 40000, 'e7'],
  ['Sherif Hassan', 'شريف حسن', 'campaign', 'qualified', 'North Coast', 20000000, 30000000, 'e4'],
  ['Mai Abdelrahman', 'مي عبد الرحمن', 'website', 'new', '6th of October', 6000000, 9000000, 'e5'],
  ['Ziad Fahmy', 'زياد فهمي', 'broker', 'negotiation', 'Sheikh Zayed', 13000000, 17000000, 'e6'],
  ['Aya Gamal', 'آية جمال', 'call_center', 'contacted', 'New Administrative Capital', 25000, 45000, 'e8'],
  ['Hussein Ali', 'حسين علي', 'website', 'won', 'New Administrative Capital', 7000000, 11000000, 'e3'],
  ['Sara Wagih', 'سارة وجيه', 'facebook', 'lost', 'Mostakbal City', 10000000, 16000000, 'e7'],
  ['Omar Khairy', 'عمر خيري', 'website', 'new', 'New Cairo', 7000000, 10000000, 'e8'],
  ['Dalia Nabil', 'داليا نبيل', 'whatsapp', 'qualified', 'Sheikh Zayed', 11000000, 15000000, 'e4'],
  ['Mahmoud Riad', 'محمود رياض', 'referral', 'viewing', 'North Coast', 8000000, 12000000, 'e5'],
  ['Nourhan Selim', 'نورهان سليم', 'instagram', 'contacted', 'New Alamein', 4000000, 7000000, 'e7'],
  ['Amr Ghoneim', 'عمرو غنيم', 'campaign', 'interested', 'New Capital', 9000000, 14000000, 'e3'],
  ['Yara Hamed', 'يارا حامد', 'website', 'new', '6th of October', 5000000, 7500000, 'e9'],
  ['Tamer Shawky', 'تامر شوقي', 'walk_in', 'lost', 'Maadi', 6000000, 8500000, 'e6'],
  ['Farah Allam', 'فرح علام', 'facebook', 'qualified', 'New Cairo', 12000000, 18000000, 'e4'],
  ['Bassem Youssef', 'باسم يوسف', 'broker', 'contacted', 'Sheikh Zayed', 14000000, 22000000, 'e5'],
  ['Mona Zaki', 'منى زكي', 'whatsapp', 'interested', 'Mostakbal City', 8500000, 11500000, 'e8'],
  ['Ali El-Banna', 'علي البنا', 'website', 'new', 'New Capital', 6500000, 9500000, 'e9'],
  ['Reem Hesham', 'ريم هشام', 'instagram', 'viewing', 'New Cairo', 10000000, 14500000, 'e3'],
  ['Sherif Nour', 'شريف نور', 'call_center', 'negotiation', 'North Coast', 18000000, 26000000, 'e6'],
  ['Menna Tarek', 'منة طارق', 'website', 'new', 'Sheikh Zayed', 7500000, 10000000, 'e4'],
]

export const leads: Lead[] = leadNames.map((l, i) => {
  const status = l[3]
  return {
    id: `l${i + 1}`, companyId: i < 23 ? 'c1' : 'c2', name: l[0], nameAr: l[1], phone: `+20 1${(i % 5) + 1} ${200 + i * 11} ${7000 + i * 37}`,
    email: `${l[0].split(' ')[0].toLowerCase()}.${i + 1}@example.com`, source: l[2], campaign: l[2] === 'campaign' ? 'Autumn Resale Push' : l[2] === 'facebook' ? 'New Cairo Retargeting' : undefined,
    location: l[4], budgetMin: l[5], budgetMax: l[6], propertyType: (['apartment', 'villa', 'townhouse', 'chalet', 'duplex'] as const)[i % 5],
    preferredArea: `${l[4]} — 15 min from main road`, paymentPreference: (['installments', 'cash', 'installments', 'mortgage'] as const)[i % 4],
    assigneeId: i < 23 ? l[7] : employees[(i % 3) + 11].id, status, priority: (['high', 'medium', 'urgent', 'low'] as const)[i % 4],
    score: status === 'won' ? 94 : status === 'lost' ? 31 : 45 + ((i * 13) % 50),
    notes: [
      { id: `n${i}a`, author: 'Sales agent', text: status === 'lost' ? 'Client chose a competing unit with a longer payment plan.' : 'Looking for a ready-to-move unit with a garden. Decision maker is the client’s father.', at: iso(-(i % 10) - 1) },
      ...(i % 3 === 0 ? [{ id: `n${i}b`, author: 'Sales manager', text: 'Qualified budget and timeline. Send three curated options this week.', at: iso(-(i % 5) - 1) }] : []),
    ],
    activities: [
      { id: `a${i}a`, type: 'call', title: 'Discovery call', detail: 'Discussed budget, preferred location and timeline.', at: iso(-(i % 12) - 1), actor: 'Agent' },
      { id: `a${i}b`, type: 'whatsapp', title: 'WhatsApp follow-up', detail: 'Shared payment plan and availability for two properties.', at: iso(-(i % 7) - 2), actor: 'Agent' },
      { id: `a${i}c`, type: i % 4 === 0 ? 'viewing' : 'email', title: i % 4 === 0 ? 'Viewing completed' : 'Property brochure sent', detail: i % 4 === 0 ? 'Visited the New Cairo apartment with family.' : 'Sent curated project brochure and floor plans.', at: iso(-(i % 16) - 3), actor: 'Agent' },
      { id: `a${i}d`, type: 'system', title: 'Lead captured', detail: `Created from ${l[2].replace('_', ' ')}.`, at: iso(-(20 + i)), actor: 'System' },
    ],
    lastContact: iso(-(i % 9)), nextFollowUp: iso((i % 5) - 1),
    createdAt: iso(-(20 + i)), lostReason: status === 'lost' ? (i % 2 === 0 ? 'Chose a competitor' : 'Budget mismatch') : undefined,
    tags: [l[4], i % 3 === 0 ? 'Cash-ready' : 'Installments', l[2] === 'broker' ? 'Broker-sourced' : 'Inbound'],
  }
})

export const deals: Deal[] = [
  ['dl1', 'cu1', 'Ahmed El-Sayed', 'p2', 'Skyline 3BR Garden Apartment', 8900000, 'negotiation', 'primary', 'e3', 'p2', 70],
  ['dl2', 'cu2', 'Nada Ibrahim', 'p13', 'Contemporary Villa — New Zayed', 16900000, 'reservation', 'primary', 'e4', 'p13', 85],
  ['dl3', 'cu3', 'Mostafa Kamal', 'p3', 'Verdant Park Duplex', 11200000, 'qualified', 'primary', 'e5', 'p3', 45],
  ['dl4', 'cu4', 'Hana Youssef', 'p8', 'Swan Lake Townhouse', 12700000, 'proposal', 'primary', 'e6', 'p8', 55],
  ['dl5', 'cu5', 'Khaled Mansour', 'p6', 'Family Apartment in Maadi', 6400000, 'won', 'resale', 'e3', 'p6', 100],
  ['dl6', 'cu6', 'Rana Adel', 'p5', 'Executive Office — New Capital', 85000, 'new', 'rental', 'e7', 'p5', 20],
  ['dl7', 'cu7', 'Sherif Hassan', 'p4', 'Azure Bay Waterfront Chalet', 9800000, 'negotiation', 'primary', 'e4', 'p4', 65],
  ['dl8', 'cu8', 'Mai Abdelrahman', 'p11', 'Garden Apartment — October', 4800000, 'won', 'resale', 'e5', 'p11', 100],
  ['dl9', 'cu9', 'Ziad Fahmy', 'p7', 'Penthouse with Private Roof', 14500000, 'proposal', 'resale', 'e6', 'p7', 50],
  ['dl10', 'cu1', 'Ahmed El-Sayed', 'p12', 'Twin House in East Cairo', 15900000, 'lost', 'primary', 'e3', 'p12', 0],
  ['dl11', 'cu10', 'Aya Gamal', 'p20', 'Capital Business Suite', 9800000, 'qualified', 'commercial', 'e8', 'p20', 40],
  ['dl12', 'cu11', 'Hussein Ali', 'p19', 'D01 Residence — New Capital', 7400000, 'won', 'primary', 'e3', 'p19', 100],
  ['dl13', 'cu12', 'Sara Wagih', 'p3', 'Verdant Park Duplex', 11200000, 'new', 'primary', 'e7', 'p3', 15],
  ['dl14', 'cu2', 'Nada Ibrahim', 'p1', 'The Palm Residence — 4BR Villa', 18500000, 'qualified', 'primary', 'e4', 'p1', 35],
].map((d, i) => {
  const [id, customerId, customerName, propertyId, propertyTitle, value, stage, pipelineId, agentId, _pid, probability] = d
  const property = properties.find((p) => p.id === propertyId)!
  return {
    id: id as string, code: `DL-${2400 + i}`, companyId: i < 7 || i === 9 || i === 10 || i === 11 || i === 13 ? 'c1' : 'c2',
    customerId: customerId as string, customerName: customerName as string, propertyId: propertyId as string,
    propertyTitle: propertyTitle as string, value: value as number, stage: stage as Deal['stage'], pipelineId: pipelineId as Deal['pipelineId'],
    agentId: employees.find((e) => e.id === agentId)?.companyId === 'c1' ? agentId as string : 'e12',
    developerId: property.developerId, brokerId: i % 3 === 0 ? 'b1' : undefined,
    probability: probability as number, expectedClose: iso(12 + i * 4), reservationStatus: stage === 'reservation' ? 'pending' : stage === 'won' ? 'confirmed' : 'none',
    contractStatus: stage === 'won' ? 'signed' : stage === 'reservation' ? 'draft' : 'none',
    commissionPct: 2.5, createdAt: iso(-(30 + i * 5)), updatedAt: iso(-(i % 4)), lastActivity: iso(-(i % 3)),
    lostReason: stage === 'lost' ? 'Client postponed purchase to next quarter' : undefined,
    cooperationId: i === 1 ? 'cr2' : i === 6 ? 'cr5' : undefined,
  } as Deal
})

export const transactions: Transaction[] = [
  ['tx1', 'dl5', 'Khaled Mansour', 'Family Apartment in Maadi', 6400000, 160000, 'completed', 'sale', 'e3', -42],
  ['tx2', 'dl8', 'Mai Abdelrahman', 'Garden Apartment — October', 4800000, 120000, 'completed', 'resale', 'e5', -36],
  ['tx3', 'dl12', 'Hussein Ali', 'D01 Residence — New Capital', 7400000, 185000, 'completed', 'sale', 'e3', -28],
  ['tx4', 'dl2', 'Nada Ibrahim', 'Contemporary Villa — New Zayed', 16900000, 422500, 'pending', 'sale', 'e4', -8],
  ['tx5', 'dl1', 'Ahmed El-Sayed', 'Skyline 3BR Garden Apartment', 8900000, 222500, 'pending', 'sale', 'e3', -6],
  ['tx6', 'dl7', 'Sherif Hassan', 'Azure Bay Waterfront Chalet', 9800000, 392000, 'pending', 'sale', 'e4', -4],
  ['tx7', 'dl4', 'Hana Youssef', 'Swan Lake Townhouse', 12700000, 317500, 'overdue', 'sale', 'e6', -12],
  ['tx8', 'dl9', 'Ziad Fahmy', 'Penthouse with Private Roof', 14500000, 362500, 'pending', 'resale', 'e6', -2],
  ['tx9', 'dl11', 'Aya Gamal', 'Capital Business Suite', 9800000, 245000, 'pending', 'commercial', 'e8', -3],
  ['tx10', 'dl6', 'Rana Adel', 'Executive Office — New Capital', 85000, 42500, 'completed', 'rent', 'e7', -18],
  ['tx11', 'dl3', 'Mostafa Kamal', 'Verdant Park Duplex', 11200000, 336000, 'pending', 'sale', 'e5', -1],
  ['tx12', 'dl14', 'Nada Ibrahim', 'The Palm Residence — 4BR Villa', 18500000, 462500, 'overdue', 'sale', 'e4', -9],
].map((t, i) => {
  const [id, dealId, customerName, propertyTitle, amount, commission, status, type, agentId, days] = t
  const property = properties.find((p) => p.title === propertyTitle)!
  return {
    id: id as string, companyId: i === 9 ? 'c2' : 'c1', dealId: dealId as string, customerName: customerName as string,
    propertyTitle: propertyTitle as string, amount: amount as number, commission: commission as number,
    date: iso(days as number), status: status as Transaction['status'], type: type as Transaction['type'],
    invoiceNo: `INV-26-${String(100 + i)}`, agentId: agentId as string,
    __propertyId: property.id,
  } as Transaction
})

export const brokers: Broker[] = [
  { id: 'b1', name: 'Karim El-Sherbiny', companyName: 'Independent', verified: true, rating: 4.9, activeListings: 18, dealsClosed: 42, commissionRate: 2.5, phone: '+20 100 911 2233', avatarColor: '#142B45', zone: 'New Cairo' },
  { id: 'b2', name: 'Rania Wael', companyName: 'Cairo Prime Properties', verified: true, rating: 4.7, activeListings: 12, dealsClosed: 31, commissionRate: 2.25, phone: '+20 101 822 3344', avatarColor: '#0F766E', zone: 'Sheikh Zayed' },
  { id: 'b3', name: 'Tamer Hussein', companyName: 'Independent', verified: true, rating: 4.6, activeListings: 9, dealsClosed: 27, commissionRate: 2, phone: '+20 106 733 4455', avatarColor: '#334E68', zone: 'New Capital' },
  { id: 'b4', name: 'Heba Ashraf', companyName: 'Delta Homes', verified: true, rating: 4.8, activeListings: 14, dealsClosed: 36, commissionRate: 2.5, phone: '+20 109 644 5566', avatarColor: '#B45309', zone: 'Maadi' },
  { id: 'b5', name: 'Moataz Hesham', companyName: 'Independent', verified: false, rating: 4.1, activeListings: 6, dealsClosed: 13, commissionRate: 1.75, phone: '+20 111 555 6677', avatarColor: '#7C3AED', zone: '6th of October' },
  { id: 'b6', name: 'Dalia Sherif', companyName: 'North Coast Realty', verified: true, rating: 4.7, activeListings: 11, dealsClosed: 25, commissionRate: 2.25, phone: '+20 112 466 7788', avatarColor: '#0369A1', zone: 'North Coast' },
  { id: 'b7', name: 'Sherif Gamal', companyName: 'Independent', verified: true, rating: 4.5, activeListings: 8, dealsClosed: 19, commissionRate: 2, phone: '+20 100 377 8899', avatarColor: '#BE123C', zone: 'New Alamein' },
  { id: 'b8', name: 'Noha Tarek', companyName: 'Capital Estates', verified: false, rating: 4.0, activeListings: 5, dealsClosed: 9, commissionRate: 1.75, phone: '+20 101 288 9900', avatarColor: '#475569', zone: 'New Capital' },
  { id: 'b9', name: 'Hazem Fathy', companyName: 'Independent', verified: true, rating: 4.6, activeListings: 10, dealsClosed: 22, commissionRate: 2.25, phone: '+20 106 199 0011', avatarColor: '#0F766E', zone: 'Mostakbal City' },
  { id: 'b10', name: 'Hala Mostafa', companyName: 'Atrium Real Estate', verified: false, rating: 3.9, activeListings: 4, dealsClosed: 7, commissionRate: 1.5, phone: '+20 109 110 1122', avatarColor: '#7C3AED', zone: 'Nasr City' },
]

export const cooperationRequests: CooperationRequest[] = [
  ['cr1', 'c2', 'c1', 'p2', 'b2', 'b1', 'Ahmed E.', 'pending', 2.5, -2],
  ['cr2', 'c1', 'c2', 'p13', 'b1', 'b2', 'Nada I.', 'accepted', 2.25, -12],
  ['cr3', 'c1', 'c5', 'p21', 'b1', 'b6', 'Sherif H.', 'negotiation', 2, -5],
  ['cr4', 'c3', 'c1', 'p3', 'b4', 'b1', 'Mostafa K.', 'pending', 2.5, -1],
  ['cr5', 'c1', 'c4', 'p20', 'b1', 'b8', 'Aya G.', 'accepted', 2, -16],
  ['cr6', 'c5', 'c2', 'p14', 'b6', 'b2', 'Mona Z.', 'rejected', 2.25, -20],
  ['cr7', 'c4', 'c3', 'p17', 'b8', 'b4', 'Hussein A.', 'completed', 2.5, -30],
  ['cr8', 'c2', 'c5', 'p22', 'b2', 'b6', 'Rana A.', 'cancelled', 2, -25],
].map((r, i) => {
  const [id, req, own, propId, rb, ob, customerNameMasked, status, commissionPct, days] = r
  return {
    id: id as string, code: `COP-${3200 + i}`, requestingCompanyId: req as string, owningCompanyId: own as string,
    propertyId: propId as string, requesterBrokerId: rb as string, ownerBrokerId: ob as string,
    customerNameMasked: customerNameMasked as string, customerProtected: true, commissionPct: commissionPct as number,
    commissionSplit: [{ party: companies.find((c) => c.id === req)!.name, pct: 50 }, { party: companies.find((c) => c.id === own)!.name, pct: 50 }],
    status: status as CooperationRequest['status'], terms: 'Shared commission 50/50, customer source locked for 90 days, owner company handles contracting.',
    createdAt: iso(days as number), updatedAt: iso(-(i % 3)), milestones: [
      { label: 'Cooperation request submitted', done: true, date: iso(days as number) },
      { label: 'Availability confirmed by owner', done: (status as string) !== 'pending', date: iso((days as number) + 1) },
      { label: 'Commission agreed', done: ['accepted', 'completed'].includes(status as string), date: iso((days as number) + 2) },
      { label: 'Customer viewing', done: ['completed'].includes(status as string), date: iso((days as number) + 5) },
      { label: 'Deal closed', done: status === 'completed', date: iso((days as number) + 12) },
    ],
    activities: [
      { id: `ca${i}1`, type: 'system', title: 'Request created', detail: `Cooperation requested by ${companies.find((c) => c.id === req)!.name}.`, at: iso(days as number), actor: 'System' },
      { id: `ca${i}2`, type: 'note', title: 'Customer source protected', detail: 'Customer contact details remain hidden until cooperation is accepted.', at: iso((days as number) + 1), actor: 'Trust desk' },
    ],
    notes: [{ id: `cn${i}`, author: 'Partnership desk', text: 'Owner company confirmed availability for the next 14 days. Agree split before sharing customer details.', at: iso((days as number) + 1) }],
    dispute: 'none',
  } as CooperationRequest
})

export const commissions: Commission[] = [
  ['cm1', 'c1', 'dl5', 'e3', 'Youssef Adel', 'agent', 56000, 35, 'paid', -30],
  ['cm2', 'c1', 'dl5', 'c1', 'Nile Crest Realty', 'company', 104000, 65, 'paid', -30],
  ['cm3', 'c1', 'dl8', 'e5', 'Karim Nabil', 'agent', 42000, 35, 'paid', -25],
  ['cm4', 'c1', 'dl12', 'e3', 'Youssef Adel', 'agent', 64750, 35, 'pending', 8],
  ['cm5', 'c1', 'dl2', 'e4', 'Mariam Fathy', 'agent', 147875, 35, 'pending', 14],
  ['cm6', 'c1', 'dl2', 'b2', 'Rania Wael', 'broker', 42250, 10, 'pending', 14],
  ['cm7', 'c1', 'dl7', 'e4', 'Mariam Fathy', 'agent', 137200, 35, 'overdue', -5],
  ['cm8', 'c1', 'dl4', 'e6', 'Salma Hany', 'agent', 111125, 35, 'pending', 20],
  ['cm9', 'c2', 'dl14', 'e12', 'Laila Mostafa', 'agent', 161875, 35, 'pending', 18],
  ['cm10', 'c1', 'dl9', 'e6', 'Salma Hany', 'agent', 126875, 35, 'pending', 25],
  ['cm11', 'c1', 'dl11', 'e8', 'Farida Samir', 'agent', 85750, 35, 'overdue', -2],
  ['cm12', 'c1', 'dl1', 'b1', 'Karim El-Sherbiny', 'partner', 44500, 20, 'pending', 10],
].map((c, i) => ({
  id: c[0] as string, companyId: c[1] as string, dealId: c[2] as string, beneficiaryId: c[3] as string,
  beneficiaryName: c[4] as string, role: c[5] as Commission['role'], amount: c[6] as number, pct: c[7] as number,
  status: c[8] as Commission['status'], dueDate: iso(c[9] as number), paidAt: c[8] === 'paid' ? iso((c[9] as number) - 2) : undefined,
}))

export const subscriptionPlans: SubscriptionPlan[] = [
  { id: 'free', name: 'Free', price: 0, userLimit: 2, propertyLimit: 10, features: ['Marketplace listing', 'Basic leads inbox', 'Community support'] },
  { id: 'starter', name: 'Starter', price: 2500, userLimit: 5, propertyLimit: 50, features: ['CRM essentials', 'Lead capture', 'Basic reports', 'Email support'] },
  { id: 'professional', name: 'Professional', price: 6500, userLimit: 15, propertyLimit: 150, features: ['Full CRM', 'Sales pipelines', 'Broker exchange', 'Commission tracking', 'Priority support'], popular: true },
  { id: 'business', name: 'Business', price: 14000, userLimit: 40, propertyLimit: 500, features: ['Multi-branch CRM', 'Automation builder', 'AI copilot', 'Advanced analytics', 'API access'] },
  { id: 'enterprise', name: 'Enterprise', price: 32000, userLimit: 200, propertyLimit: 2000, features: ['Unlimited pipelines', 'SSO & audit logs', 'Dedicated success manager', 'Custom SLAs', 'Data warehouse export'] },
]

export const subscriptions: Subscription[] = [
  { companyId: 'c1', planId: 'business', status: 'active', renewalDate: iso(24), seatsUsed: 9, propertyCount: 12 },
  { companyId: 'c2', planId: 'professional', status: 'active', renewalDate: iso(12), seatsUsed: 5, propertyCount: 4 },
  { companyId: 'c3', planId: 'starter', status: 'active', renewalDate: iso(6), seatsUsed: 3, propertyCount: 2 },
  { companyId: 'c4', planId: 'starter', status: 'trial', renewalDate: iso(9), seatsUsed: 2, propertyCount: 2 },
  { companyId: 'c5', planId: 'professional', status: 'past_due', renewalDate: iso(-3), seatsUsed: 4, propertyCount: 2 },
  { companyId: 'c6', planId: 'starter', status: 'cancelled', renewalDate: iso(-30), seatsUsed: 2, propertyCount: 0 },
]

export const conversations: Conversation[] = [
  ['cv1', 'Ahmed El-Sayed', 'cu1', 'whatsapp', '+20 100 300 7000', 'Looking for 3BR with garden in New Cairo, budget 9-12M. Can visit Saturday.', 2, 'e3'],
  ['cv2', 'Nada Ibrahim', 'cu2', 'whatsapp', '+20 101 311 7037', 'Is the villa in New Zayed still available for a viewing this week?', 1, 'e4'],
  ['cv3', 'Mostafa Kamal', 'cu3', 'email', '+20 102 322 7074', 'Thanks for the brochure. Can you send the payment plan for unit B-302?', 0, 'e5'],
  ['cv4', 'Hana Youssef', 'cu4', 'chat', '+20 103 333 7111', 'I would like to compare the Swan Lake townhouse with the twin house.', 3, 'e6'],
  ['cv5', 'Rana Adel', 'cu6', 'whatsapp', '+20 104 344 7148', 'Is the office in the New Capital available for immediate move-in?', 0, 'e7'],
  ['cv6', 'Sherif Hassan', 'cu7', 'whatsapp', '+20 105 355 7185', 'Can we negotiate the down payment on the Azure Bay chalet?', 1, 'e4'],
  ['cv7', 'Mai Abdelrahman', 'cu8', 'email', '+20 106 366 7222', 'Please share the delivery timeline and finishing specifications.', 0, 'e5'],
  ['cv8', 'Ziad Fahmy', 'cu9', 'chat', '+20 107 377 7259', 'I want to see the penthouse rooftop photos before booking a viewing.', 2, 'e6'],
].map((c, i) => {
  const [id, name, customerId, channel, phone, lastMessage, unread, assigneeId] = c
  const msgs = [
    { id: `m${i}1`, conversationId: id as string, sender: 'customer' as const, text: i === 0 ? 'Good morning, I saw the Skyline apartment listing on your website.' : 'Hello, I have a question about this property.', at: iso(-(i % 5) - 1, 9), channel: channel as 'whatsapp' | 'email' | 'chat' },
    { id: `m${i}2`, conversationId: id as string, sender: 'agent' as const, text: 'Good morning! Happy to help. The property is available. Would you like the full brochure and payment plan?', at: iso(-(i % 5) - 1, 10), channel: channel as 'whatsapp' | 'email' | 'chat' },
    { id: `m${i}3`, conversationId: id as string, sender: 'customer' as const, text: lastMessage as string, at: iso(-(i % 3), 11), channel: channel as 'whatsapp' | 'email' | 'chat' },
  ]
  return {
    id: id as string, companyId: 'c1', customerName: name as string, customerId: customerId as string,
    channel: channel as Conversation['channel'], phone: phone as string,
    avatarColor: ['#0F766E', '#B45309', '#0369A1', '#7C3AED', '#BE123C'][i % 5],
    lastMessage: lastMessage as string, lastAt: iso(-(i % 3)), unread: unread as number,
    assigneeId: assigneeId as string, status: i === 7 ? 'pending' : 'open', messages: msgs,
    aiSummary: `${name} is a qualified ${i % 2 === 0 ? 'buyer' : 'investor'} actively evaluating ${i % 2 === 0 ? 'New Cairo' : 'coastal'} options. Strong intent, responsive on ${channel === 'whatsapp' ? 'WhatsApp' : 'email'}. Recommend sharing a curated shortlist and proposing a viewing within 48 hours.`,
  }
})

export const tasks: Task[] = [
  ['Follow up with Ahmed on the Skyline apartment', 'call', 'high', 0, 'e3', 'Ahmed El-Sayed', 'Skyline 3BR Garden Apartment'],
  ['Send Palm Residence payment plan to Nada', 'whatsapp', 'urgent', 0, 'e4', 'Nada Ibrahim', 'The Palm Residence — 4BR Villa'],
  ['Prepare reservation form for Hana Youssef', 'document', 'high', 1, 'e6', 'Hana Youssef', 'Swan Lake Townhouse'],
  ['Site visit — Mostakbal City duplex', 'viewing', 'medium', 2, 'e5', 'Mostafa Kamal', 'Verdant Park Duplex'],
  ['Collect ID documents from Khaled Mansour', 'document', 'medium', -1, 'e3', 'Khaled Mansour', 'Family Apartment in Maadi'],
  ['Review contract draft for Nada Ibrahim', 'contract', 'urgent', 1, 'e2', 'Nada Ibrahim', 'Contemporary Villa — New Zayed'],
  ['Payment reminder — Hana Youssef', 'payment', 'high', -2, 'e6', 'Hana Youssef', 'Swan Lake Townhouse'],
  ['Weekly pipeline review with Alpha team', 'meeting', 'medium', 1, 'e2', undefined, undefined],
  ['Call back Ziad about rooftop photos', 'call', 'high', 0, 'e6', 'Ziad Fahmy', 'Penthouse with Private Roof'],
  ['Send welcome email to Menna Tarek', 'email', 'low', 3, 'e4', 'Menna Tarek', undefined],
  ['Follow up with Aya on office lease terms', 'call', 'medium', 2, 'e8', 'Aya Gamal', 'Capital Business Suite'],
  ['Viewing — Azure Bay chalet with Sherif', 'viewing', 'high', 4, 'e4', 'Sherif Hassan', 'Azure Bay Waterfront Chalet'],
  ['Confirm commission invoice with finance', 'payment', 'medium', 5, 'e1', undefined, undefined],
  ['Quarterly target check-in — Delta team', 'meeting', 'low', 6, 'e2', undefined, undefined],
].map((t, i) => ({
  id: `tk${i + 1}`, companyId: i === 10 ? 'c2' : 'c1', title: t[0] as string, type: t[1] as Task['type'],
  priority: t[2] as Task['priority'], status: i === 4 || i === 6 ? 'in_progress' : i === 9 ? 'done' : 'todo',
  dueDate: iso(t[3] as number, 9 + (i % 8)), assigneeId: t[4] as string, customerName: t[5] as string | undefined,
  propertyTitle: t[6] as string | undefined, reminder: i % 3 === 0,
}))

export const viewings: Viewing[] = [
  { id: 'v1', companyId: 'c1', customerName: 'Ahmed El-Sayed', propertyTitle: 'Skyline 3BR Garden Apartment', agentId: 'e3', date: iso(0), time: '11:00', status: 'scheduled' },
  { id: 'v2', companyId: 'c1', customerName: 'Nada Ibrahim', propertyTitle: 'Contemporary Villa — New Zayed', agentId: 'e4', date: iso(1), time: '14:30', status: 'scheduled' },
  { id: 'v3', companyId: 'c1', customerName: 'Mostafa Kamal', propertyTitle: 'Verdant Park Duplex', agentId: 'e5', date: iso(2), time: '16:00', status: 'scheduled' },
  { id: 'v4', companyId: 'c1', customerName: 'Hana Youssef', propertyTitle: 'Swan Lake Townhouse', agentId: 'e6', date: iso(-2), time: '12:00', status: 'completed' },
  { id: 'v5', companyId: 'c1', customerName: 'Sherif Hassan', propertyTitle: 'Azure Bay Waterfront Chalet', agentId: 'e4', date: iso(4), time: '10:30', status: 'scheduled' },
  { id: 'v6', companyId: 'c1', customerName: 'Ziad Fahmy', propertyTitle: 'Penthouse with Private Roof', agentId: 'e6', date: iso(-1), time: '17:00', status: 'no_show' },
]

export const tickets: SupportTicket[] = [
  ['TKT-4101', 'Nada Ibrahim', 'Handover checklist not received', 'delivery', 'high', 'open', 'e8', -2],
  ['TKT-4102', 'Hana Youssef', 'AC installation delay in unit', 'maintenance', 'medium', 'in_progress', 'e8', -5],
  ['TKT-4103', 'Ahmed El-Sayed', 'Installment receipt mismatch', 'payment', 'urgent', 'open', 'e3', -1],
  ['TKT-4104', 'Mai Abdelrahman', 'Noise complaint from neighboring unit', 'complaint', 'medium', 'in_progress', 'e8', -8],
  ['TKT-4105', 'Khaled Mansour', 'Request for duplicate contract copy', 'inquiry', 'low', 'resolved', 'e3', -12],
  ['TKT-4106', 'Rana Adel', 'Office access card not activated', 'maintenance', 'high', 'resolved', 'e7', -15],
  ['TKT-4107', 'Sherif Hassan', 'Chalet cleaning before handover', 'maintenance', 'medium', 'closed', 'e8', -20],
  ['TKT-4108', 'Ziad Fahmy', 'Payment schedule clarification', 'payment', 'low', 'closed', 'e6', -23],
  ['TKT-4109', 'Aya Gamal', 'Parking allocation request', 'inquiry', 'medium', 'open', 'e8', -3],
].map((t, i) => ({
  id: `st${i + 1}`, code: t[0] as string, companyId: i === 8 ? 'c2' : 'c1', customerName: t[1] as string, subject: t[2] as string,
  category: t[3] as SupportTicket['category'], priority: t[4] as SupportTicket['priority'], status: t[5] as SupportTicket['status'],
  assignedTo: t[6] as string, createdAt: iso(t[7] as number), updatedAt: iso((t[7] as number) + 1),
  description: 'Customer reported the issue through the after-sales portal. The team is coordinating with the developer and property management to resolve it within the agreed SLA.',
  satisfaction: t[5] === 'closed' ? 5 : t[5] === 'resolved' ? 4 : undefined,
}))

export const workflows: Workflow[] = [
  { id: 'wf1', companyId: 'c1', name: 'Hot lead auto-assignment', description: 'Assign high-score website leads to the top available Alpha agent and create a first-call task.', trigger: 'New lead created', conditions: [{ field: 'Lead source', operator: 'equals', value: 'Website' }, { field: 'Lead score', operator: 'greater than', value: '70' }], actions: [{ type: 'Assign employee', value: 'Next available Alpha agent' }, { type: 'Create task', value: 'First call within 15 minutes' }, { type: 'Send message', value: 'Send welcome WhatsApp template' }], enabled: true, runs: 148, lastRun: iso(0, 9) },
  { id: 'wf2', companyId: 'c1', name: 'Viewing follow-up sequence', description: 'Send a thank-you message and create a follow-up task after every completed viewing.', trigger: 'Viewing completed', conditions: [], actions: [{ type: 'Send message', value: 'Viewing thank-you template' }, { type: 'Create task', value: 'Follow up after 24 hours' }], enabled: true, runs: 92, lastRun: iso(-1, 17) },
  { id: 'wf3', companyId: 'c1', name: 'Inactive lead recycle', description: 'Recycle leads with no activity for 14 days into the shared pool and notify the manager.', trigger: 'No activity for 14 days', conditions: [{ field: 'Lead status', operator: 'not equals', value: 'Won' }], actions: [{ type: 'Add tag', value: 'Needs re-engagement' }, { type: 'Notify manager', value: 'Sales manager' }, { type: 'Change status', value: 'Recycled' }], enabled: true, runs: 37, lastRun: iso(-2, 8) },
  { id: 'wf4', companyId: 'c1', name: 'Reservation payment reminder', description: 'Notify the finance team and send a payment reminder 3 days before the due date.', trigger: 'Payment due', conditions: [{ field: 'Deal value', operator: 'greater than', value: '5,000,000' }], actions: [{ type: 'Send message', value: 'Payment reminder template' }, { type: 'Notify manager', value: 'Finance manager' }], enabled: false, runs: 54, lastRun: iso(-6, 10) },
  { id: 'wf5', companyId: 'c1', name: 'Cooperation accepted handoff', description: 'Create the collaboration workspace tasks when a broker cooperation request is accepted.', trigger: 'Cooperation accepted', conditions: [], actions: [{ type: 'Create task', value: 'Confirm property availability' }, { type: 'Create task', value: 'Schedule joint viewing' }], enabled: true, runs: 21, lastRun: iso(-1, 13) },
]

export const notifications: Notification[] = [
  ['n1', 'lead', 'New lead from website', 'Menna Tarek is looking for a 3BR in Sheikh Zayed with a 10M EGP budget.', 'crm', false, 0, '/crm/leads'],
  ['n2', 'assignment', 'Lead assigned to you', 'Youssef Adel was assigned the lead Omar Khairy from a Facebook campaign.', 'crm', false, 0, '/crm/leads'],
  ['n3', 'followup', 'Follow-up overdue', 'The follow-up with Sherif Hassan is now 2 hours overdue.', 'crm', false, 0, '/crm/activities?tab=follow-ups'],
  ['n4', 'cooperation', 'New cooperation request', 'Cairo Prime requested cooperation on Skyline 3BR Garden Apartment.', 'exchange', false, 0, '/exchange/requests'],
  ['n5', 'cooperation_accepted', 'Cooperation accepted', 'Cairo Prime accepted the cooperation request for Contemporary Villa — New Zayed.', 'exchange', true, -1, '/exchange/requests/cr2'],
  ['n6', 'reservation', 'Unit reserved', 'Unit B-302 in Aurora Gardens was reserved for Nada Ibrahim.', 'properties', true, -1, '/inventory'],
  ['n7', 'property', 'Listing approved', 'Twin House in East Cairo is now verified and published on the marketplace.', 'properties', true, -2, '/inventory'],
  ['n8', 'commission', 'Commission confirmed', 'A commission of EGP 64,750 was confirmed for deal DL-2400.', 'finance', false, -1, '/finance/commissions'],
  ['n9', 'payment', 'Payment overdue', 'Invoice INV-26-106 is 3 days overdue. Please review the payment schedule.', 'finance', false, -2, '/finance'],
  ['n10', 'message', 'New WhatsApp reply', 'Ahmed El-Sayed replied to your message about the Skyline apartment.', 'crm', false, 0, '/crm/inbox?tab=whatsapp'],
  ['n11', 'approval', 'Company awaiting approval', 'Capital Estates submitted documents for company verification.', 'system', true, -3, '/admin/companies'],
  ['n12', 'lead', 'Lead score increased', 'Farah Allam’s lead score increased to 82 after a completed viewing.', 'crm', true, -2, '/crm/leads/l20'],
  ['n13', 'followup', 'Viewing reminder', 'You have a viewing at Azure Bay chalet with Sherif Hassan in 2 days.', 'crm', false, -1, '/crm/activities?tab=viewings'],
  ['n14', 'cooperation', 'Dispute opened', 'A dispute was opened on cooperation request COP-3205.', 'exchange', true, -4, '/exchange/requests'],
].map((n) => ({
  id: n[0] as string, type: n[1] as Notification['type'], title: n[2] as string, body: n[3] as string,
  category: n[4] as Notification['category'], read: n[5] as boolean, createdAt: iso(n[6] as number, 8 + (Number(String(n[0]).slice(1)) % 9)),
  companyId: 'c1', href: n[7] as string,
}))

export const savedSearches: SavedSearch[] = [
  { id: 'ss1', name: 'New Cairo 3BR under 10M', filters: 'New Cairo · 3 bedrooms · Up to EGP 10M', createdAt: iso(-8), alerts: true },
  { id: 'ss2', name: 'North Coast chalets', filters: 'North Coast · Chalet · Up to EGP 12M', createdAt: iso(-15), alerts: false },
  { id: 'ss3', name: 'Ready-to-move villas', filters: 'Sheikh Zayed · Villa · Ready to move', createdAt: iso(-21), alerts: true },
]

export const rolePermissions: RolePermission[] = [
  { role: 'Company Owner', description: 'Full access to company data, billing, roles and configuration.', members: 1, permissions: ['All modules', 'Billing', 'Roles & permissions', 'Company settings'] },
  { role: 'Sales Manager', description: 'Manage team pipeline, assignment, approvals and reports.', members: 2, permissions: ['Leads', 'Deals', 'Team management', 'Reports', 'Approvals'] },
  { role: 'Sales Agent', description: 'Own assigned leads, tasks, viewings and deals.', members: 9, permissions: ['Assigned leads', 'Own deals', 'Tasks', 'Communication'] },
  { role: 'Developer Admin', description: 'Manage projects, unit inventory and broker activity.', members: 2, permissions: ['Projects', 'Units', 'Broker activity', 'Sales reports'] },
  { role: 'Independent Broker', description: 'Browse the exchange and manage cooperation requests.', members: 10, permissions: ['Exchange marketplace', 'Cooperation requests', 'Commission tracking'] },
]

export const auditEntries: AuditEntry[] = [
  { id: 'au1', at: iso(0, 9), actor: 'Omar El-Shazly', action: 'Reassigned lead', target: 'L-1026 → Youssef Adel' },
  { id: 'au2', at: iso(-1, 15), actor: 'System', action: 'Reservation created', target: 'Contemporary Villa — New Zayed' },
  { id: 'au3', at: iso(-1, 11), actor: 'Nour Hassan', action: 'Accepted cooperation', target: 'COP-3201' },
  { id: 'au4', at: iso(-2, 14), actor: 'Tarek El-Masry', action: 'Updated commission rule', target: 'Primary sales — 2.5%' },
  { id: 'au5', at: iso(-2, 10), actor: 'Farida Samir', action: 'Published listing', target: 'Twin House in East Cairo' },
  { id: 'au6', at: iso(-3, 16), actor: 'System', action: 'Payment overdue', target: 'INV-26-106' },
  { id: 'au7', at: iso(-4, 12), actor: 'Omar El-Shazly', action: 'Enabled workflow', target: 'Inactive lead recycle' },
  { id: 'au8', at: iso(-5, 9), actor: 'Mariam Fathy', action: 'Created viewing', target: 'Azure Bay Waterfront Chalet' },
]

export const pipelineStages = [
  { id: 'new', label: 'New', probability: 10 },
  { id: 'qualified', label: 'Qualified', probability: 30 },
  { id: 'proposal', label: 'Proposal', probability: 55 },
  { id: 'negotiation', label: 'Negotiation', probability: 75 },
  { id: 'reservation', label: 'Reservation', probability: 90 },
  { id: 'won', label: 'Won', probability: 100 },
] as const
