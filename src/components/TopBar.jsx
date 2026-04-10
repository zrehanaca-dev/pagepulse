import { Moon, Sun, Search } from 'lucide-react'
import { useApp } from '../context/AppContext'

export function TopBar({ onSearchClick }) {
  const { dark, toggleTheme } = useApp()

  return (
    <header className="topbar">
      <div className="logo">
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-label="PagePulse logo">
          <rect width="30" height="30" rx="8" fill="var(--primary)" />
          <path d="M8 7h10a5 5 0 010 10H8V7z" fill="white" opacity="0.9" />
          <path d="M8 17h8" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <path d="M8 21h5" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <circle cx="22" cy="22" r="3" fill="var(--gold)" />
        </svg>
        PagePulse
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button className="icon-btn" aria-label="Search" onClick={onSearchClick}>
          <Search size={18} />
        </button>
        <button className="icon-btn" aria-label="Toggle theme" onClick={toggleTheme}>
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  )
}
