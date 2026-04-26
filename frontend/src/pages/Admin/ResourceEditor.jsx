import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { ArrowLeft, Save, Upload } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { adminRequest } from '../../api/adminClient'
import { getCategories } from '../../api/client'
import { app as firebaseApp } from '../../firebase'

const storage = getStorage(firebaseApp)

const EMPTY = { en: '', km: '' }

export default function ResourceEditor() {
  const { id } = useParams()
  const isEdit  = Boolean(id)
  const navigate = useNavigate()
  const { getBackendToken } = useAuth()

  const [tab, setTab]                 = useState('en')
  const [status, setStatus]           = useState('DRAFT')
  const [type, setType]               = useState('ARTICLE')
  const [categoryId, setCategoryId]   = useState('')
  const [categories, setCategories]   = useState([])
  const [thumbnail, setThumbnail]     = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [titles, setTitles]           = useState(EMPTY)
  const [descs, setDescs]             = useState(EMPTY)
  const [saving, setSaving]           = useState(false)
  const [uploadingImg, setUploadingImg] = useState(false)
  const [error, setError]             = useState(null)

  const editorEn = useEditor({ extensions: [StarterKit, Image], content: '' })
  const editorKm = useEditor({ extensions: [StarterKit, Image], content: '' })

  useEffect(() => {
    getCategories().then(r => setCategories(r.data))
    if (isEdit) {
      adminRequest(getBackendToken, 'get', `/admin/resources/${id}`).then(r => {
        const res = r.data
        setStatus(res.status)
        setType(res.type)
        setCategoryId(res.category?.id ?? '')
        setThumbnail(res.thumbnail_url ?? '')
        setScheduledAt(res.scheduled_at ? res.scheduled_at.slice(0, 16) : '')
        const en = res.translations.find(t => t.language === 'EN') ?? {}
        const km = res.translations.find(t => t.language === 'KM') ?? {}
        setTitles({ en: en.title ?? '', km: km.title ?? '' })
        setDescs({ en: en.description ?? '', km: km.description ?? '' })
        editorEn?.commands.setContent(en.content ?? '')
        editorKm?.commands.setContent(km.content ?? '')
      })
    }
  }, [id, editorEn, editorKm])

  async function handleThumbnailUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImg(true)
    try {
      const storageRef = ref(storage, `resources/thumbnails/${Date.now()}_${file.name}`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      setThumbnail(url)
    } finally {
      setUploadingImg(false)
    }
  }

  async function handleSave() {
    if (!titles.en.trim()) { setError('English title is required'); return }
    setSaving(true)
    setError(null)
    try {
      const translations = [
        { language: 'EN', title: titles.en, description: descs.en, content: editorEn?.getHTML() ?? '' },
        ...(titles.km.trim() ? [{ language: 'KM', title: titles.km, description: descs.km, content: editorKm?.getHTML() ?? '' }] : []),
      ]
      const body = {
        type,
        status,
        category_id: categoryId || null,
        thumbnail_url: thumbnail || null,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        translations,
      }
      if (isEdit) {
        await adminRequest(getBackendToken, 'patch', `/admin/resources/${id}`, body)
      } else {
        await adminRequest(getBackendToken, 'post', '/admin/resources', body)
      }
      navigate('/admin/resources')
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const activeEditor = tab === 'en' ? editorEn : editorKm

  return (
    <div className="p-8 max-w-4xl">
      <button onClick={() => navigate('/admin/resources')} className="flex items-center gap-1.5 text-sm mb-6 bg-transparent border-none cursor-pointer hover:underline" style={{ color: '#757575' }}>
        <ArrowLeft size={15} /> Back to Resources
      </button>

      <h1 className="text-2xl font-bold mb-6">{isEdit ? 'Edit Resource' : 'New Resource'}</h1>

      {error && (
        <div className="mb-4 p-3 rounded-xl text-sm" style={{ backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fca5a5' }}>{error}</div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Left — metadata */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-neutral-600 block mb-1">Type</label>
            <select value={type} onChange={e => setType(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: '#e0e0e0' }}>
              <option value="ARTICLE">Article</option>
              <option value="VIDEO">Video</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-600 block mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: '#e0e0e0' }}>
              <option value="DRAFT">Draft</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>
          {status === 'SCHEDULED' && (
            <div>
              <label className="text-xs font-semibold text-neutral-600 block mb-1">Publish At</label>
              <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: '#e0e0e0' }} />
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-neutral-600 block mb-1">Category</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: '#e0e0e0' }}>
              <option value="">None</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-600 block mb-1">Thumbnail</label>
            {thumbnail && <img src={thumbnail} alt="thumbnail" className="w-full rounded-lg mb-2 object-cover" style={{ height: 80 }} />}
            <label className="flex items-center gap-2 cursor-pointer text-sm px-3 py-2 rounded-lg border" style={{ borderColor: '#e0e0e0', color: '#558b2f' }}>
              <Upload size={14} />
              {uploadingImg ? 'Uploading…' : 'Upload image'}
              <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} disabled={uploadingImg} />
            </label>
          </div>
        </div>

        {/* Right — content */}
        <div className="col-span-2 space-y-4">
          {/* Language tabs */}
          <div className="flex gap-2">
            {['en', 'km'].map(lang => (
              <button key={lang} onClick={() => setTab(lang)}
                className="px-4 py-1.5 rounded-full text-sm font-medium border-none cursor-pointer transition-colors"
                style={tab === lang ? { backgroundColor: '#558b2f', color: '#fff' } : { backgroundColor: '#f0f0f0', color: '#424242' }}>
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-600 block mb-1">Title ({tab.toUpperCase()}) *</label>
            <input value={titles[tab]} onChange={e => setTitles(p => ({ ...p, [tab]: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: '#e0e0e0' }} placeholder="Article title" />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-600 block mb-1">Short description ({tab.toUpperCase()})</label>
            <textarea rows={2} value={descs[tab]} onChange={e => setDescs(p => ({ ...p, [tab]: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm resize-none" style={{ borderColor: '#e0e0e0' }} placeholder="Brief summary shown in card view" />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-600 block mb-1">Content ({tab.toUpperCase()})</label>
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#e0e0e0', minHeight: 300 }}>
              <div className="px-2 py-1.5 flex gap-1 flex-wrap" style={{ borderBottom: '1px solid #e0e0e0', backgroundColor: '#fafafa' }}>
                {[
                  ['Bold', () => activeEditor?.chain().focus().toggleBold().run()],
                  ['Italic', () => activeEditor?.chain().focus().toggleItalic().run()],
                  ['H2', () => activeEditor?.chain().focus().toggleHeading({ level: 2 }).run()],
                  ['H3', () => activeEditor?.chain().focus().toggleHeading({ level: 3 }).run()],
                  ['List', () => activeEditor?.chain().focus().toggleBulletList().run()],
                  ['Quote', () => activeEditor?.chain().focus().toggleBlockquote().run()],
                ].map(([label, action]) => (
                  <button key={label} onClick={action} type="button"
                    className="px-2 py-0.5 rounded text-xs border-none cursor-pointer" style={{ backgroundColor: '#e0e0e0', color: '#424242' }}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="p-3 prose prose-sm max-w-none" style={{ minHeight: 260 }}>
                {tab === 'en' ? <EditorContent editor={editorEn} /> : <EditorContent editor={editorKm} />}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white border-none cursor-pointer disabled:opacity-60"
          style={{ backgroundColor: '#558b2f' }}>
          <Save size={15} />
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}
