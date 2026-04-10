import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { BookOpen, Loader } from 'lucide-react'

export function Auth() {
  const { toast } = useApp()
  const [mode, setMode]       = useState('signin') // 'signin' | 'signup'
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async () => {
    setError('')
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { data, error: signUpErr } = await supabase.auth.signUp({ email, password })
        if (signUpErr) throw signUpErr

        // Create profile row
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email,
            username: name || email.split('@')[0],
          })
        }
        toast('Welcome to PagePulse! 🎉 Check your email to confirm.')
      } else {
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
        if (signInErr) throw signInErr
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 40 }}>
        <svg width="60" height="60" viewBox="0 0 30 30" fill="none" style={{ marginBottom: 14 }}>
          <rect width="30" height="30" rx="8" fill="var(--primary)" />
          <path d="M8 7h10a5 5 0 010 10H8V7z" fill="white" opacity="0.9" />
          <path d="M8 17h8" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <path d="M8 21h5" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <circle cx="22" cy="22" r="3" fill="var(--gold)" />
        </svg>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontStyle: 'italic', color: 'var(--text)' }}>
          PagePulse
        </div>
        <div style={{ fontSize: '0.88rem', color: 'var(--muted)', marginTop: 6, textAlign: 'center', maxWidth: '28ch' }}>
          Discover your next obsession. Build your reading identity.
        </div>
      </div>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: 380,
        background: 'var(--surface)',
        borderRadius: 'var(--r-xl)',
        border: '1px solid var(--border)',
        padding: '28px 24px',
        boxShadow: 'var(--sh-lg)',
      }}>
        {/* Mode toggle */}
        <div style={{ display: 'flex', background: 'var(--surface3)', borderRadius: 'var(--r-full)', padding: 3, marginBottom: 24 }}>
          {['signin', 'signup'].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError('') }}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 'var(--r-full)',
                fontSize: '0.85rem', fontWeight: 600,
                background: mode === m ? 'var(--surface)' : 'transparent',
                color: mode === m ? 'var(--text)' : 'var(--muted)',
                boxShadow: mode === m ? 'var(--sh-sm)' : 'none',
                transition: 'all var(--tr)',
              }}
            >
              {m === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'signup' && (
            <input
              className="auth-input"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <input
            className="auth-input"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <input
            className="auth-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />

          {error && (
            <div style={{ fontSize: '0.82rem', color: '#e05555', background: 'rgba(224,85,85,0.1)', padding: '10px 14px', borderRadius: 'var(--r-md)', lineHeight: 1.4 }}>
              {error}
            </div>
          )}

          <button
            className="btn btn-primary btn-block"
            onClick={handleSubmit}
            disabled={loading}
            style={{ marginTop: 4, height: 44 }}
          >
            {loading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : (mode === 'signin' ? 'Sign In' : 'Create Account')}
          </button>
        </div>

        {/* Demo note */}
        <div style={{ marginTop: 20, padding: '12px', background: 'var(--surface3)', borderRadius: 'var(--r-md)', fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--text)' }}>Demo mode:</strong> If Supabase isn't configured, the app still works — your stack is stored locally in memory.
        </div>
      </div>

      <div style={{ marginTop: 20, fontSize: '0.78rem', color: 'var(--faint)', textAlign: 'center' }}>
        PagePulse · Vibe Coding Hackathon MVP
      </div>
    </div>
  )
}
