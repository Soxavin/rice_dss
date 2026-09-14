import { Send, X } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

const productImages = {
  "Vigor BioYield+": "/images/product1-bioyield.png",
  "Vigor BioLatex": "/images/product2-biolatex.png",
  "Vigor BioControl": "/images/product3-biocontrol.png",
  "Vigor BioBooster": "/images/product4-biobooster.png",
  "Vigor BioGuard": "/images/product5-bioguard.png",
  "Vigor BioCombat": "/images/product6-biocombat.png",
  "Vigor BioGo": "/images/product7-biogo.png",
}

export default function ProductDetailModal({ product, profiles, onClose }) {
  const { lang, t } = useLanguage()
  const p = product
  const name = lang === 'km' && p.name_km ? p.name_km : p.name_en
  const desc = lang === 'km' && p.desc_km ? p.desc_km : p.desc_en
  const usage = lang === 'km' && p.usage_instructions_km ? p.usage_instructions_km : p.usage_instructions_en
  const supplier = profiles.find(pr => pr.id === p.profile_id)
  const telegram = supplier?.telegram
  const supplierName = supplier ? (lang === 'km' && supplier.name_km ? supplier.name_km : supplier.name_en) : null
  const nutrients = p.nutrients_json && typeof p.nutrients_json === 'object' ? Object.entries(p.nutrients_json) : []

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60]"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      />

      {/* Centered modal */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-modal-name"
          className="card-shadow page-enter bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
        >
          {/* Image */}
          <div className="relative w-full h-56 shrink-0 bg-neutral-50 flex items-center justify-center p-4">
            <img
              src={p.image_url || productImages[p.name_en] || "/images/hero-bg.jpg"}
              alt={name}
              className="max-h-full max-w-full object-contain"
              onError={(e) => (e.target.src = "/images/hero-bg.jpg")}
            />
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer border-none shadow"
              style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: '#424242' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 p-6 space-y-4">
            {p.category && (
              <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-md w-fit inline-block">
                {lang === 'km' && p.category_km ? p.category_km : p.category}
              </span>
            )}
            <h2 id="product-modal-name" className="text-xl font-bold text-neutral-900 leading-snug">{name}</h2>

            {supplierName && (
              <p className="text-xs text-neutral-500">{t('product_sold_by')}: <span className="font-medium text-neutral-700">{supplierName}</span></p>
            )}

            {desc && (
              <p className="text-sm text-neutral-600 leading-relaxed">{desc}</p>
            )}

            {usage && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#558b2f' }}>
                  {t('product_modal_usage')}
                </h3>
                <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">{usage}</p>
              </div>
            )}

            {nutrients.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#558b2f' }}>
                  {t('product_modal_nutrients')}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {nutrients.map(([key, value]) => (
                    <div key={key} className="rounded-lg p-2 text-center" style={{ backgroundColor: '#f0f7e6', border: '1px solid #c5e09a' }}>
                      <p className="text-[10px] uppercase text-neutral-500">{key}</p>
                      <p className="text-sm font-bold" style={{ color: '#33691e' }}>{String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-lg font-bold" style={{ color: p.price ? '#558b2f' : '#9ca3af' }}>
              {p.price || t('experts_price_on_request')}
            </p>
          </div>

          {/* Footer */}
          {telegram && (
            <div className="px-6 py-4 shrink-0" style={{ borderTop: '1px solid #f0f0f0' }}>
              <a
                href={`https://t.me/${telegram}?text=${encodeURIComponent(`Hi, I'm interested in ${name}. Please send me details.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 text-white text-sm font-semibold rounded-lg no-underline hover:opacity-90 transition-all"
                style={{ backgroundColor: '#0088cc' }}
              >
                <Send size={14} /> {t('experts_telegram')}
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
