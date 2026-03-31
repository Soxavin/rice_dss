import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ChevronDown, Menu, X } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { lang, setLang, t } = useLanguage()
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const dropdownRef = useRef(null)

  const toggleLang = () => setLang(lang === 'en' ? 'km' : 'en')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setServicesOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isActive = (path) => location.pathname === path

  return (
    <nav className={`sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b transition-all duration-300 ${scrolled ? 'border-neutral-200 shadow-sm' : 'border-neutral-100'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo — gold italic matching Figma */}
          <Link to="/" className="flex items-center gap-1 no-underline">
            <span className="font-heading text-2xl font-bold italic" style={{ color: '#c5a028' }}>
              Sro<span className="text-primary-500">🌾</span>Meas
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className={`text-sm font-medium no-underline transition-colors ${
                isActive('/') ? 'text-primary-600' : 'text-neutral-700 hover:text-primary-600'
              }`}
            >
              {t('nav_home')}
            </Link>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setServicesOpen(!servicesOpen)}
                className="text-sm font-medium text-neutral-700 hover:text-primary-600 flex items-center gap-1 bg-transparent border-none cursor-pointer transition-colors"
              >
                {t('nav_services')}
                <ChevronDown size={14} className={`transition-transform duration-200 ${servicesOpen ? 'rotate-180' : ''}`} />
              </button>
              {servicesOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl py-2 z-50 animate-in" style={{ border: '1px solid #e0e0e0', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
                  <Link to="/detect" className="block px-4 py-2.5 text-sm text-neutral-700 hover:bg-primary-50 hover:text-primary-700 no-underline transition-colors" onClick={() => setServicesOpen(false)}>
                    {t('service_detection')}
                  </Link>
                  <Link to="/learn" className="block px-4 py-2.5 text-sm text-neutral-700 hover:bg-primary-50 hover:text-primary-700 no-underline transition-colors" onClick={() => setServicesOpen(false)}>
                    {t('service_learning')}
                  </Link>
                  <Link to="/experts" className="block px-4 py-2.5 text-sm text-neutral-700 hover:bg-primary-50 hover:text-primary-700 no-underline transition-colors" onClick={() => setServicesOpen(false)}>
                    {t('service_expert')}
                  </Link>
                  <Link to="/crop-integration" className="block px-4 py-2.5 text-sm text-neutral-700 hover:bg-primary-50 hover:text-primary-700 no-underline transition-colors" onClick={() => setServicesOpen(false)}>
                    {t('service_crop')}
                  </Link>
                </div>
              )}
            </div>

            <Link
              to="/experts"
              className={`text-sm font-medium no-underline transition-colors ${
                isActive('/experts') ? 'text-primary-600' : 'text-neutral-700 hover:text-primary-600'
              }`}
            >
              {t('nav_contact')}
            </Link>
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language toggle — dark pill matching Figma */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium text-white cursor-pointer border-none transition-all hover:opacity-90"
              style={{ background: '#424242' }}
            >
              <span className="text-xs">{lang === 'en' ? '🇬🇧' : '🇰🇭'}</span>
              {lang === 'en' ? 'English' : 'ខ្មែរ'}
              <ChevronDown size={12} />
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/detect"
                  className="text-sm font-medium no-underline transition-colors hover:opacity-90"
                  style={{ backgroundColor: '#558b2f', color: '#fff', borderRadius: '8px', padding: '8px 16px', boxShadow: '0 2px 6px rgba(85,139,47,0.3)' }}
                >
                  {t('nav_start_analysis')}
                </Link>
                <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-medium">
                  {user?.name?.[0] || 'U'}
                </div>
                <button onClick={logout} className="text-sm text-neutral-600 hover:text-neutral-800 bg-transparent border-none cursor-pointer transition-colors">
                  {t('nav_logout')}
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/sign-in"
                  className="text-sm font-medium no-underline transition-colors hover:bg-primary-50"
                  style={{ border: '2px solid #558b2f', color: '#33691e', borderRadius: '8px', padding: '8px 16px' }}
                >
                  {t('nav_sign_in')}
                </Link>
                <Link
                  to="/detect"
                  className="text-sm font-medium no-underline transition-colors hover:opacity-90"
                  style={{ backgroundColor: '#558b2f', color: '#fff', borderRadius: '8px', padding: '8px 16px', boxShadow: '0 2px 6px rgba(85,139,47,0.3)' }}
                >
                  {t('nav_start_analysis')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-neutral-600 bg-transparent border-none cursor-pointer"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-neutral-100 px-4 py-4 space-y-1 shadow-lg">
          <Link to="/" className="block text-sm font-medium text-neutral-700 no-underline py-2.5 px-3 rounded-lg hover:bg-neutral-50" onClick={() => setMobileOpen(false)}>
            {t('nav_home')}
          </Link>
          <Link to="/detect" className="block text-sm font-medium text-neutral-700 no-underline py-2.5 px-3 rounded-lg hover:bg-neutral-50" onClick={() => setMobileOpen(false)}>
            {t('service_detection')}
          </Link>
          <Link to="/learn" className="block text-sm font-medium text-neutral-700 no-underline py-2.5 px-3 rounded-lg hover:bg-neutral-50" onClick={() => setMobileOpen(false)}>
            {t('service_learning')}
          </Link>
          <Link to="/experts" className="block text-sm font-medium text-neutral-700 no-underline py-2.5 px-3 rounded-lg hover:bg-neutral-50" onClick={() => setMobileOpen(false)}>
            {t('service_expert')}
          </Link>
          <Link to="/crop-integration" className="block text-sm font-medium text-neutral-700 no-underline py-2.5 px-3 rounded-lg hover:bg-neutral-50" onClick={() => setMobileOpen(false)}>
            {t('service_crop')}
          </Link>
          <hr className="border-neutral-100 my-2" />
          <button onClick={toggleLang} className="w-full text-left text-sm font-medium text-neutral-600 bg-transparent border-none cursor-pointer py-2.5 px-3 rounded-lg hover:bg-neutral-50">
            {lang === 'en' ? '🇰🇭 Switch to ភាសាខ្មែរ' : '🇬🇧 Switch to English'}
          </button>
          <div className="pt-2 space-y-2">
            {isAuthenticated ? (
              <>
                <Link to="/detect" className="block text-center text-sm font-medium text-white no-underline px-4 py-2.5 rounded-lg" style={{ backgroundColor: '#558b2f' }} onClick={() => setMobileOpen(false)}>
                  {t('nav_start_analysis')}
                </Link>
                <button onClick={() => { logout(); setMobileOpen(false) }} className="w-full text-left text-sm font-medium text-neutral-600 bg-transparent border-none cursor-pointer py-2.5 px-3 rounded-lg hover:bg-neutral-50">
                  {t('nav_logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/sign-in" className="block text-sm font-medium text-neutral-700 no-underline py-2.5 px-3 rounded-lg hover:bg-neutral-50" onClick={() => setMobileOpen(false)}>
                  {t('nav_sign_in')}
                </Link>
                <Link to="/detect" className="block text-center text-sm font-medium text-white no-underline px-4 py-2.5 rounded-lg bg-primary-600" onClick={() => setMobileOpen(false)}>
                  {t('nav_start_analysis')}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
