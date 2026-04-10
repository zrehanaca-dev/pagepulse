const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY
const MODEL = 'gpt-4.1'

async function chat(messages, maxTokens = 300) {
  if (!OPENAI_API_KEY) throw new Error('Missing VITE_OPENAI_API_KEY')

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: MODEL, messages, max_tokens: maxTokens }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `OpenAI error ${res.status}`)
  }

  const data = await res.json()
  return data.choices[0].message.content.trim()
}

/**
 * Generate a personalised "why this book is for you" note.
 * @param {object} book  – { title, author, description, genres }
 * @param {string[]} moodTags – user's current mood tags
 * @param {string[]} readGenres – genres already in user's stack
 */
export async function generateWhyNote(book, moodTags = [], readGenres = []) {
  const systemPrompt = `You are PagePulse, an AI book curator. Generate a short, compelling, 
personalised reason (2–3 sentences max, ~40 words) why a specific reader should read this book 
RIGHT NOW. Sound warm, insightful, and a little poetic — not generic. Never start with "This book".`

  const userPrompt = `Book: "${book.title}" by ${book.author}
Description: ${book.description?.slice(0, 300) || 'No description available'}
Genres: ${(book.genres || []).join(', ')}
Reader's current mood: ${moodTags.join(', ') || 'not specified'}
Reader's recent genres: ${readGenres.slice(0, 5).join(', ') || 'varied'}

Write the personalised note now:`

  return chat(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    120
  )
}

/**
 * Generate a Reading DNA profile for the user based on their stack.
 * Returns { typeName, tagline, traits: [{label, value}], topGenres }
 */
export async function generateDNA(stackBooks) {
  const bookList = stackBooks
    .slice(0, 20)
    .map((b) => `• ${b.title} by ${b.author} (${b.lane}) – genres: ${(b.genres || []).join(', ')}`)
    .join('\n')

  const systemPrompt = `You are PagePulse, an AI reading personality analyst. 
Analyse a reader's book stack and return ONLY valid JSON — no markdown, no preamble.`

  const userPrompt = `Here are the books in this reader's stack:
${bookList}

Return a JSON object with exactly these fields:
{
  "typeName": "A poetic 3–4 word reader archetype name (e.g. 'The Dark Dreamer')",
  "tagline": "A one-sentence quote capturing their reading identity (in double quotes, ~15 words)",
  "traits": [
    {"label": "Dark vs Light", "value": 0–100},
    {"label": "Slow vs Fast", "value": 0–100},
    {"label": "Familiar vs Unusual", "value": 0–100},
    {"label": "Emotional vs Plot", "value": 0–100}
  ],
  "topGenres": ["Genre1", "Genre2", "Genre3", "Genre4"]
}
JSON only:`

  const raw = await chat(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    400
  )

  try {
    const clean = raw.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch {
    // Fallback DNA
    return {
      typeName: 'The Eclectic Reader',
      tagline: '"Your taste defies categories — you read with your whole heart."',
      traits: [
        { label: 'Dark vs Light', value: 50 },
        { label: 'Slow vs Fast', value: 50 },
        { label: 'Familiar vs Unusual', value: 60 },
        { label: 'Emotional vs Plot', value: 55 },
      ],
      topGenres: ['Literary Fiction', 'Mystery', 'Non-Fiction', 'Fantasy'],
    }
  }
}

/**
 * Generate the daily Book Tarot pick based on mood.
 */
export async function generateTarotPick(mood = 'curious', recentTitles = []) {
  const systemPrompt = `You are PagePulse's Book Tarot oracle. Recommend one real, published book 
for today's pick. Return ONLY valid JSON.`

  const userPrompt = `Reader's mood today: "${mood}"
Books they've recently seen (avoid these): ${recentTitles.slice(0, 5).join(', ') || 'none'}

Return JSON:
{
  "title": "exact book title",
  "author": "exact author name",
  "reason": "A mystical, 2-sentence personalised reason this book chose them today (~30 words)"
}
JSON only:`

  const raw = await chat(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    200
  )

  try {
    const clean = raw.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch {
    return {
      title: 'The Midnight Library',
      author: 'Matt Haig',
      reason:
        'Between life and death there is a library of every choice you never made. Your mood calls for a book about second chances.',
    }
  }
}
