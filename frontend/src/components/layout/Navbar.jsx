import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ChevronDown, Menu, X } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { lang, switchLang, t } = useLanguage()
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const dropdownRef = useRef(null)
  const langDropdownRef = useRef(null)
  const closeTimer = useRef(null)
  const langCloseTimer = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setServicesOpen(false)
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target)) {
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const openServices = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setServicesOpen(true)
  }
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setServicesOpen(false), 120)
  }

  const openLang = () => {
    if (langCloseTimer.current) clearTimeout(langCloseTimer.current)
    setLangOpen(true)
  }
  const scheduleLangClose = () => {
    langCloseTimer.current = setTimeout(() => setLangOpen(false), 120)
  }

  const isActive = (path) => location.pathname === path

  const langLabel = lang === 'en' ? 'English' : 'ភាសាខ្មែរ'
  const langFlag  = lang === 'en' ? '🇬🇧' : '🇰🇭'

  return (
    <nav className={`sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b transition-all duration-300 ${scrolled ? 'border-neutral-200 shadow-sm' : 'border-neutral-100'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center no-underline shrink-0" onMouseDown={(e) => e.preventDefault()}>
            <img src="/images/logo.png" alt="Srov Meas" className="h-8 w-auto" draggable="false" onDragStart={(e) => e.preventDefault()} />
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

            {/* Services dropdown — hover with small delay to prevent glitch */}
            <div
              className="relative"
              ref={dropdownRef}
              onMouseEnter={openServices}
              onMouseLeave={scheduleClose}
            >
              <button
                onClick={() => setServicesOpen(!servicesOpen)}
                aria-expanded={servicesOpen}
                className="text-sm font-medium text-neutral-700 hover:text-primary-600 flex items-center gap-1 bg-transparent border-none cursor-pointer transition-colors"
              >
                {t('nav_services')}
                <ChevronDown size={14} className={`transition-transform duration-200 ${servicesOpen ? 'rotate-180' : ''}`} />
              </button>

              {servicesOpen && (
                <div
                  className="absolute top-full left-0 w-56 bg-white rounded-xl py-2 z-50 animate-in"
                  style={{ marginTop: '0', paddingTop: '10px', border: '1px solid #e0e0e0', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
                  onMouseEnter={openServices}
                  onMouseLeave={scheduleClose}
                >
                  <Link to="/detect" className="block px-4 py-2.5 text-sm text-neutral-700 hover:bg-primary-50 hover:text-primary-700 no-underline transition-colors" onClick={() => setServicesOpen(false)}>
                    {t('service_detection')}
                  </Link>
                  <Link to="/learn" className="block px-4 py-2.5 text-sm text-neutral-700 hover:bg-primary-50 hover:text-primary-700 no-underline transition-colors" onClick={() => setServicesOpen(false)}>
                    {t('service_learning')}
                  </Link>
                  <Link to="/experts" className="block px-4 py-2.5 text-sm text-neutral-700 hover:bg-primary-50 hover:text-primary-700 no-underline transition-colors" onClick={() => setServicesOpen(false)}>
                    {t('service_expert')}
                  </Link>
                  <Link to={isAuthenticated ? '/profile' : '/sign-in'} className="block px-4 py-2.5 text-sm text-neutral-700 hover:bg-primary-50 hover:text-primary-700 no-underline transition-colors" onClick={() => setServicesOpen(false)}>
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

          {/* Right side — desktop */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language dropdown — hover+click, active language highlighted */}
            <div
              className="relative"
              ref={langDropdownRef}
              onMouseEnter={openLang}
              onMouseLeave={scheduleLangClose}
            >
              <button
                onClick={() => setLangOpen(!langOpen)}
                aria-expanded={langOpen}
                aria-label={langLabel}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all hover:opacity-90"
                style={{
                  backgroundColor: '#f0f7e6',
                  border: '1.5px solid #7cb342',
                  color: '#33691e',
                  minWidth: '140px',
                  justifyContent: 'space-between',
                }}
              >
                <span className="text-base leading-none">{langFlag}</span>
                <span className="flex-1 text-left px-1.5">{langLabel}</span>
                <ChevronDown size={13} className={`transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`} style={{ color: '#558b2f', flexShrink: 0 }} />
              </button>

              {langOpen && (
                <div
                  className="absolute top-full right-0 w-44 bg-white rounded-xl py-1 z-50"
                  style={{ marginTop: '0', paddingTop: '8px', border: '1px solid #e0e0e0', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
                  onMouseEnter={openLang}
                  onMouseLeave={scheduleLangClose}
                >
                  {[
                    { code: 'en', flag: '🇬🇧', label: 'English' },
                    { code: 'km', flag: '🇰🇭', label: 'ភាសាខ្មែរ' },
                  ].map(({ code, flag, label }) => (
                    <button
                      key={code}
                      onClick={() => { switchLang(code); setLangOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium cursor-pointer border-none transition-colors text-left"
                      style={lang === code
                        ? { backgroundColor: '#f0f7e6', color: '#33691e' }
                        : { backgroundColor: 'transparent', color: '#424242' }}
                    >
                      <span className="text-base leading-none">{flag}</span>
                      <span>{label}</span>
                      {lang === code && <span className="ml-auto text-xs" style={{ color: '#7cb342' }}>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/detect"
                  className="text-sm font-medium no-underline transition-colors hover:opacity-90"
                  style={{ backgroundColor: '#558b2f', color: '#fff', borderRadius: '8px', padding: '8px 16px', boxShadow: '0 2px 6px rgba(85,139,47,0.3)' }}
                >
                  {t('nav_start_analysis')}
                </Link>
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-medium">
                    {user?.displayName?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
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

          {/* Mobile right side: language + sign-in + hamburger */}
          <div className="md:hidden flex items-center gap-2">
            {/* Language quick toggle */}
            <button
              onClick={() => switchLang(lang === 'en' ? 'km' : 'en')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer border transition-colors"
              style={{ backgroundColor: '#f0f7e6', border: '1.5px solid #7cb342', color: '#33691e' }}
            >
              <span>{langFlag}</span>
              <span>{lang === 'en' ? 'EN' : 'ខ្មែរ'}</span>
            </button>

            {!isAuthenticated && (
              <Link
                to="/sign-in"
                className="text-xs font-semibold no-underline px-3 py-1.5 rounded-lg"
                style={{ border: '1.5px solid #558b2f', color: '#33691e' }}
              >
                {t('nav_sign_in')}
              </Link>
            )}

            {isAuthenticated && user?.photoURL && (
              <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full object-cover" referrerPolicy="no-referrer" />
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={t('nav_menu_toggle')}
              aria-expanded={mobileOpen}
              className="p-2 text-neutral-600 bg-transparent border-none cursor-pointer"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-neutral-100 px-4 py-4 space-y-1 shadow-lg mobile-menu-enter">
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
          <Link to={isAuthenticated ? '/profile' : '/sign-in'} className="block text-sm font-medium text-neutral-700 no-underline py-2.5 px-3 rounded-lg hover:bg-neutral-50" onClick={() => setMobileOpen(false)}>
            {t('service_crop')}
          </Link>
          <hr className="border-neutral-100 my-2" />
          <div className="pt-1 space-y-2">
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
              <Link to="/detect" className="block text-center text-sm font-medium text-white no-underline px-4 py-2.5 rounded-lg bg-primary-600" onClick={() => setMobileOpen(false)}>
                {t('nav_start_analysis')}
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
