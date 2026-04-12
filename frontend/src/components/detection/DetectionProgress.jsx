import { useLanguage } from '../../context/LanguageContext'
import { Check } from 'lucide-react'

export default function DetectionProgress({ step }) {
  const { t } = useLanguage()

  const steps = [
    { n: 1, labelKey: 'detect_progress_step1' },
    { n: 2, labelKey: 'detect_progress_step2' },
    { n: 3, labelKey: 'detect_progress_step3' },
  ]

  return (
    <div className="flex items-center w-full mb-6">
      {steps.map((s, i) => {
        const completed = s.n < step
        const active    = s.n === step
        const pending   = s.n > step

        return (
          <div key={s.n} className="flex items-center" style={{ flex: i < steps.length - 1 ? '1' : 'none' }}>
            {/* Circle + label */}
            <div className="flex flex-col items-center shrink-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                style={{
                  backgroundColor: completed ? '#558b2f' : active ? '#fff' : '#e0e0e0',
                  border: active ? '2px solid #558b2f' : completed ? '2px solid #558b2f' : '2px solid #e0e0e0',
                  color: completed ? '#fff' : active ? '#558b2f' : '#9e9e9e',
                }}
              >
                {completed ? <Check size={14} strokeWidth={3} /> : s.n}
              </div>
              <span
                className="mt-1 text-[10px] font-semibold uppercase tracking-wide hidden sm:block"
                style={{ color: active ? '#558b2f' : completed ? '#558b2f' : '#bdbdbd' }}
              >
                {t(s.labelKey)}
              </span>
            </div>

            {/* Connector line */}
            {i < steps.length - 1 && (
              <div
                className="flex-1 mx-2"
                style={{ height: '2px', backgroundColor: completed ? '#a8d060' : '#e0e0e0', marginBottom: '16px' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
