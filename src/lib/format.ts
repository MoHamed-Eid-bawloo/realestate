import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { ar as arLocale, enUS } from 'date-fns/locale'
import type { Lang } from '@/types'

const egpEn = new Intl.NumberFormat('en-EG', { maximumFractionDigits: 0 })
const egpAr = new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0, useGrouping: true })
const egpArCompact = new Intl.NumberFormat('ar-EG', { notation: 'compact', maximumFractionDigits: 1 })

export function formatNumber(value: number, lang: Lang = 'en'): string {
  return (lang === 'ar' ? egpAr : egpEn).format(value)
}

export function formatEGP(value: number, lang: Lang = 'en', compact = false): string {
  if (compact) {
    if (lang === 'ar') return `${egpArCompact.format(value)} ج.م`
    const suffix = 'EGP'
    if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B ${suffix}`
    if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M ${suffix}`
    if (Math.abs(value) >= 1_000) return `${formatNumber(value / 1000, lang)}K ${suffix}`
    return `${formatNumber(value, lang)} ${suffix}`
  }
  return `${formatNumber(value, lang)} ${lang === 'ar' ? 'ج.م' : 'EGP'}`
}

export function formatPrice(value: number, listingType: string, lang: Lang = 'en'): string {
  const base = formatEGP(value, lang, value >= 1_000_000)
  return listingType === 'rent' ? `${base}${lang === 'ar' ? ' / شهرياً' : ' / mo'}` : base
}

export function formatDate(value: string | Date, lang: Lang = 'en', pattern = 'dd MMM yyyy'): string {
  try {
    const date = typeof value === 'string' ? parseISO(value) : value
    return format(date, pattern, { locale: lang === 'ar' ? arLocale : enUS })
  } catch {
    return '—'
  }
}

export function fromNow(value: string | Date, lang: Lang = 'en'): string {
  try {
    const date = typeof value === 'string' ? parseISO(value) : value
    return formatDistanceToNow(date, { addSuffix: true, locale: lang === 'ar' ? arLocale : enUS })
  } catch {
    return '—'
  }
}

export function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join('')
}

export function daysAgo(value: string): number {
  const date = new Date(value).getTime()
  return Math.floor((Date.now() - date) / 86_400_000)
}

export function formatArea(area: number, lang: Lang = 'en'): string {
  return `${formatNumber(area, lang)} ${lang === 'ar' ? 'م²' : 'm²'}`
}

export function percent(value: number, digits = 0): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(digits)}%`
}

export function monthKey(date: Date): string {
  return format(date, 'MMM')
}

export function toDateInput(value: string): string {
  try { return format(parseISO(value), 'yyyy-MM-dd') } catch { return '' }
}
