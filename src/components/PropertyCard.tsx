import { Link } from 'react-router-dom'
import { Bath, BedDouble, Heart, MapPin, Scan, ShieldCheck, Sparkles } from 'lucide-react'
import type { Property } from '@/types'
import { useI18n } from '@/i18n'
import { formatArea, formatPrice } from '@/lib/format'
import { useAppStore } from '@/store/appStore'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export function PropertyCard({ property, layout = 'grid', className }: { property: Property; layout?: 'grid' | 'list'; className?: string }) {
  const { t, tx, lang } = useI18n()
  const favorites = useAppStore((s) => s.favorites)
  const toggleFavorite = useAppStore((s) => s.toggleFavorite)
  const developer = useAppStore((s) => s.developers.find((d) => d.id === property.developerId))
  const isFav = favorites.includes(property.id)
  const listingLabel = property.listingType === 'sale' ? t('For sale') : property.listingType === 'rent' ? t('For rent') : t('Resale')

  return (
    <div className={cn('group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-pop dark:hover:border-slate-600', layout === 'list' && 'sm:flex-row', className)}>
      <div className={cn('relative shrink-0 overflow-hidden bg-muted', layout === 'grid' ? 'aspect-[4/3]' : 'aspect-[4/3] sm:aspect-auto sm:w-[42%] sm:min-h-[210px]')}>
        <Link to={`/properties/${property.id}`} className="absolute inset-0 z-10" aria-label={property.title} />
        <img src={property.images[0]} alt={tx(property.title, property.titleAr)} loading="lazy" className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 bg-gradient-to-b from-black/35 to-transparent p-3">
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-md bg-white/95 px-2 py-1 text-[10px] font-semibold text-[#142B45] shadow-sm backdrop-blur">{listingLabel}</span>
            {property.verified && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/95 px-2 py-1 text-[10px] font-semibold text-white shadow-sm">
                <ShieldCheck className="size-3" /> {t('Verified')}
              </span>
            )}
            {property.featured && <span className="inline-flex items-center gap-1 rounded-md bg-[#142B45]/90 px-2 py-1 text-[10px] font-semibold text-white shadow-sm"><Sparkles className="size-3" /> {t('Featured')}</span>}
          </div>
          <button
            onClick={(e) => { e.preventDefault(); toggleFavorite(property.id) }}
            className={cn('relative z-20 grid size-8 shrink-0 place-items-center rounded-full bg-white/95 shadow-sm backdrop-blur transition hover:scale-105', isFav ? 'text-rose-500' : 'text-slate-500')}
            aria-label="Save property"
          >
            <Heart className={cn('size-4', isFav && 'fill-current')} />
          </button>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-3 start-3 z-20">
          <p className="text-[17px] font-semibold tracking-[-0.02em] text-white drop-shadow">{formatPrice(property.price, property.listingType, lang)}</p>
        </div>
        {property.status !== 'available' && (
          <div className="absolute bottom-3 end-3 z-20">
            <Badge tone={property.status === 'reserved' ? 'amber' : 'blue'} className="border-0 bg-white/95 text-[10px] capitalize text-[#142B45]">{t(property.status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()))}</Badge>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <Link to={`/properties/${property.id}`} className="text-[14px] font-semibold leading-snug tracking-[-0.01em] transition-colors hover:text-accent">
          {tx(property.title, property.titleAr)}
        </Link>
        <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" /> {t(property.location)}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><BedDouble className="size-3.5" /> {property.bedrooms} {t('Bedrooms short')}</span>
          <span className="inline-flex items-center gap-1.5"><Bath className="size-3.5" /> {property.bathrooms} {t('Bathrooms short')}</span>
          <span className="inline-flex items-center gap-1.5"><Scan className="size-3.5" /> {formatArea(property.area, lang)}</span>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3 mt-4">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-medium text-foreground">{developer?.name}</p>
            <p className="truncate text-[10px] text-muted-foreground">{property.readyToMove ? t('Ready to move') : `${t('Delivery')} ${new Date(property.deliveryDate).getFullYear()}`}</p>
          </div>
          <Link to={`/properties/${property.id}`} className="shrink-0 rounded-md border border-border px-2.5 py-1.5 text-[10px] font-semibold transition-colors hover:border-accent/50 hover:bg-emerald-50/40 hover:text-emerald-700 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400">
            {t('View property')}
          </Link>
        </div>
      </div>
    </div>
  )
}
