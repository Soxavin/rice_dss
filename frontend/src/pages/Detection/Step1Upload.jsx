import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Camera, X, Image as ImageIcon, Sun, Focus, EyeOff, Maximize, SwitchCamera } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

// Analysis modes
const MODES = ['hybrid', 'ml', 'questionnaire']

export default function Step1Upload() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [images, setImages] = useState([])
  const [dragOver, setDragOver] = useState(false)
  const [mode, setMode] = useState('hybrid')
  const [isNavigating, setIsNavigating] = useState(false)

  // Camera modal state
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const [cameraFacing, setCameraFacing] = useState('environment')
  const [cameraReady, setCameraReady] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const canvasRef = useRef(null)

  const handleFiles = useCallback((files) => {
    const MAX_SIZE = 10 * 1024 * 1024 // W6: 10 MB limit
    const newImages = Array.from(files)
      .filter((f) => f.type.startsWith('image/') && f.size <= MAX_SIZE)
      .slice(0, 5 - images.length)
      .map((f) => ({ file: f, preview: URL.createObjectURL(f), name: f.name }))
    const oversized = Array.from(files).filter(f => f.type.startsWith('image/') && f.size > MAX_SIZE)
    if (oversized.length > 0) {
      // Surface oversized file warning via alert (simple, no extra state)
      alert(`${oversized.map(f => f.name).join(', ')}: file too large (max 10 MB)`)
    }
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

  // ── Camera helpers ──────────────────────────────────────────────────────────
  const startStream = useCallback(async (facing) => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(tr => tr.stop())
      streamRef.current = null
    }
    setCameraReady(false)
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      setCameraError(
        err.name === 'NotAllowedError'
          ? t('camera_error_permission')
          : t('camera_error_generic')
      )
    }
  }, [t])

  const openCamera = useCallback(() => {
    setCameraOpen(true)
    setCameraError(null)
    setCameraReady(false)
    startStream(cameraFacing)
  }, [cameraFacing, startStream])

  const closeCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(tr => tr.stop())
      streamRef.current = null
    }
    setCameraOpen(false)
    setCameraError(null)
    setCameraReady(false)
  }, [])

  const flipCamera = useCallback(() => {
    const next = cameraFacing === 'environment' ? 'user' : 'environment'
    setCameraFacing(next)
    startStream(next)
  }, [cameraFacing, startStream])

  const capturePhoto = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      if (!blob) return
      const fileName = `camera-${Date.now()}.jpg`
      const file = new File([blob], fileName, { type: 'image/jpeg' })
      const preview = URL.createObjectURL(blob)
      setImages(prev => [...prev, { file, preview, name: fileName }].slice(0, 5))
      if (mode === 'questionnaire') setMode('hybrid')
      closeCamera()
    }, 'image/jpeg', 0.92)
  }, [mode, closeCamera])

  // Escape key closes camera
  useEffect(() => {
    if (!cameraOpen) return
    const onKey = (e) => { if (e.key === 'Escape') closeCamera() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [cameraOpen, closeCamera])

  // When images are added, auto-upgrade from questionnaire to hybrid
  const handleFilesWithModeUpgrade = useCallback((files) => {
    handleFiles(files)
    if (mode === 'questionnaire') setMode('hybrid')
  }, [handleFiles, mode])

  const handleNext = () => {
    const needsImage = mode === 'hybrid' || mode === 'ml'
    if (needsImage && images.length === 0) return
    if (isNavigating) return

    setIsNavigating(true)
    const imageData = images.map((img) => ({ name: img.name, preview: img.preview }))
    sessionStorage.setItem('detect_images', JSON.stringify(imageData))
    sessionStorage.setItem('detect_mode', mode)
    window.__detectFiles = images.map((img) => img.file)
    setTimeout(() => navigate('/detect/questions'), 120)
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
              <button
                onClick={handleNext}
                disabled={isNavigating}
                className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm border-none cursor-pointer transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#7b3f00', color: '#fff' }}
              >
                {isNavigating ? (
                  <>
                    <span className="inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    {t('detect_next')}…
                  </>
                ) : (
                  <>{t('detect_continue_questionnaire')} →</>
                )}
              </button>
            </div>
          ) : (
            /* Upload zone for hybrid / ml modes */
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFilesWithModeUpgrade(e.dataTransfer.files) }}
              className={`border-2 border-dashed rounded-xl transition-colors ${
                dragOver ? 'border-primary-500 bg-primary-50' : 'border-neutral-300 bg-neutral-50'
              }`}
            >
              {/* Drop prompt */}
              <div className="p-10 text-center">
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
                  <button
                    type="button"
                    onClick={openCamera}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg cursor-pointer text-sm font-medium hover:bg-neutral-800 transition-colors border-none"
                  >
                    <Camera size={16} />
                    {t('detect_use_camera')}
                  </button>
                </div>
              </div>

              {/* Uploaded previews — inside the zone */}
              {images.length > 0 && (
                <div className="px-6 pb-6 border-t border-dashed border-neutral-300 pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm text-neutral-900">
                      {t('detect_uploaded')} ({images.length}/5)
                    </h3>
                    {images.length < 5 && (
                      <label className="inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer text-primary-700 hover:text-primary-800">
                        <ImageIcon size={13} />
                        {t('detect_add_more')}
                        <input type="file" accept="image/*" multiple onChange={(e) => handleFilesWithModeUpgrade(e.target.files)} className="hidden" />
                      </label>
                    )}
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {images.map((img, i) => (
                      <div key={i} className="relative group rounded-lg overflow-hidden" style={{ border: '1.5px solid #d4e6a5' }}>
                        <img src={img.preview} alt={img.name} className="w-full h-24 object-cover" />
                        <button
                          onClick={() => removeImage(i)}
                          aria-label={`${t('detect_image_label')} ${i + 1} ${t('detect_remove')}`}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none"
                        >
                          <X size={12} />
                        </button>
                        <p className="text-xs text-center text-neutral-600 py-1 truncate px-1">{t('detect_image_label')} {i + 1}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Rice-leaf only reminder */}
          {(mode === 'hybrid' || mode === 'ml') && (
            <div
              className="mt-4 flex items-start gap-2 px-4 py-3 rounded-lg text-sm"
              style={{ backgroundColor: '#fffbeb', border: '1px solid #fde047' }}
            >
              <span className="shrink-0">⚠️</span>
              <p style={{ color: '#92400e' }}>{t('detect_rice_leaf_warning')}</p>
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

      {/* Camera modal */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {/* Header bar */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}>
            <span className="text-white font-semibold text-sm">{t('camera_title')}</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={flipCamera}
                aria-label={t('camera_flip')}
                className="text-white bg-transparent border-none cursor-pointer p-1 opacity-80 hover:opacity-100"
              >
                <SwitchCamera size={20} />
              </button>
              <button type="button" onClick={closeCamera} aria-label={t('camera_close')} className="text-white bg-transparent border-none cursor-pointer p-1">
                <X size={22} />
              </button>
            </div>
          </div>

          {cameraError ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
              <Camera size={48} style={{ color: 'rgba(255,255,255,0.3)' }} />
              <p className="text-white text-sm leading-relaxed max-w-xs">{cameraError}</p>
              <button
                type="button"
                onClick={closeCamera}
                className="px-5 py-2.5 rounded-lg bg-white text-neutral-900 font-semibold text-sm border-none cursor-pointer"
              >
                {t('camera_close')}
              </button>
            </div>
          ) : (
            <>
              {/* Video preview */}
              <div className="flex-1 relative overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  onCanPlay={() => setCameraReady(true)}
                  className="w-full h-full object-cover"
                  style={{ transform: cameraFacing === 'user' ? 'scaleX(-1)' : 'none' }}
                />
                {!cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="inline-block w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  </div>
                )}
              </div>

              {/* Capture bar */}
              <div className="shrink-0 flex items-center justify-center py-8" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}>
                <button
                  type="button"
                  onClick={capturePhoto}
                  disabled={!cameraReady}
                  className="w-16 h-16 rounded-full bg-white flex items-center justify-center border-none cursor-pointer disabled:opacity-40"
                  style={{ boxShadow: '0 0 0 4px rgba(255,255,255,0.3)', transition: 'opacity 0.2s' }}
                >
                  <Camera size={26} style={{ color: '#222' }} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />

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
          disabled={!canProceed || isNavigating}
          className="px-6 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 border-none cursor-pointer transition-colors disabled:cursor-not-allowed"
          style={canProceed && !isNavigating
            ? { backgroundColor: '#558b2f', color: '#fff' }
            : { backgroundColor: '#e0e0e0', color: '#9e9e9e' }}
        >
          {isNavigating ? (
            <>
              <span className="inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              {t('detect_next')}…
            </>
          ) : (
            <>{t('detect_next')} →</>
          )}
        </button>
      </div>
    </div>
  )
}
