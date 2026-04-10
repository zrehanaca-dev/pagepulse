# 📚 PagePulse

> AI-powered book recommendation & reading stack app — Vibe Coding Hackathon MVP

**For avid readers and book discovery enthusiasts**, PagePulse combines AI mood-first discovery, a swipe-based BlindDate mechanic, a personal Reading Stack, and a shareable Reading DNA card — all in one mobile-first app.

---

## ✨ Features

| Feature | Status | Description |
|---|---|---|
| 🔐 Auth | ✅ Must | Supabase email/password sign-up + sign-in |
| 🔍 Book Search | ✅ Must | Google Books API with real-time results |
| 💕 Book BlindDate | ✅ Must | Swipe right/left card UI with drag support |
| 📚 Reading Stack | ✅ Must | Kanban lanes: Curious / Reading / Done / Loved |
| 🤖 AI "Why This For You" | ✅ Must | OpenAI GPT-4.1 personalised notes per book |
| 🔮 Daily Book Tarot | ✅ Should | AI-generated daily book pick based on mood |
| 🧬 Reading DNA Card | ✅ Should | AI reader personality profile + PNG export |
| 📖 Book Details Modal | ✅ Should | Synopsis, cover, lane picker, add to stack |
| 🎨 Dark / Light Mode | ✅ | Persisted theme toggle |
| 📱 Mobile-first | ✅ | Responsive, touch-native, 480px max-width |

---

## 🛠 Tech Stack

| Layer | Tool |
|---|---|
| Frontend | React 18 + Vite |
| Styling | CSS custom properties (design tokens) + Tailwind utilities |
| Icons | Lucide React |
| Auth + DB | Supabase (Postgres + RLS) |
| AI | OpenAI GPT-4.1 |
| Book Data | Google Books API |
| Export | html2canvas (PNG download) |

---

## 🚀 Quick Start

### 1. Clone / unzip the project

```bash
cd pagepulse
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_OPENAI_API_KEY=sk-...
VITE_GOOGLE_BOOKS_API_KEY=        # optional
```

### 3. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and paste the contents of `supabase/migrations/001_init.sql`
3. Run the query — it creates tables, RLS policies, triggers and indexes
4. Copy your **Project URL** and **anon key** from Settings → API

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 5. Build for production

```bash
npm run build
npm run preview
```

---

## 🔑 API Keys

| Key | Where to get it | Required |
|---|---|---|
| `VITE_SUPABASE_URL` | supabase.com → Project Settings → API | Yes |
| `VITE_SUPABASE_ANON_KEY` | Same location | Yes |
| `VITE_OPENAI_API_KEY` | platform.openai.com/api-keys | For AI features |
| `VITE_GOOGLE_BOOKS_API_KEY` | console.developers.google.com → Books API | Optional (raises rate limits) |

> **Demo mode:** If Supabase isn't configured, the app still works — your reading stack is stored in memory for the session. AI features require the OpenAI key.

---

## 📁 Project Structure

```
pagepulse/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.example
├── supabase/
│   └── migrations/
│       └── 001_init.sql          ← Run this in Supabase SQL Editor
└── src/
    ├── main.jsx                  ← Entry point
    ├── App.jsx                   ← Shell, routing, search overlay
    ├── index.css                 ← Design token CSS variables + global styles
    ├── lib/
    │   ├── supabase.js           ← Supabase client
    │   ├── openai.js             ← AI: why-note, DNA, tarot
    │   └── googleBooks.js        ← Book search + mood queries
    ├── context/
    │   └── AppContext.jsx        ← Auth, stack state, theme, toast
    ├── components/
    │   ├── TopBar.jsx
    │   ├── BottomNav.jsx
    │   ├── BookCard.jsx
    │   ├── BookModal.jsx         ← Detail sheet + add to stack
    │   └── Toast.jsx
    └── views/
        ├── Auth.jsx              ← Sign in / Sign up
        ├── Discover.jsx          ← Mood selector, Book Tarot, recommendations
        ├── BlindDate.jsx         ← Swipe cards with drag/touch
        ├── Stack.jsx             ← Kanban view with lane-switching
        ├── DNA.jsx               ← AI DNA card + PNG export
        └── Profile.jsx           ← User info, stats, settings
```

---

## 🗄 Database Schema

```sql
profiles (id, username, email, mood_preferences, dna_type, dna_tagline)
reading_stack (id, user_id, book_id, lane, title, author, cover, genres, ai_why, description)
```

All tables have Row Level Security (RLS) — users can only read/write their own data.

---

## 🗺 Roadmap (Parked for v2/v3)

- **Daily Book Tarot** notifications (push/email)
- **Ask the Book** — AI author/character chat
- **Shelfie Generator** — visual bookshelf poster export
- **Live Global Pulse Map** — real-time anonymous reading activity
- **Reading Soulmate** — taste-based user matching via embeddings (pgvector)

---

## 🏆 Demo Flow (Hackathon)

1. Sign up → complete mood selection
2. Choose a mood chip → see AI-curated recommendations
3. Tap **BlindDate** → swipe books right/left
4. Check **Stack** → see saved books in Curious lane
5. Move a book to **Reading**
6. Open **DNA** → generate your AI reading personality card
7. Download or share the card

*Full demo loop completes in < 3 minutes.*

---

*PagePulse · Vibe Coding Hackathon · April 2026*
