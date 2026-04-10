import { useState, useRef, useEffect } from 'react'
import { Share2, RefreshCw, Download, Loader } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { generateDNA } from '../lib/openai'

const FALLBACK_DNA = {
  typeName: 'The Eclectic Reader',
  tagline: '"Your taste defies categories — you read with your whole heart."',
  traits: [
    { label: 'Dark vs Light',       value: 50 },
    { label: 'Slow vs Fast',        value: 50 },
    { label: 'Familiar vs Unusual', value: 60 },
    { label: 'Emotional vs Plot',   value: 55 },
  ],
  topGenres: ['Literary Fiction', 'Mystery', 'Non-Fiction', 'Fantasy'],
}

export function DNA() {
  const { allStackBooks, stack, user, profile, toast } = useApp()
  const cardRef = useRef(null)

  const [dna, setDna]         = useState(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  const booksRead = stack.done.length + stack.loved.length
  const inStack   = allStackBooks.length
  const loved     = stack.loved.length

  // Auto-generate when entering DNA tab
  useEffect(() => {
    if (allStackBooks.length > 0 && !dna) regenerate()
    else if (!dna) setDna(FALLBACK_DNA)
  }, [])

  const regenerate = async () => {
    if (allStackBooks.length === 0) { setDna(FALLBACK_DNA); return }
    setLoading(true)
    try {
      const result = import.meta.env.VITE_OPENAI_API_KEY
        ? await generateDNA(allStackBooks)
        : FALLBACK_DNA
      setDna(result)
    } catch { setDna(FALLBACK_DNA) }
    finally { setLoading(false) }
  }

  const exportPNG = async () => {
    if (!cardRef.current) return
    setExporting(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        logging: false,
      })
      const link = document.createElement('a')
      link.download = 'my-reading-dna.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
      toast('Reading DNA card downloaded! 📤')
    } catch (err) {
      toast('Export failed — try a screenshot instead.')
    }
    setExporting(false)
  }

  const shareCard = async () => {
    const text = dna ? `My Reading DNA: ${dna.typeName}\n${dna.tagline}\n\nDiscover yours on PagePulse 📚` : 'Check out my Reading DNA on PagePulse!'
    if (navigator.share) {
      navigator.share({ title: 'My Reading DNA — PagePulse', text }).catch(() => {})
    } else {
      navigator.clipboard.writeText(text).then(() => toast('DNA summary copied to clipboard! 📤')).catch(() => {})
    }
  }

  const userName = profile?.username || user?.email?.split('@')[0] || 'Reader'

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', fontStyle: 'italic', color: 'var(--text)' }}>
          Your Reading DNA
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 6, maxWidth: '32ch', margin: '6px auto 0' }}>
          AI-generated based on your reading taste and stack
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
        {[
          { num: booksRead, label: 'Books Read' },
          { num: inStack,   label: 'In Stack'   },
          { num: loved,     label: 'Loved'       },
        ].map(({ num, label }) => (
          <div key={label} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 14, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--primary)', fontStyle: 'italic', lineHeight: 1 }}>{num}</div>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* DNA Card */}
      {loading ? (
        <div style={{ minHeight: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: 'linear-gradient(135deg,#1a0a2e,#0d1f1a,#1a0808)', borderRadius: 'var(--r-xl)', marginBottom: 20 }}>
          <Loader size={28} style={{ animation: 'spin 1s linear infinite', color: 'rgba(255,255,255,0.6)' }} />
          <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>The AI is reading your soul…</div>
        </div>
      ) : dna ? (
        <div ref={cardRef} className="dna-card" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 10, position: 'relative', zIndex: 1 }}>
            Reading DNA · PagePulse
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontStyle: 'italic', lineHeight: 1.2, marginBottom: 6, position: 'relative', zIndex: 1, color: '#fff' }}>
            {dna.typeName}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', marginBottom: 20, position: 'relative', zIndex: 1 }}>
            {dna.tagline}
          </div>

          {/* Trait bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', zIndex: 1 }}>
            {dna.traits.map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', width: 110, flexShrink: 0 }}>{label}</span>
                <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${value}%`, borderRadius: 3, background: 'linear-gradient(90deg, var(--primary), var(--gold))' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Genre tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16, position: 'relative', zIndex: 1 }}>
            {dna.topGenres.map((g) => (
              <span key={g} style={{ padding: '4px 12px', borderRadius: 'var(--r-full)', fontSize: '0.72rem', fontWeight: 600, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.15)' }}>
                {g}
              </span>
            ))}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', position: 'relative', zIndex: 1 }}>
            <span>@{userName} · {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            <svg width="20" height="20" viewBox="0 0 30 30" fill="none">
              <rect width="30" height="30" rx="8" fill="rgba(255,255,255,0.15)" />
              <path d="M8 7h10a5 5 0 010 10H8V7z" fill="white" opacity="0.7" />
              <circle cx="22" cy="22" r="3" fill="rgba(255,200,50,0.8)" />
            </svg>
          </div>
        </div>
      ) : null}

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="btn btn-primary btn-block" onClick={exportPNG} disabled={exporting || loading}>
          {exporting
            ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
            : <Download size={16} />}
          Download as PNG
        </button>
        <button className="btn btn-ghost btn-block" onClick={shareCard}>
          <Share2 size={16} /> Share Reading DNA
        </button>
        <button className="btn btn-ghost btn-block" onClick={regenerate} disabled={loading}>
          <RefreshCw size={16} /> {loading ? 'Regenerating…' : 'Regenerate with AI'}
        </button>
      </div>

      {allStackBooks.length === 0 && (
        <div style={{ marginTop: 16, fontSize: '0.82rem', color: 'var(--muted)', textAlign: 'center', background: 'var(--surface2)', padding: '14px', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)' }}>
          Add books to your stack first to get a personalised Reading DNA ✨
        </div>
      )}

      <div style={{ height: 20 }} />
    </div>
  )
}
