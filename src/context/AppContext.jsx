import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [user, setUser]         = useState(null)
  const [profile, setProfile]   = useState(null)
  const [authReady, setAuthReady] = useState(false)

  // Reading stack: { curious:[], reading:[], done:[], loved:[] }
  const [stack, setStack] = useState({ curious: [], reading: [], done: [], loved: [] })
  const [stackLoaded, setStackLoaded] = useState(false)

  // Theme
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('pp-theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  // Toast
  const [toastMsg, setToastMsg] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const toastTimer = useRef(null)

  // ── Theme ────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('pp-theme', dark ? 'dark' : 'light')
  }, [dark])

  const toggleTheme = () => setDark((d) => !d)

  // ── Auth ─────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthReady(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── Profile ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) { setProfile(null); return }
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setProfile(data))
  }, [user])

  // ── Stack (load from Supabase) ───────────────────────────────────
  useEffect(() => {
    if (!user) {
      setStack({ curious: [], reading: [], done: [], loved: [] })
      setStackLoaded(false)
      return
    }

    supabase
      .from('reading_stack')
      .select('*')
      .eq('user_id', user.id)
      .then(({ data, error }) => {
        if (error) { console.error(error); return }
        const grouped = { curious: [], reading: [], done: [], loved: [] }
        ;(data || []).forEach((row) => {
          if (grouped[row.lane]) grouped[row.lane].push(row)
        })
        setStack(grouped)
        setStackLoaded(true)
      })
  }, [user])

  // ── Add book to stack ────────────────────────────────────────────
  const addToStack = useCallback(async (book, lane = 'curious', aiWhy = '') => {
    const allBooks = Object.values(stack).flat()
    const exists = allBooks.find((b) => b.book_id === book.id)
    if (exists) {
      toast(`"${book.title}" is already in your stack`)
      return false
    }

    const entry = {
      user_id: user?.id,
      book_id: book.id,
      lane,
      title: book.title,
      author: book.author,
      cover: book.cover || null,
      genres: book.genres || [],
      ai_why: aiWhy || book.why || '',
      description: book.description || '',
    }

    setStack((prev) => ({
      ...prev,
      [lane]: [...prev[lane], entry],
    }))

    if (user) {
      const { error } = await supabase.from('reading_stack').upsert(entry, {
        onConflict: 'user_id,book_id',
      })
      if (error) console.error('Stack save error:', error)
    }

    return true
  }, [stack, user])

  // ── Move book between lanes ──────────────────────────────────────
  const moveLane = useCallback(async (bookId, newLane) => {
    setStack((prev) => {
      const updated = { curious: [], reading: [], done: [], loved: [] }
      let moved = null
      Object.entries(prev).forEach(([lane, books]) => {
        books.forEach((b) => {
          if (b.book_id === bookId) { moved = { ...b, lane: newLane } }
          else updated[lane].push(b)
        })
      })
      if (moved) updated[newLane].push(moved)
      return updated
    })

    if (user) {
      await supabase
        .from('reading_stack')
        .update({ lane: newLane, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('book_id', bookId)
    }
  }, [user])

  // ── Remove from stack ────────────────────────────────────────────
  const removeFromStack = useCallback(async (bookId) => {
    setStack((prev) => {
      const updated = {}
      Object.entries(prev).forEach(([lane, books]) => {
        updated[lane] = books.filter((b) => b.book_id !== bookId)
      })
      return updated
    })
    if (user) {
      await supabase
        .from('reading_stack')
        .delete()
        .eq('user_id', user.id)
        .eq('book_id', bookId)
    }
  }, [user])

  // ── Toast ────────────────────────────────────────────────────────
  const toast = useCallback((msg) => {
    setToastMsg(msg)
    setToastVisible(true)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastVisible(false), 3000)
  }, [])

  const allStackBooks = Object.entries(stack).flatMap(([lane, books]) =>
    books.map((b) => ({ ...b, lane }))
  )

  return (
    <AppContext.Provider
      value={{
        user, profile, authReady,
        stack, stackLoaded, allStackBooks,
        addToStack, moveLane, removeFromStack,
        dark, toggleTheme,
        toast, toastMsg, toastVisible,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
