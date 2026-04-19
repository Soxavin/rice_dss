import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Upload, Camera, X, Image as ImageIcon, Sun, Focus, EyeOff, Maximize, SwitchCamera, Layers2, Cpu, ClipboardList, Zap, ListChecks, Sprout, Eye, Cloud, Droplets, LayoutGrid, Timer, Leaf, Clock, History, Layers } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import DetectionProgress from '../../components/detection/DetectionProgress'

// Analysis modes
const MODES = ['hybrid', 'ml', 'questionnaire']

export default function Step1Upload() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const [images, setImages] = useState([])
  const [dragOver, setDragOver] = useState(false)
  const [mode, setMode] = useState(() => {
    const stateMode = location.state?.mode
    return stateMode && MODES.includes(stateMode) ? stateMode : 'hybrid'
  })
  const [isNavigating, setIsNavigating] = useState(false)
  const [questionnaireDepth, setQuestionnaireDepth] = useState('quick')

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

  // Stop camera stream on component unmount (e.g. user navigates away while camera is open)
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(tr => tr.stop())
        streamRef.current = null
      }
    }
  }, [])

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
    if (mode === 'questionnaire') {
      sessionStorage.setItem('questionnaire_depth', questionnaireDepth)
    } else {
      sessionStorage.removeItem('questionnaire_depth')
    }
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

  const ALL_CONDITIONS = ['blast', 'brown_spot', 'bacterial_blight', 'iron_toxicity', 'n_deficiency', 'salt_toxicity']

  const modeConfig = {
    hybrid:        { label: t('detect_mode_hybrid'),        desc: t('detect_mode_hybrid_desc'),        tag: t('mode_tag_recommended'), icon: Layers2,       iconBg: '#d4edaa', color: '#558b2f', bg: '#f7fbe7', border: '#a8d060', full: ALL_CONDITIONS,                                          note: { key: 'detect_mode_note_hybrid',        bg: '#f0f7e6', color: '#33691e', border: '#c5dc8a', icon: '✓' } },
    ml:            { label: t('detect_mode_ml'),            desc: t('detect_mode_ml_desc'),            tag: t('mode_tag_fastest'),      icon: Cpu,           iconBg: '#dbeafe', color: '#1565c0', bg: '#eff6ff', border: '#93c5fd', full: ['blast','brown_spot','bacterial_blight'],                note: { key: 'detect_mode_note_ml',            bg: '#fef3c7', color: '#92400e', border: '#fde68a', icon: '⚠' } },
    questionnaire: { label: t('detect_mode_questionnaire'), desc: t('detect_mode_questionnaire_desc'), tag: t('mode_tag_no_camera'),    icon: ClipboardList, iconBg: '#fef3c7', color: '#7b3f00', bg: '#fffbeb', border: '#fcd34d', full: ALL_CONDITIONS,                                          note: { key: 'detect_mode_note_questionnaire', bg: '#eff6ff', color: '#1565c0', border: '#bfdbfe', icon: 'ℹ' } },
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Step progress */}
      <DetectionProgress step={1} />

      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-neutral-900 italic">
          {mode === 'questionnaire' ? t('detect_step1_title_q') : t('detect_step1_title')}
        </h1>
        <p className="mt-2 text-neutral-600 max-w-xl">
          {mode === 'questionnaire' ? t('detect_step1_subtitle_q') : t('detect_step1_subtitle')}
        </p>
      </div>

      {/* Mode selector */}
      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#9e9e9e' }}>
          {t('detect_mode_label')}
        </p>
        <div className="sm:grid sm:grid-cols-3 sm:gap-3 flex overflow-x-auto gap-3 pb-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {MODES.map((m) => {
            const cfg = modeConfig[m]
            const active = mode === m
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className="text-left p-4 rounded-xl transition-all cursor-pointer flex flex-col shrink-0 snap-start w-[85vw] sm:w-auto sm:shrink"
                style={{
                  backgroundColor: active ? cfg.bg : '#fff',
                  border: `2px solid ${active ? cfg.border : '#e0e0e0'}`,
                  boxShadow: active ? `0 4px 12px rgba(0,0,0,0.08)` : 'none',
                }}
              >
                {/* Header */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: active ? cfg.iconBg : '#f5f5f5' }}>
                    <cfg.icon size={16} style={{ color: active ? cfg.color : '#9e9e9e' }} />
                  </div>
                  <span className="font-semibold text-sm" style={{ color: active ? cfg.color : '#424242' }}>
                    {cfg.label}
                  </span>
                </div>

                {/* Description */}
                <p className="mt-1.5 text-xs leading-snug" style={{ color: '#757575' }}>{cfg.desc}</p>

                {/* Tag pill */}
                <span
                  className="mt-2 inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: active ? cfg.border : '#f0f0f0', color: active ? cfg.color : '#9e9e9e' }}
                >
                  {cfg.tag}
                </span>

                {/* Coverage grid */}
                <div className="mt-3 pt-2.5" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: '#9e9e9e' }}>
                    {t('detect_mode_coverage_label')}
                  </p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                    {ALL_CONDITIONS.map(key => {
                      const detected = cfg.full.includes(key)
                      return (
                        <div key={key} className="flex items-center gap-1" style={{ color: detected ? '#33691e' : '#bdbdbd' }}>
                          <span className="shrink-0 text-[11px] font-bold">{detected ? '✓' : '✕'}</span>
                          <span className="text-[10px] leading-tight">{t(`cond_name_${key}`)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Footer note — mt-auto anchors to card bottom for equal height */}
                <div className="mt-auto pt-3">
                  <div className="flex items-start gap-1.5 rounded-lg px-2.5 py-2"
                    style={{ backgroundColor: cfg.note.bg, border: `1px solid ${cfg.note.border}` }}>
                    <span className="shrink-0 text-[11px]">{cfg.note.icon}</span>
                    <p className="text-[10px] leading-snug" style={{ color: cfg.note.color }}>
                      {t(cfg.note.key)}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

      </div>

      <div className={`mt-6 grid grid-cols-1 ${mode !== 'questionnaire' ? 'lg:grid-cols-3' : ''} gap-8`}>

        {/* Upload area — 2 columns (full-width for questionnaire) */}
        <div className={mode !== 'questionnaire' ? 'lg:col-span-2' : ''}>

          {mode === 'questionnaire' ? (
            /* Questionnaire config card */
            <div className="rounded-2xl p-6 bg-white" style={{ border: '1px solid #e0e0e0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              {/* Depth selector */}
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#9e9e9e' }}>
                {t('q_depth_toggle_label')}
              </p>
              <div role="group" aria-label={t('q_depth_toggle_label')} className="grid grid-cols-2 gap-3">
                {[
                  { id: 'quick',    labelKey: 'q_quick_label',    descKey: 'q_quick_desc',    Icon: Zap },
                  { id: 'detailed', labelKey: 'q_detailed_label', descKey: 'q_detailed_desc', Icon: ListChecks },
                ].map(({ id, labelKey, descKey, Icon }) => {
                  const active = questionnaireDepth === id
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setQuestionnaireDepth(id)}
                      aria-pressed={active}
                      className="text-left cursor-pointer transition-all"
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: active ? '2px solid #fcd34d' : '2px solid #e0e0e0',
                        backgroundColor: active ? '#fffbeb' : '#fafafa',
                      }}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: active ? '#fef3c7' : '#f0f0f0' }}>
                        <Icon size={16} style={{ color: active ? '#92400e' : '#9e9e9e' }} />
                      </div>
                      <div className="font-bold text-sm mt-2" style={{ color: active ? '#7b3f00' : '#424242' }}>
                        {t(labelKey)}
                      </div>
                      <div className="text-xs mt-1" style={{ color: '#757575' }}>{t(descKey)}</div>
                    </button>
                  )
                })}
              </div>

              {/* Topics preview */}
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#9e9e9e' }}>
                  {t('detect_q_topics_label')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { Icon: Sprout,     key: 'q_cat_growth',    depth: 'both' },
                    { Icon: Eye,        key: 'q_cat_symptoms',  depth: 'both' },
                    { Icon: Cloud,      key: 'q_cat_weather',   depth: 'both' },
                    { Icon: Droplets,   key: 'q_cat_water',     depth: 'both' },
                    { Icon: LayoutGrid, key: 'q_cat_spread',    depth: 'both' },
                    { Icon: Timer,      key: 'q_cat_onset',     depth: 'both' },
                    { Icon: Leaf,       key: 'q_cat_fertilizer',depth: 'both' },
                    { Icon: Clock,      key: 'q_cat_timing',    depth: 'detailed' },
                    { Icon: History,    key: 'q_cat_history',   depth: 'detailed' },
                    { Icon: Layers,     key: 'q_cat_soil',      depth: 'detailed' },
                  ].filter(c => c.depth === 'both' || questionnaireDepth === 'detailed')
                   .map(({ Icon, key, depth }) => (
                    <span key={key} className="inline-flex items-center gap-1.5 text-xs font-medium"
                      style={{
                        backgroundColor: depth === 'detailed' ? '#fef3c7' : '#f5f5f5',
                        color: depth === 'detailed' ? '#92400e' : '#616161',
                        borderRadius: '999px',
                        padding: '4px 10px',
                      }}>
                      <Icon size={12} />
                      {t(key)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Upgrade tip */}
              <div className="mt-4 flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm"
                style={{ backgroundColor: '#f7fbe7', border: '1px solid #c5dc8a' }}>
                <Camera size={15} style={{ color: '#558b2f' }} className="shrink-0" />
                <p style={{ color: '#33691e' }}>{t('detect_q_upgrade_tip')}</p>
              </div>
            </div>
          ) : (
            /* Upload zone for hybrid / ml modes */
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFilesWithModeUpgrade(e.dataTransfer.files) }}
              className="border-2 border-dashed rounded-xl transition-colors"
              style={{
                borderColor: dragOver ? '#558b2f' : '#a8d060',
                backgroundColor: dragOver ? '#eef5d3' : '#f7fbe7',
              }}
            >
              {/* Drop prompt */}
              <div className="p-10 text-center">
                <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: '#d4edaa' }}>
                  <Upload size={32} style={{ color: '#558b2f' }} />
                </div>
                <h3 className="mt-4 font-semibold text-neutral-900">{t('detect_upload_tap')}</h3>
                <p className="mt-1 text-sm text-neutral-500">{t('detect_upload_desc')}</p>

                <div className="mt-6 flex gap-3 justify-center">
                  <label
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer text-sm font-medium transition-opacity hover:opacity-90"
                    style={{ backgroundColor: '#558b2f', color: '#fff' }}
                  >
                    <ImageIcon size={16} />
                    {t('detect_choose_files')}
                    <input type="file" accept="image/*" multiple onChange={(e) => handleFilesWithModeUpgrade(e.target.files)} className="hidden" />
                  </label>
                  <button
                    type="button"
                    onClick={openCamera}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer text-sm font-medium transition-colors border-none"
                    style={{ backgroundColor: '#fff', color: '#558b2f', border: '1.5px solid #558b2f' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f7fbe7'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                  >
                    <Camera size={16} />
                    {t('detect_use_camera')}
                  </button>
                </div>
              </div>

              {/* Uploaded previews — inside the zone */}
              {images.length > 0 && (
                <div className="px-6 pb-6 pt-5" style={{ borderTop: '1.5px dashed #a8d060' }}>
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

        {/* Guidance panel — only for hybrid / ml */}
        {mode !== 'questionnaire' && <div className="space-y-6">
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

        </div>}
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
