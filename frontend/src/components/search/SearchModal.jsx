import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, ArrowRight } from 'lucide-react'
import { SEARCH_INDEX } from '../../data/searchData'

const TYPE_LABEL = {
  article:  { label: 'Article',  bg: '#f0fdf4', color: '#16a34a' },
  video:    { label: 'Video',    bg: '#f5f3ff', color: '#7c3aed' },
  expert:   { label: 'Expert',   bg: '#fffbeb', color: '#d97706' },
  supplier: { label: 'Supplier', bg: '#eff6ff', color: '#2563eb' },
  service:  { label: 'Service',  bg: '#f7fbe7', color: '#33691e' },
}

const GROUP_ORDER = ['service', 'article', 'video', 'expert', 'supplier']
const GROUP_LABELS = {
  service:  'Services',
  article:  'Articles',
  video:    'Videos',
  expert:   'Experts',
  supplier: 'Suppliers',
}

function filterIndex(query) {
  if (!query.trim()) return []
  const q = query.toLowerCase()
  return SEARCH_INDEX.filter((item) =>
    item.title.toLowerCase().includes(q) ||
    item.titleKm.toLowerCase().includes(q) ||
    item.desc.toLowerCase().includes(q) ||
    item.tags.some((t) => t.toLowerCase().includes(q))
  ).slice(0, 10)
}

function groupResults(results) {
  const grouped = {}
  for (const item of results) {
    if (!grouped[item.type]) grouped[item.type] = []
    grouped[item.type].push(item)
  }
  return GROUP_ORDER.filter((k) => grouped[k]).map((k) => ({ type: k, items: grouped[k] }))
}

export default function SearchModal({ open, onClose }) {
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  const results = filterIndex(query)
  const groups  = groupResults(results)
  const flat    = groups.flatMap((g) => g.items)

  // Reset & focus on open
  useEffect(() => {
    if (open) {
      setQuery('')
      setHighlighted(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted((h) => Math.min(h + 1, flat.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setHighlighted((h) => Math.max(h - 1, 0)) }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (flat[highlighted]) {
          navigate(flat[highlighted].link)
          onClose()
        } else if (query.trim()) {
          navigate(`/search?q=${encodeURIComponent(query.trim())}`)
          onClose()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, flat, highlighted, query, navigate, onClose])

  // Reset highlight when results change
  useEffect(() => { setHighlighted(0) }, [query])

  if (!open) return null

  const goTo = (link) => { navigate(link); onClose() }
  const goSearch = () => {
    if (query.trim()) { navigate(`/search?q=${encodeURIComponent(query.trim())}`); onClose() }
  }

  let flatIdx = 0

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh]"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-xl mx-4 rounded-2xl overflow-hidden"
        style={{ backgroundColor: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', border: '1px solid #e0e0e0' }}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-neutral-100">
          <Search size={18} style={{ color: '#9e9e9e', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search diseases, experts, guides…"
            className="flex-1 text-sm text-neutral-800 bg-transparent border-none outline-none"
            style={{ fontFamily: 'Roboto, sans-serif' }}
          />
          <div className="flex items-center gap-2">
            {query && (
              <button onClick={() => setQuery('')} className="p-1 rounded cursor-pointer bg-transparent border-none transition-colors hover:bg-neutral-100">
                <X size={14} style={{ color: '#9e9e9e' }} />
              </button>
            )}
            <kbd className="hidden sm:flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: '#f5f5f5', color: '#9e9e9e', border: '1px solid #e0e0e0', fontFamily: 'monospace' }}>
              ESC
            </kbd>
          </div>
        </div>

        {/* Results */}
        {query.trim() ? (
          results.length > 0 ? (
            <div className="py-2 max-h-[60vh] overflow-y-auto">
              {groups.map((group) => (
                <div key={group.type}>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#bdbdbd' }}>
                    {GROUP_LABELS[group.type]}
                  </p>
                  {group.items.map((item) => {
                    const idx = flatIdx++
                    const isHl = idx === highlighted
                    const badge = TYPE_LABEL[item.type]
                    return (
                      <button
                        key={item.id}
                        onMouseEnter={() => setHighlighted(idx)}
                        onClick={() => goTo(item.link)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left cursor-pointer border-none transition-colors"
                        style={{ backgroundColor: isHl ? '#f7fbe7' : 'transparent', fontFamily: 'Roboto, sans-serif' }}
                      >
                        <span className="text-xl w-7 text-center shrink-0">{item.img}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-800 truncate">{item.title}</p>
                          {item.desc && (
                            <p className="text-xs text-neutral-400 truncate mt-0.5">{item.desc}</p>
                          )}
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: badge.bg, color: badge.color }}>
                          {badge.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ))}

              {/* See all results footer */}
              <div className="border-t border-neutral-100 mt-2">
                <button
                  onClick={goSearch}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium cursor-pointer border-none transition-colors hover:bg-neutral-50"
                  style={{ color: '#558b2f', backgroundColor: 'transparent', fontFamily: 'Roboto, sans-serif' }}
                >
                  <span>See all results for "<strong>{query}</strong>"</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm text-neutral-400">No results for "<strong className="text-neutral-600">{query}</strong>"</p>
              <p className="text-xs text-neutral-300 mt-1">Try a disease name, expert, or topic</p>
            </div>
          )
        ) : (
          /* Empty state — quick links */
          <div className="py-3">
            <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#bdbdbd' }}>Quick Access</p>
            {[
              { title: 'Start Disease Detection', link: '/detect',  img: '🔬' },
              { title: 'Browse Experts',           link: '/experts', img: '👨‍🔬' },
              { title: 'Learning Hub',             link: '/learn',   img: '📚' },
            ].map((item) => (
              <button
                key={item.link}
                onClick={() => goTo(item.link)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left cursor-pointer border-none transition-colors hover:bg-neutral-50"
                style={{ backgroundColor: 'transparent', fontFamily: 'Roboto, sans-serif' }}
              >
                <span className="text-xl w-7 text-center">{item.img}</span>
                <span className="text-sm font-medium text-neutral-700">{item.title}</span>
                <ArrowRight size={13} className="ml-auto" style={{ color: '#bdbdbd' }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
