import { useState } from 'react'
import { BookOpen, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { BookModal } from '../components/BookModal'
import { searchBooks } from '../lib/googleBooks'

const TABS = [
  { id: 'curious', label: '🔮 Curious',  badge: 'badge-curious' },
  { id: 'reading', label: '📖 Reading',  badge: 'badge-reading' },
  { id: 'done',    label: '✅ Done',     badge: 'badge-done'    },
  { id: 'loved',   label: '❤️ Loved',   badge: 'badge-loved'   },
]

const EMPTY_MSGS = {
  curious: { emoji: '🔮', hint: 'Discover books and swipe right to add them here.' },
  reading: { emoji: '📖', hint: 'Move a book here when you start reading it.'      },
  done:    { emoji: '✅', hint: 'Mark a book as Done when you finish it.'           },
  loved:   { emoji: '❤️', hint: 'Books that stayed with you live here.'            },
}

export function Stack() {
  const { stack, moveLane, removeFromStack, toast } = useApp()
  const [activeTab, setActiveTab] = useState('curious')
  const [selectedBook, setSelectedBook] = useState(null)
  const [fullBook, setFullBook] = useState(null) // fetched from Google Books

  const books = stack[activeTab] || []

  const openDetail = async (entry) => {
    // Build a book-shaped object from the stack entry
    const book = {
      id:          entry.book_id,
      title:       entry.title,
      author:      entry.author,
      cover:       entry.cover,
      genres:      entry.genres || [],
      description: entry.description || '',
      why:         entry.ai_why || '',
    }
    setSelectedBook(book)
  }

  const handleRemove = async (e, bookId, title) => {
    e.stopPropagation()
    await removeFromStack(bookId)
    toast(`"${title}" removed from your stack`)
  }

  const handleMoveLane = async (bookId, newLane) => {
    await moveLane(bookId, newLane)
    toast(`Moved to ${newLane.charAt(0).toUpperCase() + newLane.slice(1)} 📚`)
  }

  return (
    <div style={{ paddingBottom: 20 }}>
      {/* Tabs */}
      <div className="no-scroll" style={{ display: 'flex', gap: 0, padding: '12px 20px 12px', overflowX: 'auto' }}>
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            className={`stack-tab${activeTab === id ? ' active' : ''}`}
            style={{ flexShrink: 0, padding: '8px 16px', borderRadius: 'var(--r-full)', fontSize: '0.8rem', fontWeight: 600, color: activeTab === id ? '#fff' : 'var(--muted)', background: activeTab === id ? 'var(--primary)' : 'transparent', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all var(--tr)', boxShadow: activeTab === id ? '0 2px 8px rgba(199,92,42,0.3)' : 'none' }}
            onClick={() => setActiveTab(id)}
          >
            {label}
            {stack[id]?.length > 0 && (
              <span style={{ marginLeft: 6, background: activeTab === id ? 'rgba(255,255,255,0.3)' : 'var(--surface3)', borderRadius: 'var(--r-full)', fontSize: '0.65rem', padding: '1px 6px', fontWeight: 700 }}>
                {stack[id].length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {books.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={40} />
          <h3>{EMPTY_MSGS[activeTab].emoji} Nothing here yet</h3>
          <p>{EMPTY_MSGS[activeTab].hint}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', padding: '0 20px' }}>
          {books.map((entry) => (
            <div
              key={entry.book_id}
              style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--divider)', cursor: 'pointer', alignItems: 'flex-start' }}
              onClick={() => openDetail(entry)}
            >
              {/* Cover thumbnail */}
              {entry.cover ? (
                <img src={entry.cover} alt={entry.title} style={{ width: 52, height: 78, borderRadius: 'var(--r-sm)', objectFit: 'cover', flexShrink: 0, boxShadow: 'var(--sh-sm)' }} />
              ) : (
                <div style={{ width: 52, height: 78, borderRadius: 'var(--r-sm)', flexShrink: 0, background: 'var(--surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--faint)', border: '1px solid var(--border)' }}>
                  <BookOpen size={18} />
                </div>
              )}

              {/* Meta */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)', lineHeight: 1.3, marginBottom: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {entry.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 5 }}>{entry.author}</div>
                <span className={`badge-${activeTab}`}>
                  {TABS.find((t) => t.id === activeTab)?.label}
                </span>
                {entry.ai_why && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 5, fontStyle: 'italic', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {entry.ai_why}
                  </div>
                )}

                {/* Move lane buttons */}
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {TABS.filter((t) => t.id !== activeTab).map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={(e) => { e.stopPropagation(); handleMoveLane(entry.book_id, id) }}
                      style={{ fontSize: '0.68rem', padding: '3px 8px', borderRadius: 'var(--r-full)', border: '1px solid var(--border)', color: 'var(--muted)', background: 'var(--surface)', transition: 'all var(--tr)' }}
                    >
                      → {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Remove */}
              <button
                onClick={(e) => handleRemove(e, entry.book_id, entry.title)}
                style={{ color: 'var(--faint)', flexShrink: 0, padding: 4, transition: 'color var(--tr)' }}
                onMouseOver={(e) => e.currentTarget.style.color = '#e05555'}
                onMouseOut={(e) => e.currentTarget.style.color = 'var(--faint)'}
                aria-label="Remove"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedBook && <BookModal book={selectedBook} onClose={() => setSelectedBook(null)} />}
    </div>
  )
}
