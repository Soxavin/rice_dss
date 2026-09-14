import { useState, useEffect } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { ShoppingBag, FlaskConical } from 'lucide-react'
import { getProfiles, getProducts } from '../../api/client'
import ProductDetailModal from '../Experts/ProductDetailModal'

const productImages = {
  "Vigor BioYield+": "/images/product1-bioyield.png",
  "Vigor BioLatex": "/images/product2-biolatex.png",
  "Vigor BioControl": "/images/product3-biocontrol.png",
  "Vigor BioBooster": "/images/product4-biobooster.png",
  "Vigor BioGuard": "/images/product5-bioguard.png",
  "Vigor BioCombat": "/images/product6-biocombat.png",
  "Vigor BioGo": "/images/product7-biogo.png",
}

export default function ProductsPage() {
  const { lang, t } = useLanguage()
  const [products, setProducts]     = useState([])
  const [profiles, setProfiles]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [loadError, setLoadError]   = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  useEffect(() => {
    Promise.all([getProducts(), getProfiles()])
      .then(([prodRes, profRes]) => {
        setProducts(prodRes.data || [])
        setProfiles(profRes.data || [])
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedProduct) return
    const onKey = (e) => { if (e.key === 'Escape') setSelectedProduct(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [selectedProduct])

  return (
    <div>
      {loadError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="p-3 rounded-xl text-sm" style={{ backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fca5a5' }}>
            {t('experts_load_error')}
          </div>
        </div>
      )}

      {/* ═══════════════ PAGE HEADER BANNER ═══════════════ */}
      <div
        className="relative overflow-hidden py-14 px-4"
        style={{ background: 'linear-gradient(135deg, #1a2e1a 0%, #2d4a1e 60%, #1a2e1a 100%)' }}
      >
        <div
          className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none"
          style={{ border: '36px solid #558b2f', opacity: 0.12 }}
        />
        <div
          className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full pointer-events-none"
          style={{ border: '24px solid #c5a028', opacity: 0.08 }}
        />

        <div className="max-w-7xl mx-auto relative">
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#8bc34a' }}>
            {t('nav_products')}
          </p>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-white italic leading-tight">
            {t('products_page_title')}
          </h1>
          <p className="mt-2 text-sm max-w-lg" style={{ color: '#a8c89a' }}>
            {t('products_page_subtitle')}
          </p>
        </div>
      </div>

      {/* ═══════════════ PAGE CONTENT ═══════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xl"
            style={{ background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', border: '1px solid #ddd6fe' }}
          >
            <FlaskConical size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-neutral-900">
              {t('experts_section_treatments_title')}
            </h3>
            <p className="text-sm text-neutral-500 mt-0.5">
              {t('experts_section_treatments_desc')}
            </p>
          </div>
        </div>

        <div
          className="h-px mb-8"
          style={{ background: 'linear-gradient(to right, #e8be3f, #558b2f)' }}
        />

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="rounded-xl overflow-hidden border border-gray-200 min-h-[320px] animate-pulse" style={{ backgroundColor: '#fafafa' }} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-sm text-neutral-400">{t('products_page_empty')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {products.map((p) => {
              const supplier = profiles.find(pr => pr.id === p.profile_id)
              const supplierTelegram = supplier?.telegram
              const supplierName = supplier ? (lang === 'km' && supplier.name_km ? supplier.name_km : supplier.name_en) : null
              const name = lang === 'km' && p.name_km ? p.name_km : p.name_en
              const desc = lang === 'km' && p.desc_km ? p.desc_km : p.desc_en
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProduct(p)}
                  role="button"
                  className="
                    bg-white rounded-xl overflow-hidden flex flex-col border border-gray-400 min-h-[320px]
                    transition-all duration-300 ease-out cursor-pointer
                    hover:shadow-xl hover:-translate-y-1
                  "
                >
                  {/* Image */}
                  <div className="w-full h-38 bg-neutral-20 flex items-center justify-center overflow-hidden p-2">
                    <img
                      src={p.image_url || productImages[p.name_en] || "/images/hero-bg.jpg"}
                      alt={name}
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => (e.target.src = "/images/hero-bg.jpg")}
                    />
                  </div>

                  {/* Content */}
                  <div className="p-6 flex flex-col flex-1 min-h-[200px]">
                    <div className="space-y-3">
                      <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-md w-fit">
                        {lang === 'km' && p.category_km ? p.category_km : p.category}
                      </span>

                      <h4 className="mt-3 text-lg font-semibold text-neutral-900 leading-snug">
                        {name}
                      </h4>

                      {supplierName && (
                        <p className="text-xs text-neutral-500">{t('product_sold_by')}: <span className="font-medium text-neutral-700">{supplierName}</span></p>
                      )}

                      {desc && (
                        <p className="text-xs text-neutral-600 leading-relaxed line-clamp-2">
                          {desc}
                        </p>
                      )}
                    </div>

                    {supplierTelegram && (
                      <div className="mt-6">
                        <a
                          href={`https://t.me/${supplierTelegram}?text=${encodeURIComponent(
                            `Hi, I'm interested in ${name}. Please send me details.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-full inline-flex items-center justify-center gap-2 py-2.5 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all"
                          style={{ backgroundColor: '#558b2f' }}
                        >
                          <ShoppingBag size={14} />
                          Telegram
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          profiles={profiles}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  )
}
