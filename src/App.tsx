import type { ReactNode } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Compass, LayoutDashboard, ShieldAlert } from 'lucide-react'
import { I18nProvider, useI18n } from '@/i18n'
import { useAppStore } from '@/store/appStore'
import { defaultPathForRole } from '@/lib/nav'
import type { Role } from '@/types'
import { Toaster } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { AuthBootstrap, RequireAuth } from '@/components/auth/AuthGate'
import { LoginPage } from '@/pages/auth/LoginPage'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { AppLayout } from '@/components/layout/AppLayout'
import { HomePage } from '@/pages/public/HomePage'
import { SearchPage } from '@/pages/public/SearchPage'
import { PropertyDetailPage } from '@/pages/public/PropertyDetailPage'
import { ProjectsPage } from '@/pages/public/ProjectsPage'
import { AccountPage } from '@/pages/public/AccountPage'
import { CrmOverviewPage } from '@/pages/crm/CrmOverviewPage'
import { LeadsPage } from '@/pages/crm/LeadsPage'
import { LeadDetailPage } from '@/pages/crm/LeadDetailPage'
import { CustomersPage, CustomerDetailPage } from '@/pages/crm/CustomersPage'
import { PipelinePage } from '@/pages/crm/PipelinePage'
import { OperationsPage } from '@/pages/crm/OperationsPage'
import { ActivitiesPage } from '@/pages/crm/ActivitiesPage'
import { InboxPage } from '@/pages/crm/InboxPage'
import { AutomationPage } from '@/pages/crm/AutomationPage'
import { AiPage } from '@/pages/crm/AiPage'
import { SuccessPage } from '@/pages/crm/SuccessPage'
import { ReportsPage } from '@/pages/crm/ReportsPage'
import { CrmSettingsPage } from '@/pages/crm/CrmSettingsPage'
import { InventoryPage } from '@/pages/inventory/InventoryPage'
import { FinancePage } from '@/pages/FinancePage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { DeveloperOverviewPage, DeveloperProjectsPage, DeveloperUnitsPage, DeveloperBrokersPage, DeveloperSalesPage } from '@/pages/developer/DeveloperPages'
import { ExchangeMarketplacePage, CooperationRequestsPage, CooperationWorkspacePage, ExchangeCommissionsPage, ExchangeTrustPage, ExchangeNetworkPage } from '@/pages/exchange/ExchangePages'
import { AdminOverviewPage, AdminCompaniesPage, AdminUsersPage, AdminModerationPage, AdminSubscriptionsPage, AdminSettingsPage } from '@/pages/admin/AdminPages'

const crmRoles: Role[] = ['super_admin', 'owner', 'manager', 'agent']
const financeRoles: Role[] = ['super_admin', 'owner', 'manager', 'developer', 'broker']
const portalRoles: Role[] = ['super_admin', 'developer']
const exchangeRoles: Role[] = ['super_admin', 'broker']
const workspaceRoles: Role[] = ['super_admin', 'owner', 'manager', 'agent', 'developer', 'broker']

function RoleGate({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const role = useAppStore((s) => s.role)
  if (!roles.includes(role)) return <Navigate to={defaultPathForRole(role)} replace />
  return <>{children}</>
}

function AppPrefixRedirect() {
  const location = useLocation()
  const role = useAppStore((s) => s.role)
  const rest = location.pathname.replace(/^\/app\/?/, '')
  const target = rest ? `/${rest}${location.search}` : defaultPathForRole(role)
  return <Navigate to={target} replace />
}

function NotFoundPage() {
  const { t } = useI18n()
  const role = useAppStore((s) => s.role)
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/5 text-primary dark:bg-white/5 dark:text-slate-200"><ShieldAlert className="size-7" /></span>
        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">404</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">{t('Page not found')}</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{t('The page you are looking for does not exist in this demo. Use one of the links below to continue exploring.')}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button asChild><Link to="/"><Compass /> {t('Back to marketplace')}</Link></Button>
          <Button variant="outline" asChild><Link to={defaultPathForRole(role)}><LayoutDashboard /> {t('Open workspace')}</Link></Button>
        </div>
        <p className="mt-6 text-[10px] text-muted-foreground">{t('This is a frontend demo. No real data is stored on a server.')}</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <I18nProvider>
        <AuthBootstrap>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/properties" element={<SearchPage />} />
            <Route path="/properties/:id" element={<PropertyDetailPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/account" element={<AccountPage />} />
          </Route>

          <Route path="/login" element={<LoginPage />} />
          <Route path="/app" element={<AppPrefixRedirect />} />
          <Route path="/app/*" element={<AppPrefixRedirect />} />

          <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
            <Route path="/crm" element={<RoleGate roles={crmRoles}><CrmOverviewPage mode="executive" /></RoleGate>} />
            <Route path="/crm/sales" element={<RoleGate roles={crmRoles}><CrmOverviewPage mode="sales" /></RoleGate>} />
            <Route path="/crm/activity" element={<RoleGate roles={crmRoles}><CrmOverviewPage mode="activity" /></RoleGate>} />
            <Route path="/crm/forecast" element={<RoleGate roles={crmRoles}><CrmOverviewPage mode="forecast" /></RoleGate>} />
            <Route path="/crm/leads" element={<RoleGate roles={crmRoles}><LeadsPage /></RoleGate>} />
            <Route path="/crm/leads/:id" element={<RoleGate roles={crmRoles}><LeadDetailPage /></RoleGate>} />
            <Route path="/crm/customers" element={<RoleGate roles={crmRoles}><CustomersPage /></RoleGate>} />
            <Route path="/crm/customers/:id" element={<RoleGate roles={crmRoles}><CustomerDetailPage /></RoleGate>} />
            <Route path="/crm/pipeline" element={<RoleGate roles={crmRoles}><PipelinePage /></RoleGate>} />
            <Route path="/crm/operations" element={<RoleGate roles={crmRoles}><OperationsPage /></RoleGate>} />
            <Route path="/crm/activities" element={<RoleGate roles={crmRoles}><ActivitiesPage /></RoleGate>} />
            <Route path="/crm/inbox" element={<RoleGate roles={crmRoles}><InboxPage /></RoleGate>} />
            <Route path="/crm/automation" element={<RoleGate roles={crmRoles}><AutomationPage /></RoleGate>} />
            <Route path="/crm/ai" element={<RoleGate roles={crmRoles}><AiPage /></RoleGate>} />
            <Route path="/crm/success" element={<RoleGate roles={crmRoles}><SuccessPage /></RoleGate>} />
            <Route path="/crm/reports" element={<RoleGate roles={crmRoles}><ReportsPage /></RoleGate>} />
            <Route path="/crm/settings" element={<RoleGate roles={crmRoles}><CrmSettingsPage /></RoleGate>} />

            <Route path="/inventory" element={<RoleGate roles={crmRoles}><InventoryPage /></RoleGate>} />

            <Route path="/finance" element={<RoleGate roles={financeRoles}><FinancePage /></RoleGate>} />
            <Route path="/finance/commissions" element={<RoleGate roles={financeRoles}><FinancePage defaultTab="commissions" /></RoleGate>} />
            <Route path="/finance/transactions" element={<RoleGate roles={financeRoles}><FinancePage defaultTab="transactions" /></RoleGate>} />
            <Route path="/finance/calculator" element={<RoleGate roles={financeRoles}><FinancePage defaultTab="calculator" /></RoleGate>} />
            <Route path="/finance/payouts" element={<RoleGate roles={financeRoles}><FinancePage defaultTab="payouts" /></RoleGate>} />
            <Route path="/analytics" element={<RoleGate roles={financeRoles}><AnalyticsPage /></RoleGate>} />

            <Route path="/notifications" element={<RoleGate roles={workspaceRoles}><NotificationsPage /></RoleGate>} />
            <Route path="/settings" element={<RoleGate roles={workspaceRoles}><SettingsPage /></RoleGate>} />

            <Route path="/developer" element={<RoleGate roles={portalRoles}><DeveloperOverviewPage /></RoleGate>} />
            <Route path="/developer/projects" element={<RoleGate roles={portalRoles}><DeveloperProjectsPage /></RoleGate>} />
            <Route path="/developer/units" element={<RoleGate roles={portalRoles}><DeveloperUnitsPage /></RoleGate>} />
            <Route path="/developer/brokers" element={<RoleGate roles={portalRoles}><DeveloperBrokersPage /></RoleGate>} />
            <Route path="/developer/sales" element={<RoleGate roles={portalRoles}><DeveloperSalesPage /></RoleGate>} />

            <Route path="/exchange" element={<RoleGate roles={exchangeRoles}><ExchangeMarketplacePage /></RoleGate>} />
            <Route path="/exchange/requests" element={<RoleGate roles={exchangeRoles}><CooperationRequestsPage /></RoleGate>} />
            <Route path="/exchange/requests/:id" element={<RoleGate roles={exchangeRoles}><CooperationWorkspacePage /></RoleGate>} />
            <Route path="/exchange/commissions" element={<RoleGate roles={exchangeRoles}><ExchangeCommissionsPage /></RoleGate>} />
            <Route path="/exchange/trust" element={<RoleGate roles={exchangeRoles}><ExchangeTrustPage /></RoleGate>} />
            <Route path="/exchange/network" element={<RoleGate roles={exchangeRoles}><ExchangeNetworkPage /></RoleGate>} />

            <Route path="/admin" element={<RoleGate roles={['super_admin']}><AdminOverviewPage /></RoleGate>} />
            <Route path="/admin/companies" element={<RoleGate roles={['super_admin']}><AdminCompaniesPage /></RoleGate>} />
            <Route path="/admin/users" element={<RoleGate roles={['super_admin']}><AdminUsersPage /></RoleGate>} />
            <Route path="/admin/moderation" element={<RoleGate roles={['super_admin']}><AdminModerationPage /></RoleGate>} />
            <Route path="/admin/subscriptions" element={<RoleGate roles={['super_admin']}><AdminSubscriptionsPage /></RoleGate>} />
            <Route path="/admin/settings" element={<RoleGate roles={['super_admin']}><AdminSettingsPage /></RoleGate>} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </AuthBootstrap>
        <Toaster />
      </I18nProvider>
    </BrowserRouter>
  )
}
