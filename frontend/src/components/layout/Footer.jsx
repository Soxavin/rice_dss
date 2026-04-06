import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'

export default function Footer() {
  const { lang, switchLang, t } = useLanguage()

  return (
    <footer className="bg-footer-dark text-white">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="no-underline inline-block" style={{ userSelect: 'none' }}>
              <img
                src="/images/logo.png"
                alt="Srov Meas"
                className="h-9 w-auto"
                draggable="false"
                style={{ filter: 'brightness(0) invert(1)', userSelect: 'none', WebkitUserDrag: 'none' }}
              />
            </Link>
            <p className="mt-3 text-sm text-footer-text leading-relaxed">
              {t('footer_tagline')}
            </p>
            <button
              onClick={() => switchLang(lang === 'en' ? 'km' : 'en')}
              className="mt-4 text-sm text-primary-300 hover:text-primary-200 bg-transparent border-none cursor-pointer transition-colors"
            >
              {t('footer_switch_km')}
            </button>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">{t('footer_quick_links')}</h4>
            <ul className="space-y-2.5 list-none">
              <li><Link to="/" className="text-sm text-footer-text hover:text-white no-underline transition-colors">{t('footer_home')}</Link></li>
              <li><Link to="/detect" className="text-sm text-footer-text hover:text-white no-underline transition-colors">{t('footer_detection')}</Link></li>
              <li><Link to="/experts" className="text-sm text-footer-text hover:text-white no-underline transition-colors">{t('footer_experts')}</Link></li>
              <li><Link to="/" className="text-sm text-footer-text hover:text-white no-underline transition-colors">{t('footer_about')}</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">{t('footer_resources')}</h4>
            <ul className="space-y-2.5 list-none">
              <li><Link to="/learn" className="text-sm text-footer-text hover:text-white no-underline transition-colors">{t('footer_disease_library')}</Link></li>
              <li><Link to="/learn" className="text-sm text-footer-text hover:text-white no-underline transition-colors">{t('footer_video_tutorials')}</Link></li>
              <li><Link to="/" className="text-sm text-footer-text hover:text-white no-underline transition-colors">{t('footer_faqs')}</Link></li>
              <li><Link to="/" className="text-sm text-footer-text hover:text-white no-underline transition-colors">{t('footer_support')}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">{t('footer_contact')}</h4>
            <ul className="space-y-2.5 list-none">
              <li className="text-sm text-footer-text">info@srovmeas.com</li>
              <li className="text-sm text-footer-text">+855 12 345 678</li>
              <li className="text-sm text-footer-text">Phnom Penh, Cambodia</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-footer-text">{t('footer_copyright')}</p>
          <div className="flex gap-4">
            <a href="#" className="text-xs text-footer-text hover:text-white no-underline transition-colors">{t('footer_privacy')}</a>
            <a href="#" className="text-xs text-footer-text hover:text-white no-underline transition-colors">{t('footer_terms')}</a>
            <a href="#" className="text-xs text-footer-text hover:text-white no-underline transition-colors">{t('footer_cookies')}</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
