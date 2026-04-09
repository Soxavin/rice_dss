import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Leaf, ShieldCheck, Zap } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'

const AUTH_BG = '/images/farmer.jpg'

function getErrorKey(code) {
  if (!code) return 'auth_error_generic'
  if (code.includes('wrong-password') || code.includes('invalid-credential') || code.includes('invalid-email')) return 'auth_error_invalid'
  if (code.includes('user-not-found'))  return 'auth_error_no_account'
  if (code.includes('popup-closed') || code.includes('cancelled-popup')) return 'auth_error_popup_closed'
  return 'auth_error_generic'
}

const FEATURES = [
  { icon: Zap,         key: 'auth_feature_instant' },
  { icon: ShieldCheck, key: 'auth_feature_accurate' },
  { icon: Leaf,        key: 'auth_feature_bilingual' },
]

export default function SignIn() {
  const { lang, switchLang, t } = useLanguage()
  const { loginWithGoogle, loginWithFacebook, loginWithEmail } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]               = useState('')
  const [loading, setLoading]           = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await loginWithEmail(email, password)
      navigate('/')
    } catch (err) {
      setError(t(getErrorKey(err.code)))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setLoading(true)
    try {
      await loginWithGoogle()
      navigate('/')
    } catch (err) {
      if (!err.code?.includes('popup-closed')) setError(t(getErrorKey(err.code)))
    } finally {
      setLoading(false)
    }
  }

  const handleFacebook = async () => {
    setError('')
    setLoading(true)
    try {
      await loginWithFacebook()
      navigate('/')
    } catch (err) {
      if (!err.code?.includes('popup-closed')) setError(t(getErrorKey(err.code)))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* Left — Image panel */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col min-h-screen">
        <img src={AUTH_BG} alt="" className="w-full h-full object-cover absolute inset-0" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(26,46,26,0.55) 0%, rgba(26,46,26,0.75) 100%)' }} />

        <div className="relative z-10 flex flex-col h-full p-10">
          {/* Logo */}
          <img src="/images/logo.png" alt="Srov Meas" className="h-10 w-auto max-w-[160px]" style={{ filter: 'brightness(0) invert(1)' }} />

          {/* Middle — hero text */}
          <div className="flex-1 flex flex-col justify-center">
            <h2 className="font-heading text-4xl font-bold text-white italic leading-snug">
              {t('auth_protecting')}
            </h2>
            <p className="mt-3 text-white/75 text-sm max-w-sm leading-relaxed">
              {t('auth_empowering')}
            </p>

            {/* Feature pills */}
            <div className="mt-8 space-y-3">
              {FEATURES.map(({ icon: Icon, key }) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(168,208,96,0.25)', border: '1px solid rgba(168,208,96,0.4)' }}>
                    <Icon size={15} style={{ color: '#a8d060' }} />
                  </div>
                  <span className="text-sm text-white/85">{t(key)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom spacer */}
          <div />
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-10" style={{ background: 'linear-gradient(135deg, #f7fbe7 0%, #fff 40%, #fff 100%)' }}>
        <div className="w-full max-w-md">

          {/* Top accent bar */}
          <div className="h-1 w-12 rounded-full mb-8" style={{ background: 'linear-gradient(to right, #558b2f, #c5a028)' }} />

          <h1 className="font-heading text-3xl font-bold text-neutral-900">{t('auth_welcome')}</h1>
          <p className="mt-1 text-neutral-500 text-sm">{t('auth_sign_in_subtitle')}</p>

          {/* Language toggle */}
          <div className="mt-5 flex rounded-lg overflow-hidden w-fit" style={{ border: '1px solid #e0e0e0' }}>
            <button onClick={() => switchLang('en')} className={`px-4 py-1.5 text-sm font-medium border-none cursor-pointer transition-colors ${lang === 'en' ? 'bg-primary-500 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}>
              English
            </button>
            <button onClick={() => switchLang('km')} className={`px-4 py-1.5 text-sm font-medium border-none cursor-pointer transition-colors ${lang === 'km' ? 'bg-primary-500 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}>
              ភាសាខ្មែរ
            </button>
          </div>

          {/* Social buttons */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="flex items-center justify-center gap-2 py-2.5 bg-white hover:bg-neutral-50 cursor-pointer text-sm font-medium text-neutral-700 rounded-xl transition-colors disabled:opacity-60"
              style={{ border: '1.5px solid #e0e0e0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-4 h-4" />
              {t('auth_google')}
            </button>
            <button
              onClick={handleFacebook}
              disabled={loading}
              className="flex items-center justify-center gap-2 py-2.5 bg-white hover:bg-neutral-50 cursor-pointer text-sm font-medium text-neutral-700 rounded-xl transition-colors disabled:opacity-60"
              style={{ border: '1.5px solid #e0e0e0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
            >
              <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" alt="Facebook" className="w-4 h-4" />
              {t('auth_facebook')}
            </button>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-neutral-200" />
            <span className="text-xs text-neutral-400 font-medium">{t('auth_or_sign_up')}</span>
            <div className="flex-1 h-px bg-neutral-200" />
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4" aria-describedby={error ? 'signin-error' : undefined}>
            {error && (
              <div id="signin-error" role="alert" className="px-4 py-3 rounded-xl text-sm flex items-start gap-2" style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b' }}>
                <span className="shrink-0">⚠️</span> {error}
              </div>
            )}
            <div>
              <label htmlFor="signin-email" className="block text-sm font-semibold text-neutral-700 mb-1.5">{t('auth_email')}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 pointer-events-none" style={{ color: '#9e9e9e' }} />
                <input
                  id="signin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth_email_placeholder')}
                  required
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{ border: '1.5px solid #e0e0e0', backgroundColor: '#fafafa' }}
                  onFocus={e => e.target.style.borderColor = '#558b2f'}
                  onBlur={e => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>
            </div>
            <div>
              <label htmlFor="signin-password" className="block text-sm font-semibold text-neutral-700 mb-1.5">{t('auth_password')}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 pointer-events-none" style={{ color: '#9e9e9e' }} />
                <input
                  id="signin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth_password_placeholder')}
                  required
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{ border: '1.5px solid #e0e0e0', backgroundColor: '#fafafa' }}
                  onFocus={e => e.target.style.borderColor = '#558b2f'}
                  onBlur={e => e.target.style.borderColor = '#e0e0e0'}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 bg-transparent border-none cursor-pointer" style={{ color: '#9e9e9e' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="text-right mt-1.5">
                <button type="button" className="text-xs font-medium bg-transparent border-none cursor-pointer hover:underline p-0" style={{ color: '#558b2f' }}>{t('auth_forgot')}</button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-white font-semibold rounded-xl border-none cursor-pointer transition-opacity disabled:opacity-60 hover:opacity-90"
              style={{ backgroundColor: '#558b2f', boxShadow: '0 2px 10px rgba(85,139,47,0.30)' }}
            >
              {loading ? t('auth_loading') : t('auth_sign_in_btn')}
            </button>
          </form>

          <div className="mt-3 text-center">
            <Link to="/" className="text-sm text-neutral-500 hover:text-primary-600 no-underline">
              {t('auth_continue_guest')}
            </Link>
          </div>

          <p className="mt-6 text-center text-sm text-neutral-500">
            {t('auth_no_account')}{' '}
            <Link to="/sign-up" className="font-semibold no-underline hover:underline" style={{ color: '#558b2f' }}>
              {t('auth_sign_up_link')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
