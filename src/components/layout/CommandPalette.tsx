import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Building2, Contact, Handshake, Search, Store, UserRound } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useAppStore } from '@/store/appStore'
import { useI18n } from '@/i18n'
import { navForRole } from '@/lib/nav'
import type { Role } from '@/types'

export function CommandPalette() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const open = useAppStore((s) => s.commandOpen)
  const setOpen = useAppStore((s) => s.setCommandOpen)
  const role = useAppStore((s) => s.role)
  const leads = useAppStore((s) => s.leads)
  const properties = useAppStore((s) => s.properties)
  const customers = useAppStore((s) => s.customers)
  const deals = useAppStore((s) => s.deals)
  const [query, setQuery] = useState('')

  const navLinks = useMemo(() => {
    const links = navForRole(role).flatMap((g) => g.items.map((i) => ({ label: i.label, href: i.href, group: g.label, icon: i.icon })))
    return [
      ...links,
      { label: 'Marketplace', href: '/', group: 'Public', icon: Store },
      { label: 'Explore Properties', href: '/properties', group: 'Public', icon: Building2 },
      { label: 'Customer Account', href: '/account', group: 'Public', icon: UserRound },
    ]
  }, [role])

  const q = query.trim().toLowerCase()
  const navResults = q ? navLinks.filter((l) => l.label.toLowerCase().includes(q)).slice(0, 5) : navLinks.slice(0, 6)
  const propertyResults = q ? properties.filter((p) => `${p.title} ${p.titleAr} ${p.location} ${p.code}`.toLowerCase().includes(q)).slice(0, 4) : properties.slice(0, 3)
  const leadResults = q ? leads.filter((l) => `${l.name} ${l.nameAr ?? ''} ${l.phone} ${l.email}`.toLowerCase().includes(q)).slice(0, 3) : []
  const customerResults = q ? customers.filter((c) => `${c.name} ${c.phone}`.toLowerCase().includes(q)).slice(0, 2) : []
  const dealResults = q ? deals.filter((d) => `${d.code} ${d.customerName} ${d.propertyTitle}`.toLowerCase().includes(q)).slice(0, 2) : []

  const go = (href: string) => {
    setOpen(false)
    setQuery('')
    navigate(href)
  }

  const hasResults = navResults.length + propertyResults.length + leadResults.length + customerResults.length + dealResults.length > 0

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setQuery('') }}>
      <DialogContent className="top-[15%] max-w-xl translate-y-0 overflow-hidden p-0" aria-describedby={undefined}>
        <DialogTitle className="sr-only">{t('Search everything…')}</DialogTitle>
        <div className="flex items-center gap-2.5 border-b border-border px-4">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('Search properties, leads, projects…')}
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <span className="rounded border border-border px-1.5 py-0.5 text-[9px] text-muted-foreground">ESC</span>
        </div>
        <div className="max-h-[420px] overflow-y-auto p-2">
          {!hasResults && <p className="px-3 py-10 text-center text-xs text-muted-foreground">{t('No results')} — {t('Try adjusting your filters or search terms.')}</p>}

          {navResults.length > 0 && (
            <ResultGroup label={t('Navigation')}>
              {navResults.map((l) => (
                <button key={l.href + l.label} onClick={() => go(l.href)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start transition-colors hover:bg-muted">
                  {l.icon ? <l.icon className="size-4 text-muted-foreground" /> : <ArrowRight className="size-4 text-muted-foreground" />}
                  <span className="flex-1 text-[13px]">{t(l.label)}</span>
                  <span className="text-[10px] text-muted-foreground">{t(l.group)}</span>
                </button>
              ))}
            </ResultGroup>
          )}

          {propertyResults.length > 0 && (
            <ResultGroup label={t('Properties')}>
              {propertyResults.map((p) => (
                <button key={p.id} onClick={() => go(`/properties/${p.id}`)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start transition-colors hover:bg-muted">
                  <img src={p.images[0]} alt="" className="size-8 rounded-md object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px]">{lang === 'ar' ? p.titleAr : p.title}</span>
                    <span className="block text-[10px] text-muted-foreground">{t(p.location)} · {p.code}</span>
                  </span>
                  <Building2 className="size-3.5 text-muted-foreground" />
                </button>
              ))}
            </ResultGroup>
          )}

          {leadResults.length > 0 && (
            <ResultGroup label={t('All Leads')}>
              {leadResults.map((l) => (
                <button key={l.id} onClick={() => go(`/crm/leads/${l.id}`)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start transition-colors hover:bg-muted">
                  <span className="grid size-7 place-items-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary dark:bg-white/10 dark:text-white">{l.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}</span>
                  <span className="flex-1 truncate text-[13px]">{lang === 'ar' ? l.nameAr ?? l.name : l.name}</span>
                  <span className="text-[10px] text-muted-foreground">{l.phone}</span>
                </button>
              ))}
            </ResultGroup>
          )}

          {customerResults.length > 0 && (
            <ResultGroup label={t('Customers')}>
              {customerResults.map((c) => (
                <button key={c.id} onClick={() => go(`/crm/customers/${c.id}`)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start transition-colors hover:bg-muted">
                  <Contact className="size-4 text-muted-foreground" />
                  <span className="flex-1 truncate text-[13px]">{lang === 'ar' ? c.nameAr ?? c.name : c.name}</span>
                  <span className="text-[10px] text-muted-foreground">{c.type}</span>
                </button>
              ))}
            </ResultGroup>
          )}

          {dealResults.length > 0 && (
            <ResultGroup label={t('Deals')}>
              {dealResults.map((d) => (
                <button key={d.id} onClick={() => go('/crm/pipeline?tab=deals')} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start transition-colors hover:bg-muted">
                  <Handshake className="size-4 text-muted-foreground" />
                  <span className="flex-1 truncate text-[13px]">{d.code} · {d.customerName}</span>
                  <span className="text-[10px] text-muted-foreground">{d.stage}</span>
                </button>
              ))}
            </ResultGroup>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2 text-[9px] text-muted-foreground">
          <span>{t('All data is demo data and stored locally in your browser.')}</span>
          <span>↑↓ {t('Navigate')}</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ResultGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <p className="px-3 pb-1 pt-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}
