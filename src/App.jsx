import { useState, useRef } from 'react'
import { useApp } from './context/AppContext'
import { TopBar }    from './components/TopBar'
import { BottomNav } from './components/BottomNav'
import { Toast }     from './components/Toast'
import { Auth }      from './views/Auth'
import { Discover }  from './views/Discover'
import { BlindDate } from './views/BlindDate'
import { Stack }     from './views/Stack'
import { DNA }       from './views/DNA'
import { Profile }   from './views/Profile'
import { Search }    from 'lucide-react'

function SearchBar({ query, onChange, onClose }) {
  const inputRef = useRef(null)
  return (
    <div style={{
      position: 'fixed', top: 56, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 480, zIndex: 150,
      background: 'var(--surface)', borderBottom: '1px solid var(--border)',
      padding: '10px 20px', boxShadow: 'var(--sh-md)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r-full)', padding: '10px 16px', boxShadow: 'var(--sh-sm)' }}>
        <Search size={16} style={{ color: 'var(--faint)', flexShrink: 0 }} />
        <input
          ref={inputRef}
          autoFocus
          style={{ flex: 1, fontSize: '0.9rem', background: 'none', color: 'var(--text)' }}
          placeholder="Search books, authors, genres…"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
        />
        {query && (
          <button
            onClick={() => onChange('')}
            style={{ color: 'var(--faint)', fontSize: '0.8rem', padding: '0 4px' }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const { user, authReady } = useApp()
  const [activeView, setActiveView] = useState('discover')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const mainRef = useRef(null)

  if (!authReady) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div className="spinner" />
      </div>
    )
  }

  // Show auth if no user (optional — remove this block for demo-without-auth mode)
  // Comment out to allow unauthenticated access
  // if (!user) return <Auth />

  const handleNavChange = (view) => {
    setActiveView(view)
    setSearchOpen(false)
    setSearchQuery('')
    if (mainRef.current) mainRef.current.scrollTop = 0
  }

  const handleSearchClick = () => {
    setActiveView('discover')
    setSearchOpen((o) => !o)
    if (searchOpen) setSearchQuery('')
  }

  const VIEWS = {
    discover:  <Discover searchQuery={searchOpen ? searchQuery : ''} onClearSearch={() => { setSearchQuery(''); setSearchOpen(false) }} />,
    blinddate: <BlindDate />,
    stack:     <Stack    />,
    dna:       <DNA      />,
    profile:   user ? <Profile /> : <Auth />,
  }

  return (
    <div className="app-shell">
      <TopBar onSearchClick={handleSearchClick} />

      {searchOpen && (
        <SearchBar
          query={searchQuery}
          onChange={(q) => { setSearchQuery(q); if (!q) setSearchOpen(false) }}
          onClose={() => { setSearchOpen(false); setSearchQuery('') }}
        />
      )}

      <main
        ref={mainRef}
        className="main-scroll"
        style={{ paddingTop: searchOpen ? 60 : 0 }}
      >
        {VIEWS[activeView]}
      </main>

      <BottomNav active={activeView} onChange={handleNavChange} />

      <Toast />
    </div>
  )
}
