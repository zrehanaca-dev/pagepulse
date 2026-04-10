import { useState, useEffect, useCallback } from 'react'
import { Loader } from 'lucide-react'
import { BookCard } from '../components/BookCard'
import { BookModal } from '../components/BookModal'
import { useApp } from '../context/AppContext'
import { getBooksByMood, getTrendingBooks, searchBooks } from '../lib/googleBooks'
import { generateTarotPick } from '../lib/openai'

const MOODS = [
  { id: 'mysterious', emoji: '🌒', label: 'Mysterious' },
  { id: 'reflective', emoji: '🌿', label: 'Reflective' },
  { id: 'thrilling',  emoji: '⚡', label: 'Thrilling'  },
  { id: 'romantic',   emoji: '🌹', label: 'Romantic'   },
  { id: 'dark',       emoji: '🖤', label: 'Dark'        },
  { id: 'hopeful',    emoji: '☀️', label: 'Hopeful'    },
  { id: 'funny',      emoji: '😂', label: 'Funny'       },
]

export function Discover({ searchQuery, onClearSearch }) {
  const { addToStack, allStackBooks, toast } = useApp()

  const [mood, setMood]             = useState('mysterious')
  const [recommended, setRecommended] = useState([])
  const [trending, setTrending]     = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [loadingRec, setLoadingRec] = useState(false)
  const [loadingTrend, setLoadingTrend] = useState(false)
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [selectedBook, setSelectedBook] = useState(null)
  const [tarot, setTarot]           = useState(null)
  const [loadingTarot, setLoadingTarot] = useState(false)

  // ── Mood-based recommendations ────────────────────────────────────
  const loadRecommended = useCallback(async (selectedMood) => {
    setLoadingRec(true)
    try {
      const books = await getBooksByMood(selectedMood, 10)
      setRecommended(books)
    } catch { /* silently fail */ }
    finally { setLoadingRec(false) }
  }, [])

  // ── Trending ──────────────────────────────────────────────────────
  useEffect(() => {
    setLoadingTrend(true)
    getTrendingBooks(8)
      .then(setTrending)
      .catch(() => {})
      .finally(() => setLoadingTrend(false))
  }, [])

  // ── AI Book Tarot ─────────────────────────────────────────────────
  useEffect(() => {
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      setTarot({ title: 'The Midnight Library', author: 'Matt Haig', reason: 'Between every life you could have lived, one book is waiting for you today.' })
      return
    }
    setLoadingTarot(true)
    const recentTitles = allStackBooks.map((b) => b.title)
    generateTarotPick(mood, recentTitles)
      .then(setTarot)
      .catch(() => {})
      .finally(() => setLoadingTarot(false))
  }, [mood])

  useEffect(() => { loadRecommended(mood) }, [mood])

  // ── Search ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery) { setSearchResults([]); return }
    setLoadingSearch(true)
    searchBooks(searchQuery, 12)
      .then(setSearchResults)
      .catch(() => {})
      .finally(() => setLoadingSearch(false))
  }, [searchQuery])

  const handleMood = (id) => {
    setMood(id)
  }

  const handleTarotAdd = async () => {
    if (!tarot) return
    // Search for the tarot book to get proper metadata
    try {
      const results = await searchBooks(`${tarot.title} ${tarot.author}`, 1)
      if (results[0]) {
        const added = await addToStack(results[0], 'curious', tarot.reason)
        if (added) toast(`"${tarot.title}" added to Curious 🔮`)
      } else {
        toast(`Search for "${tarot.title}" to add it manually`)
      }
    } catch {
      toast(`Search for "${tarot.title}" to add it to your stack`)
    }
  }

  // ── Render search results ─────────────────────────────────────────
  if (searchQuery) {
    return (
      <div style={{ padding: '16px 0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', marginBottom: 16 }}>
          <div style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>
            {loadingSearch ? 'Searching…' : `${searchResults.length} results for "${searchQuery}"`}
          </div>
          <button style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }} onClick={onClearSearch}>
            Clear
          </button>
        </div>

        {loadingSearch ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Loader size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px 12px', padding: '0 20px' }}>
            {searchResults.map((book) => (
              <BookCard key={book.id} book={book} onClick={() => setSelectedBook(book)} />
            ))}
          </div>
        )}

        {selectedBook && <BookModal book={selectedBook} onClose={() => setSelectedBook(null)} />}
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: 20 }}>
      {/* Hero */}
      <div style={{ padding: '28px 20px 0' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,6vw,2.4rem)', lineHeight: 1.15, color: 'var(--text)', fontStyle: 'italic' }}>
          What should you read <em style={{ color: 'var(--primary)' }}>today?</em>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: 6, maxWidth: '38ch' }}>
          Pick your mood and let the AI find your next obsession.
        </p>
      </div>

      {/* Mood strip */}
      <div className="no-scroll" style={{ display: 'flex', gap: 8, padding: '16px 20px', overflowX: 'auto' }}>
        {MOODS.map(({ id, emoji, label }) => (
          <button
            key={id}
            className={`mood-chip${mood === id ? ' active' : ''}`}
            onClick={() => handleMood(id)}
          >
            {emoji} {label}
          </button>
        ))}
      </div>

      {/* AI Book Tarot */}
      <div className="tarot-section">
        <div className="tarot-tag">✦ Book Tarot — Today's Pick</div>
        {loadingTarot ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 60 }}>
            <Loader size={16} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>The oracle is choosing your book…</span>
          </div>
        ) : tarot ? (
          <>
            <div className="tarot-title">{tarot.title}</div>
            <div className="tarot-author">{tarot.author}</div>
            <div className="tarot-reason">{tarot.reason}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button className="btn btn-primary btn-sm" onClick={handleTarotAdd}>+ Add to Stack</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setMood(mood)}>New Pick ↻</button>
            </div>
          </>
        ) : null}
      </div>

      {/* Recommended */}
      <div className="section-label">Recommended for you</div>
      {loadingRec ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
          <Loader size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
        </div>
      ) : (
        <div className="book-row no-scroll" style={{ display: 'flex', gap: 14, padding: '0 20px 8px', overflowX: 'auto' }}>
          {recommended.map((book) => (
            <BookCard key={book.id} book={book} onClick={() => setSelectedBook(book)} />
          ))}
        </div>
      )}

      {/* Trending */}
      <div className="section-label" style={{ marginTop: 12 }}>Trending this week</div>
      {loadingTrend ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
          <Loader size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
        </div>
      ) : (
        <div className="book-row no-scroll" style={{ display: 'flex', gap: 14, padding: '0 20px 8px', overflowX: 'auto' }}>
          {trending.map((book) => (
            <BookCard key={book.id} book={book} onClick={() => setSelectedBook(book)} />
          ))}
        </div>
      )}

      {selectedBook && <BookModal book={selectedBook} onClose={() => setSelectedBook(null)} />}
    </div>
  )
}
