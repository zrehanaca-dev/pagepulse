import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'

export function Profile() {
  const { user, profile, stack, allStackBooks, dark, toggleTheme, toast } = useApp()
  const [dailyTarot, setDailyTarot]   = useState(true)
  const [reminders, setReminders]     = useState(false)
  const [shareAnon, setShareAnon]     = useState(true)

  const booksRead = stack.done.length + stack.loved.length
  const inQueue   = allStackBooks.length
  const loved     = stack.loved.length

  const userName = profile?.username || user?.email?.split('@')[0] || 'Reader'
  const initials = userName.slice(0, 2).toUpperCase()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast('Signed out. See you soon! 👋')
  }

  return (
    <div style={{ padding: '24px 20px 40px' }}>
      {/* Avatar + Identity */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), var(--gold))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontSize: '2rem', color: '#fff',
          fontStyle: 'italic', boxShadow: 'var(--sh-md)',
        }}>
          {initials}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontStyle: 'italic', color: 'var(--text)' }}>
          {userName}
        </div>
        {user?.email && (
          <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{user.email}</div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden', marginBottom: 28 }}>
        {[
          { n: booksRead, l: 'Read'  },
          { n: inQueue,   l: 'Queue' },
          { n: loved,     l: 'Loved' },
        ].map(({ n, l }) => (
          <div key={l} style={{ background: 'var(--surface2)', padding: 14, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--text)', fontStyle: 'italic' }}>{n}</div>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Settings */}
      <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
        Settings
      </div>

      {[
        {
          label: 'Dark mode',
          sub: 'Toggle light / dark theme',
          value: dark,
          toggle: toggleTheme,
        },
        {
          label: 'Daily Book Tarot',
          sub: 'Receive a daily AI book pick',
          value: dailyTarot,
          toggle: () => setDailyTarot((v) => !v),
        },
        {
          label: 'Reading reminders',
          sub: 'Daily nudge to keep reading',
          value: reminders,
          toggle: () => setReminders((v) => !v),
        },
        {
          label: 'Share anonymous reading data',
          sub: 'Contributes to the Live Pulse Map (coming v3)',
          value: shareAnon,
          toggle: () => setShareAnon((v) => !v),
        },
      ].map(({ label, sub, value, toggle }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--divider)' }}>
          <div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text)' }}>{label}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 1 }}>{sub}</div>
          </div>
          <div
            className={`toggle${value ? ' on' : ''}`}
            role="switch"
            aria-checked={value}
            onClick={toggle}
          />
        </div>
      ))}

      {/* Coming soon */}
      <div style={{ marginTop: 24 }}>
        <button
          className="btn btn-ghost btn-block"
          style={{ color: 'var(--muted)' }}
          onClick={() => toast('Coming soon: Find your Reading Soulmate 🔮')}
        >
          Find your Reading Soulmate →
        </button>
      </div>

      {/* Sign out */}
      {user && (
        <div style={{ marginTop: 12 }}>
          <button
            className="btn btn-ghost btn-block"
            style={{ color: '#e05555', borderColor: 'rgba(224,85,85,0.2)' }}
            onClick={handleSignOut}
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      )}

      <div style={{ marginTop: 32, textAlign: 'center', fontSize: '0.72rem', color: 'var(--faint)' }}>
        PagePulse · Vibe Coding Hackathon MVP · April 2026
      </div>
    </div>
  )
}
