import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Eye, EyeOff, Leaf, ShieldCheck, Zap } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'

const AUTH_BG = '/images/farmer.jpg'

function getErrorKey(code) {
  if (!code) return 'auth_error_generic'
  if (code.includes('email-already-in-use')) return 'auth_error_email_in_use'
  if (code.includes('weak-password'))        return 'auth_error_weak_password'
  if (code.includes('invalid-email'))        return 'auth_error_invalid'
  if (code.includes('popup-closed') || code.includes('cancelled-popup')) return 'auth_error_popup_closed'
  return 'auth_error_generic'
}

const FEATURES = [
  { icon: Zap,         key: 'auth_feature_instant' },
  { icon: ShieldCheck, key: 'auth_feature_accurate' },
  { icon: Leaf,        key: 'auth_feature_bilingual' },
]

export default function SignUp() {
  const { lang, switchLang, t } = useLanguage()
  const { loginWithGoogle, loginWithFacebook, registerWithEmail } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', agreed: false })
  const [showPassword, setShowPassword]   = useState(false)
  const [showConfirm, setShowConfirm]     = useState(false)
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) return setError(t('auth_passwords_mismatch'))
    if (!form.agreed) return setError(t('auth_agree_required'))
    setLoading(true)
    try {
      await registerWithEmail(form.email, form.password, form.name)
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
          <img src="/images/logo.png" alt="Srov Meas" className="h-10 w-auto max-w-[160px]" style={{ filter: 'brightness(0) invert(1)' }} />

          <div className="flex-1 flex flex-col justify-center">
            <h2 className="font-heading text-4xl font-bold text-white italic leading-snug">
              {t('auth_protecting')}
            </h2>
            <p className="mt-3 text-white/75 text-sm max-w-sm leading-relaxed">
              {t('auth_empowering')}
            </p>

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

          <div />
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-10" style={{ background: 'linear-gradient(135deg, #f7fbe7 0%, #fff 40%, #fff 100%)' }}>
        <div className="w-full max-w-md">

          <div className="h-1 w-12 rounded-full mb-8" style={{ background: 'linear-gradient(to right, #558b2f, #c5a028)' }} />

          <h1 className="font-heading text-3xl font-bold text-neutral-900">{t('auth_create')}</h1>
          <p className="mt-1 text-neutral-500 text-sm">{t('auth_sign_up_subtitle')}</p>

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

          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-px bg-neutral-200" />
            <span className="text-xs text-neutral-400 font-medium">{t('auth_or_sign_up')}</span>
            <div className="flex-1 h-px bg-neutral-200" />
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3" aria-describedby={error ? 'signup-error' : undefined}>
            {error && (
              <div id="signup-error" role="alert" className="px-4 py-3 rounded-xl text-sm flex items-start gap-2" style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b' }}>
                <span className="shrink-0">⚠️</span> {error}
              </div>
            )}

            <div>
              <label htmlFor="signup-name" className="block text-sm font-semibold text-neutral-700 mb-1.5">{t('auth_full_name')}</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-3 pointer-events-none" style={{ color: '#9e9e9e' }} />
                <input
                  id="signup-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder={t('auth_full_name_placeholder')}
                  required
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{ border: '1.5px solid #e0e0e0', backgroundColor: '#fafafa' }}
                  onFocus={e => e.target.style.borderColor = '#558b2f'}
                  onBlur={e => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-email" className="block text-sm font-semibold text-neutral-700 mb-1.5">{t('auth_email')}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 pointer-events-none" style={{ color: '#9e9e9e' }} />
                <input
                  id="signup-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder={t('auth_email_placeholder')}
                  required
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{ border: '1.5px solid #e0e0e0', backgroundColor: '#fafafa' }}
                  onFocus={e => e.target.style.borderColor = '#558b2f'}
                  onBlur={e => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="signup-password" className="block text-sm font-semibold text-neutral-700 mb-1.5">{t('auth_password')}</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3 pointer-events-none" style={{ color: '#9e9e9e' }} />
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                    required
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{ border: '1.5px solid #e0e0e0', backgroundColor: '#fafafa' }}
                    onFocus={e => e.target.style.borderColor = '#558b2f'}
                    onBlur={e => e.target.style.borderColor = '#e0e0e0'}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-2.5 bg-transparent border-none cursor-pointer" style={{ color: '#9e9e9e' }}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="signup-confirm" className="block text-sm font-semibold text-neutral-700 mb-1.5">{t('auth_confirm_password')}</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3 pointer-events-none" style={{ color: '#9e9e9e' }} />
                  <input
                    id="signup-confirm"
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirm}
                    onChange={(e) => update('confirm', e.target.value)}
                    required
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{ border: '1.5px solid #e0e0e0', backgroundColor: '#fafafa' }}
                    onFocus={e => e.target.style.borderColor = '#558b2f'}
                    onBlur={e => e.target.style.borderColor = '#e0e0e0'}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-2.5 top-2.5 bg-transparent border-none cursor-pointer" style={{ color: '#9e9e9e' }}>
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>

            <label className="flex items-start gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={form.agreed}
                onChange={(e) => update('agreed', e.target.checked)}
                className="mt-0.5 accent-primary-600"
              />
              <span className="text-xs text-neutral-600">{t('auth_agree_terms')}</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-white font-semibold rounded-xl border-none cursor-pointer transition-opacity disabled:opacity-60 hover:opacity-90"
              style={{ backgroundColor: '#558b2f', boxShadow: '0 2px 10px rgba(85,139,47,0.30)' }}
            >
              {loading ? t('auth_loading') : `${t('auth_register_btn')} →`}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-neutral-500">
            {t('auth_have_account')}{' '}
            <Link to="/sign-in" className="font-semibold no-underline hover:underline" style={{ color: '#558b2f' }}>
              {t('auth_sign_in_link')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
