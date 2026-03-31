import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Camera, X, Image as ImageIcon, Sun, Focus, EyeOff, Maximize } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

// Analysis modes
const MODES = ['hybrid', 'ml', 'questionnaire']

export default function Step1Upload() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [images, setImages] = useState([])
  const [dragOver, setDragOver] = useState(false)
  const [mode, setMode] = useState('hybrid')

  const handleFiles = useCallback((files) => {
    const newImages = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, 5 - images.length)
      .map((f) => ({ file: f, preview: URL.createObjectURL(f), name: f.name }))
    setImages((prev) => [...prev, ...newImages].slice(0, 5))
  }, [images.length])

  const removeImage = (index) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  // When images are added, auto-upgrade from questionnaire to hybrid
  const handleFilesWithModeUpgrade = useCallback((files) => {
    handleFiles(files)
    if (mode === 'questionnaire') setMode('hybrid')
  }, [handleFiles, mode])

  const handleNext = () => {
    const needsImage = mode === 'hybrid' || mode === 'ml'
    if (needsImage && images.length === 0) return

    const imageData = images.map((img) => ({ name: img.name, preview: img.preview }))
    sessionStorage.setItem('detect_images', JSON.stringify(imageData))
    sessionStorage.setItem('detect_mode', mode)
    window.__detectFiles = images.map((img) => img.file)
    navigate('/detect/questions')
  }

  const canProceed = mode === 'questionnaire' || images.length > 0

  const guidance = [
    { icon: Sun,      text: t('detect_guidance_1') },
    { icon: Focus,    text: t('detect_guidance_2') },
    { icon: EyeOff,   text: t('detect_guidance_3') },
    { icon: Maximize, text: t('detect_guidance_4') },
  ]

  const modeConfig = {
    hybrid:        { label: t('detect_mode_hybrid'),        desc: t('detect_mode_hybrid_desc'),        badge: '⭐', color: '#558b2f', bg: '#f7fbe7', border: '#a8d060' },
    ml:            { label: t('detect_mode_ml'),            desc: t('detect_mode_ml_desc'),            badge: '🤖', color: '#1565c0', bg: '#eff6ff', border: '#93c5fd' },
    questionnaire: { label: t('detect_mode_questionnaire'), desc: t('detect_mode_questionnaire_desc'), badge: '📋', color: '#7b3f00', bg: '#fffbeb', border: '#fcd34d' },
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-neutral-900 italic">
            {t('detect_step1_title')}
          </h1>
          <p className="mt-2 text-neutral-600 max-w-xl">{t('detect_step1_subtitle')}</p>
        </div>
        <div className="hidden sm:block text-right">
          <span className="text-sm font-medium text-primary-600">{t('step_label')} 1 {t('step_of')} 3</span>
          <div className="mt-1 flex gap-1">
            <div className="w-8 h-1.5 rounded-full bg-primary-500" />
            <div className="w-8 h-1.5 rounded-full bg-neutral-200" />
            <div className="w-8 h-1.5 rounded-full bg-neutral-200" />
          </div>
        </div>
      </div>

      {/* Mode selector */}
      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#9e9e9e' }}>
          {t('detect_mode_label')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {MODES.map((m) => {
            const cfg = modeConfig[m]
            const active = mode === m
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className="text-left p-3 rounded-xl transition-all cursor-pointer"
                style={{
                  backgroundColor: active ? cfg.bg : '#fff',
                  border: `2px solid ${active ? cfg.border : '#e0e0e0'}`,
                  boxShadow: active ? `0 0 0 1px ${cfg.border}` : 'none',
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cfg.badge}</span>
                  <span className="font-semibold text-sm" style={{ color: active ? cfg.color : '#424242' }}>
                    {cfg.label}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-snug" style={{ color: '#757575' }}>{cfg.desc}</p>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Upload area — 2 columns */}
        <div className="lg:col-span-2">

          {mode === 'questionnaire' ? (
            /* Questionnaire-only — soft message, no upload required */
            <div className="border-2 border-dashed rounded-xl p-10 text-center" style={{ borderColor: '#fcd34d', backgroundColor: '#fffbeb' }}>
              <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl" style={{ backgroundColor: '#fef3c7' }}>
                📋
              </div>
              <h3 className="mt-4 font-semibold text-neutral-900">{t('detect_mode_questionnaire')}</h3>
              <p className="mt-1 text-sm" style={{ color: '#92400e' }}>{t('detect_mode_questionnaire_desc')}</p>
              <p className="mt-3 text-xs" style={{ color: '#9e9e9e' }}>
                {t('detect_no_images_note')}
              </p>
            </div>
          ) : (
            /* Upload zone for hybrid / ml modes */
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFilesWithModeUpgrade(e.dataTransfer.files) }}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                dragOver ? 'border-primary-500 bg-primary-50' : 'border-neutral-300 bg-neutral-50'
              }`}
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-primary-100 flex items-center justify-center text-primary-500">
                <Upload size={28} />
              </div>
              <h3 className="mt-4 font-semibold text-neutral-900">{t('detect_upload_tap')}</h3>
              <p className="mt-1 text-sm text-neutral-500">{t('detect_upload_desc')}</p>

              <div className="mt-6 flex gap-3 justify-center">
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg cursor-pointer text-sm font-medium hover:bg-neutral-800 transition-colors">
                  <ImageIcon size={16} />
                  {t('detect_choose_files')}
                  <input type="file" accept="image/*" multiple onChange={(e) => handleFilesWithModeUpgrade(e.target.files)} className="hidden" />
                </label>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg cursor-pointer text-sm font-medium hover:bg-neutral-800 transition-colors">
                  <Camera size={16} />
                  {t('detect_use_camera')}
                  <input type="file" accept="image/*" capture="environment" onChange={(e) => handleFilesWithModeUpgrade(e.target.files)} className="hidden" />
                </label>
              </div>
            </div>
          )}

          {/* Uploaded previews */}
          {images.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-neutral-900">
                {t('detect_uploaded')} ({images.length}/5)
              </h3>
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-5 gap-3">
                {images.map((img, i) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden border border-neutral-200">
                    <img src={img.preview} alt={img.name} className="w-full h-28 object-cover" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none"
                    >
                      <X size={14} />
                    </button>
                    <p className="text-xs text-center text-neutral-600 py-1 truncate px-1">Image {i + 1}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Guidance panel */}
        <div className="space-y-6">
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-6">
            <h3 className="font-semibold text-primary-800 flex items-center gap-2">
              📸 {t('detect_guidance_title')}
            </h3>
            <div className="mt-4 space-y-4">
              {guidance.map((g) => (
                <div key={g.text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 shrink-0">
                    <g.icon size={16} />
                  </div>
                  <p className="text-sm font-medium text-neutral-900">{g.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl overflow-hidden border border-neutral-200">
            <div className="bg-neutral-100 h-36 flex items-center justify-center">
              <span className="text-sm text-neutral-500">📹 {t('detect_watch_demo')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="mt-8 flex items-center justify-between border-t border-neutral-200 pt-6">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-neutral-600 hover:text-neutral-800 bg-transparent border-none cursor-pointer"
        >
          {t('detect_cancel')}
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="px-6 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 border-none cursor-pointer transition-colors disabled:cursor-not-allowed"
          style={canProceed
            ? { backgroundColor: '#558b2f', color: '#fff' }
            : { backgroundColor: '#e0e0e0', color: '#9e9e9e' }}
        >
          {t('detect_next')} →
        </button>
      </div>
    </div>
  )
}
