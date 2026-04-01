import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock } from 'lucide-react'
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

export default function SignUp() {
  const { lang, switchLang, t } = useLanguage()
  const { loginWithGoogle, loginWithFacebook, registerWithEmail } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', agreed: false })
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
    <div className="min-h-[calc(100vh-64px)] flex">
      {/* Left — Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img src={AUTH_BG} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute top-8 left-8">
          <span className="font-heading text-2xl font-bold text-white italic">Srov Meas</span>
        </div>
        <div className="absolute bottom-0 left-0 p-10">
          <h2 className="font-heading text-3xl font-bold text-white italic leading-snug">
            {t('auth_protecting')}
          </h2>
          <p className="mt-3 text-white/80 text-sm max-w-md leading-relaxed">
            {t('auth_empowering')}
          </p>
          <div className="flex gap-2 mt-6">
            <span className="w-8 h-2 rounded-full bg-primary-400" />
            <span className="w-2 h-2 rounded-full bg-white/40" />
            <span className="w-2 h-2 rounded-full bg-white/40" />
          </div>
          <p className="mt-3 text-xs text-white/50">600+ {t('auth_farmers_joined')}</p>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-white via-primary-50/30 to-white">
        <div className="w-full max-w-md">
          <h1 className="font-heading text-3xl font-bold text-neutral-900">{t('auth_create')}</h1>
          <p className="mt-1 text-neutral-600 text-sm">{t('auth_sign_up_subtitle')}</p>

          {/* Language toggle */}
          <div className="mt-6 flex rounded-lg overflow-hidden w-fit" style={{ border: '1px solid #e0e0e0' }}>
            <button onClick={() => switchLang('en')} className={`px-4 py-1.5 text-sm font-medium border-none cursor-pointer transition-colors ${lang === 'en' ? 'bg-primary-500 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}>
              English
            </button>
            <button onClick={() => switchLang('km')} className={`px-4 py-1.5 text-sm font-medium border-none cursor-pointer transition-colors ${lang === 'km' ? 'bg-primary-500 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}>
              ភាសាខ្មែរ
            </button>
          </div>

          {/* Social buttons */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white hover:bg-neutral-50 cursor-pointer text-sm text-neutral-700 rounded-lg transition-colors disabled:opacity-60"
              style={{ border: '1px solid #e0e0e0' }}
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-4 h-4" />
              {t('auth_google')}
            </button>
            <button
              onClick={handleFacebook}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white hover:bg-neutral-50 cursor-pointer text-sm text-neutral-700 rounded-lg transition-colors disabled:opacity-60"
              style={{ border: '1px solid #e0e0e0' }}
            >
              <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" alt="Facebook" className="w-4 h-4" />
              {t('auth_facebook')}
            </button>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-px bg-neutral-200" />
            <span className="text-xs text-neutral-500">{t('auth_or_sign_up')}</span>
            <div className="flex-1 h-px bg-neutral-200" />
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {error && (
              <div className="px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b' }}>
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">{t('auth_full_name')}</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-3 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder={t('auth_full_name_placeholder')}
                  required
                  className="w-full pl-9 pr-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">{t('auth_email')}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder={t('auth_email_placeholder')}
                  required
                  className="w-full pl-9 pr-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">{t('auth_password')}</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3 text-neutral-400 pointer-events-none" />
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                    required
                    className="w-full pl-9 pr-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">{t('auth_confirm_password')}</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3 text-neutral-400 pointer-events-none" />
                  <input
                    type="password"
                    value={form.confirm}
                    onChange={(e) => update('confirm', e.target.value)}
                    required
                    className="w-full pl-9 pr-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.agreed}
                onChange={(e) => update('agreed', e.target.checked)}
                className="mt-1 accent-primary-600"
              />
              <span className="text-xs text-neutral-600">{t('auth_agree_terms')}</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-white font-medium rounded-lg border-none cursor-pointer transition-colors disabled:opacity-60"
              style={{ backgroundColor: '#558b2f' }}
            >
              {loading ? t('auth_loading') : `${t('auth_register_btn')} →`}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-neutral-600">
            {t('auth_have_account')}{' '}
            <Link to="/sign-in" className="text-primary-600 font-medium no-underline hover:underline">
              {t('auth_sign_in_link')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
