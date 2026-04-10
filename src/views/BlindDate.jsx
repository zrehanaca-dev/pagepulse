import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Heart, BookOpen, Loader } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { getBooksByMood } from '../lib/googleBooks'
import { generateWhyNote } from '../lib/openai'
import { BookModal } from '../components/BookModal'

export function BlindDate() {
  const { addToStack, allStackBooks, toast, stack } = useApp()

  const [deck, setDeck]         = useState([])
  const [idx, setIdx]           = useState(0)
  const [loading, setLoading]   = useState(true)
  const [gone, setGone]         = useState(null)   // 'left' | 'right'
  const [selectedBook, setSelectedBook] = useState(null)
  const [aiWhy, setAiWhy]       = useState({})     // bookId → note

  const cardRef = useRef(null)
  const dragState = useRef({ startX: 0, curX: 0, dragging: false })

  // ── Load a mixed deck ─────────────────────────────────────────────
  useEffect(() => {
    setLoading(true)
    Promise.all([
      getBooksByMood('mysterious', 5),
      getBooksByMood('thrilling', 5),
      getBooksByMood('reflective', 5),
    ])
      .then((results) => {
        const seen = new Set()
        const merged = results.flat().filter((b) => {
          if (seen.has(b.id)) return false
          seen.add(b.id)
          return true
        })
        // Shuffle
        const shuffled = merged.sort(() => Math.random() - 0.5).slice(0, 12)
        setDeck(shuffled)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // ── Prefetch AI note for top card ─────────────────────────────────
  useEffect(() => {
    const book = deck[idx]
    if (!book || aiWhy[book.id] || !import.meta.env.VITE_OPENAI_API_KEY) return

    const readGenres = Object.values(stack).flat().flatMap((b) => b.genres || [])
    generateWhyNote(book, ['mysterious', 'thrilling'], readGenres)
      .then((note) => setAiWhy((prev) => ({ ...prev, [book.id]: note })))
      .catch(() => {})
  }, [idx, deck])

  // ── Swipe logic ───────────────────────────────────────────────────
  const swipe = useCallback(
    async (dir) => {
      const book = deck[idx]
      if (!book || gone) return

      setGone(dir)

      if (dir === 'right') {
        const note = aiWhy[book.id] || ''
        const added = await addToStack(book, 'curious', note)
        if (added) toast(`"${book.title}" added to Curious 🔮`)
      }

      setTimeout(() => {
        setGone(null)
        setIdx((i) => i + 1)
      }, 360)
    },
    [deck, idx, gone, aiWhy, addToStack, toast]
  )

  // ── Drag / touch handlers ─────────────────────────────────────────
  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const onStart = (x) => {
      dragState.current = { startX: x, curX: 0, dragging: true }
      card.style.transition = 'none'
    }
    const onMove = (x) => {
      if (!dragState.current.dragging) return
      const dx = x - dragState.current.startX
      dragState.current.curX = dx
      const rot = dx * 0.08
      card.style.transform = `translateX(${dx}px) rotate(${rot}deg)`
      const like = card.querySelector('.like-indicator')
      const nope = card.querySelector('.nope-indicator')
      if (dx > 30)       { like.style.opacity = Math.min((dx - 30) / 80, 1); nope.style.opacity = 0 }
      else if (dx < -30) { nope.style.opacity = Math.min((-dx - 30) / 80, 1); like.style.opacity = 0 }
      else               { like.style.opacity = 0; nope.style.opacity = 0 }
    }
    const onEnd = () => {
      if (!dragState.current.dragging) return
      dragState.current.dragging = false
      card.style.transition = ''
      const dx = dragState.current.curX
      if (dx > 80)       swipe('right')
      else if (dx < -80) swipe('left')
      else {
        card.style.transform = ''
        card.querySelector('.like-indicator').style.opacity = 0
        card.querySelector('.nope-indicator').style.opacity = 0
      }
    }

    const mouseDown = (e) => onStart(e.clientX)
    const mouseMove = (e) => onMove(e.clientX)
    const touchStart = (e) => onStart(e.touches[0].clientX)
    const touchMove = (e) => onMove(e.touches[0].clientX)

    card.addEventListener('mousedown', mouseDown)
    card.addEventListener('touchstart', touchStart, { passive: true })
    document.addEventListener('mousemove', mouseMove)
    document.addEventListener('mouseup', onEnd)
    document.addEventListener('touchmove', touchMove, { passive: true })
    document.addEventListener('touchend', onEnd)

    return () => {
      card.removeEventListener('mousedown', mouseDown)
      card.removeEventListener('touchstart', touchStart)
      document.removeEventListener('mousemove', mouseMove)
      document.removeEventListener('mouseup', onEnd)
      document.removeEventListener('touchmove', touchMove)
      document.removeEventListener('touchend', onEnd)
    }
  }, [deck, idx, swipe])

  // ── Render ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100dvh - 116px)', gap: 12 }}>
        <Loader size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
        <div style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>Shuffling your deck…</div>
      </div>
    )
  }

  const remaining = deck.length - idx
  const topBook   = deck[idx]
  const nextBook  = deck[idx + 1]
  const thirdBook = deck[idx + 2]

  if (!topBook) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100dvh - 116px)', gap: 16, padding: '0 20px', textAlign: 'center' }}>
        <Heart size={48} style={{ color: 'var(--faint)' }} />
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontStyle: 'italic', color: 'var(--text)' }}>
          You've seen them all!
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Check your Curious stack to see what you saved.</div>
        <button className="btn btn-primary" onClick={() => { setIdx(0); setDeck((d) => [...d].sort(() => Math.random() - 0.5)) }}>
          Shuffle Again
        </button>
      </div>
    )
  }

  const note = aiWhy[topBook.id] || topBook.description?.slice(0, 120) || 'A book waiting to surprise you.'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 20px', minHeight: 'calc(100dvh - 116px)' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontStyle: 'italic', color: 'var(--text)' }}>
          Book BlindDate
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: 4 }}>Swipe right to save, left to skip</p>
      </div>

      {/* Card stack */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 340, height: 430 }}>
        {/* Background cards */}
        {thirdBook && (
          <div style={{ position: 'absolute', inset: 0, transform: 'scale(0.92) translateY(20px)', zIndex: 0, borderRadius: 'var(--r-xl)', overflow: 'hidden', background: 'var(--surface2)', boxShadow: 'var(--sh-md)' }}>
            <CoverOrPlaceholder book={thirdBook} height={240} />
          </div>
        )}
        {nextBook && (
          <div style={{ position: 'absolute', inset: 0, transform: 'scale(0.96) translateY(10px)', zIndex: 1, borderRadius: 'var(--r-xl)', overflow: 'hidden', background: 'var(--surface2)', boxShadow: 'var(--sh-md)' }}>
            <CoverOrPlaceholder book={nextBook} height={240} />
          </div>
        )}

        {/* Top card */}
        <div
          ref={cardRef}
          className={`swipe-card${gone === 'left' ? ' gone-left' : gone === 'right' ? ' gone-right' : ''}`}
          style={{ zIndex: 10 }}
          onDoubleClick={() => setSelectedBook(topBook)}
        >
          <div className="like-indicator">ADD ✓</div>
          <div className="nope-indicator">SKIP ✕</div>

          <CoverOrPlaceholder book={topBook} height={240} />

          <div style={{ padding: 16 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontStyle: 'italic', color: 'var(--text)', marginBottom: 2 }}>
              {topBook.title}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 8 }}>{topBook.author}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.5, fontStyle: 'italic', borderLeft: '2px solid var(--primary)', paddingLeft: 8, marginBottom: 10 }}>
              {note}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {topBook.genres.slice(0, 3).map((g) => <span key={g} className="tag">{g}</span>)}
            </div>
          </div>
        </div>
      </div>

      {/* Swipe buttons */}
      <div style={{ display: 'flex', gap: 20, marginTop: 20 }}>
        <button
          style={{ width: 58, height: 58, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface2)', color: '#e05555', border: '2px solid rgba(224,85,85,0.2)', boxShadow: 'var(--sh-md)' }}
          onClick={() => swipe('left')}
          aria-label="Skip"
        >
          <X size={24} strokeWidth={2.5} />
        </button>
        <button
          style={{ width: 58, height: 58, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary)', color: '#fff', border: '2px solid transparent', boxShadow: 'var(--sh-md)' }}
          onClick={() => swipe('right')}
          aria-label="Save"
        >
          <Heart size={24} strokeWidth={2.5} />
        </button>
      </div>

      <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 12 }}>
        {remaining} book{remaining !== 1 ? 's' : ''} remaining · double-tap for details
      </div>

      {selectedBook && <BookModal book={selectedBook} onClose={() => setSelectedBook(null)} />}
    </div>
  )
}

function CoverOrPlaceholder({ book, height }) {
  const [err, setErr] = useState(false)
  if (book.cover && !err) {
    return <img src={book.cover} alt={book.title} style={{ width: '100%', height, objectFit: 'cover' }} onError={() => setErr(true)} />
  }
  return (
    <div style={{ width: '100%', height, background: 'linear-gradient(135deg, var(--surface3), var(--surface))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--faint)' }}>
      <BookOpen size={40} />
    </div>
  )
}
