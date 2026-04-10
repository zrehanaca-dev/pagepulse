import { useState, useEffect } from 'react'
import { BookOpen, X, Loader } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { generateWhyNote } from '../lib/openai'

const LANES = [
  { id: 'curious',  label: '🔮 Curious'  },
  { id: 'reading',  label: '📖 Reading'  },
  { id: 'done',     label: '✅ Done'     },
  { id: 'loved',    label: '❤️ Loved'   },
]

export function BookModal({ book, onClose }) {
  const { addToStack, allStackBooks, toast, stack } = useApp()
  const [lane, setLane]       = useState('curious')
  const [aiWhy, setAiWhy]     = useState('')
  const [loadingAi, setLoadingAi] = useState(false)

  const existingEntry = allStackBooks.find((b) => b.book_id === book?.id)

  useEffect(() => {
    if (!book) return
    setLane(existingEntry?.lane || 'curious')
    setAiWhy(existingEntry?.ai_why || book.why || '')

    // Auto-generate AI note if we don't have one
    if (!existingEntry?.ai_why && !book.why && import.meta.env.VITE_OPENAI_API_KEY) {
      setLoadingAi(true)
      const readGenres = Object.values(stack)
        .flat()
        .flatMap((b) => b.genres || [])
      generateWhyNote(book, [], readGenres)
        .then((note) => setAiWhy(note))
        .catch(() => {})
        .finally(() => setLoadingAi(false))
    }
  }, [book?.id])

  if (!book) return null

  const handleAdd = async () => {
    const added = await addToStack(book, lane, aiWhy)
    if (added) toast(`"${book.title}" added to ${lane.charAt(0).toUpperCase() + lane.slice(1)} 📚`)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />

        <div style={{ padding: '20px', position: 'relative' }}>
          {/* Close */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 16, right: 16,
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--surface3)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: 'var(--muted)',
            }}
          >
            <X size={16} />
          </button>

          {/* Cover */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            {book.cover ? (
              <img
                src={book.cover}
                alt={book.title}
                style={{ width: 120, height: 180, objectFit: 'cover', borderRadius: 'var(--r-lg)', boxShadow: 'var(--sh-md)' }}
              />
            ) : (
              <div style={{ width: 120, height: 180, borderRadius: 'var(--r-lg)', background: 'var(--surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--faint)' }}>
                <BookOpen size={40} />
              </div>
            )}
          </div>

          {/* Title / Author */}
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontStyle: 'italic', textAlign: 'center', color: 'var(--text)', marginBottom: 4 }}>
            {book.title}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--muted)', textAlign: 'center', marginBottom: 14 }}>
            {book.author}
          </div>

          {/* Genre tags */}
          {book.genres?.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 14 }}>
              {book.genres.slice(0, 4).map((g) => (
                <span key={g} className="tag">{g}</span>
              ))}
            </div>
          )}

          {/* AI Why Note */}
          <div style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.6, fontStyle: 'italic', borderLeft: '2px solid var(--primary)', paddingLeft: 12, marginBottom: 14, minHeight: 48 }}>
            {loadingAi ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                Generating your personalised note…
              </span>
            ) : aiWhy || 'Add this to your stack to get an AI personalised note.'}
          </div>

          {/* Description */}
          {book.description && (
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.65, marginBottom: 20, maxHeight: 120, overflow: 'hidden', WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent)' }}>
              {book.description}
            </div>
          )}

          {/* Lane picker */}
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
            Add to Stack
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {LANES.map(({ id, label }) => (
              <button
                key={id}
                className={`lane-btn${lane === id ? ' selected' : ''}`}
                onClick={() => setLane(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <button className="btn btn-primary btn-block" onClick={handleAdd}>
            {existingEntry ? 'Move to Stack' : 'Add to My Stack'}
          </button>

          {existingEntry && (
            <div style={{ textAlign: 'center', marginTop: 10, fontSize: '0.78rem', color: 'var(--muted)' }}>
              Currently in: <strong>{existingEntry.lane}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
