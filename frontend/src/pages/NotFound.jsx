import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { ArrowRight, Leaf } from 'lucide-react'

export default function NotFound() {
  const { t } = useLanguage()
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
      style={{ background: 'linear-gradient(135deg, #f7fbe7 0%, #eef5d3 60%, #fff 100%)' }}
    >
      {/* Big 404 */}
      <div className="relative mb-6 select-none">
        <span
          className="font-heading font-bold text-[9rem] leading-none"
          style={{ color: '#d4e6a5', letterSpacing: '-4px' }}
        >
          404
        </span>
        <div
          className="absolute inset-0 flex items-center justify-center"
        >
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: '#558b2f', boxShadow: '0 8px 32px rgba(85,139,47,0.35)' }}
          >
            <Leaf size={36} color="#fff" />
          </div>
        </div>
      </div>

      <h1 className="font-heading text-3xl font-bold italic text-neutral-900">
        Page Not Found
      </h1>
      <p className="mt-3 text-neutral-500 text-sm max-w-sm leading-relaxed">
        This page doesn't exist or has been moved. Let's get you back to your rice field.
      </p>

      <div className="mt-8 flex flex-wrap gap-3 justify-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white rounded-xl no-underline transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#558b2f', boxShadow: '0 2px 8px rgba(85,139,47,0.3)' }}
        >
          Go Home <ArrowRight size={15} />
        </Link>
        <Link
          to="/detect"
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl no-underline transition-colors hover:bg-primary-50"
          style={{ border: '2px solid #558b2f', color: '#33691e' }}
        >
          Start Analysis
        </Link>
      </div>
    </div>
  )
}
