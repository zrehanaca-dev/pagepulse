const API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY || ''
const BASE = 'https://www.googleapis.com/books/v1/volumes'

function normaliseVolume(vol) {
  const info = vol.volumeInfo || {}
  const cover =
    info.imageLinks?.thumbnail?.replace('http://', 'https://') ||
    info.imageLinks?.smallThumbnail?.replace('http://', 'https://') ||
    null

  return {
    id: vol.id,
    title: info.title || 'Unknown Title',
    author: (info.authors || ['Unknown Author']).join(', '),
    description: info.description || '',
    cover,
    genres: info.categories || [],
    publishedYear: info.publishedDate ? parseInt(info.publishedDate.slice(0, 4)) : null,
    pageCount: info.pageCount || null,
    averageRating: info.averageRating || null,
    ratingsCount: info.ratingsCount || 0,
    previewLink: info.previewLink || null,
  }
}

function buildUrl(params) {
  const qs = new URLSearchParams(params)
  if (API_KEY) qs.set('key', API_KEY)
  return `${BASE}?${qs}`
}

export async function searchBooks(query, maxResults = 12) {
  if (!query.trim()) return []
  const url = buildUrl({ q: query, maxResults, printType: 'books', langRestrict: 'en' })
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Google Books error: ${res.status}`)
  const data = await res.json()
  return (data.items || []).map(normaliseVolume)
}

export async function getBooksByMood(mood, maxResults = 10) {
  const moodQueries = {
    mysterious: 'mystery thriller suspense psychological',
    reflective: 'literary fiction introspective philosophical',
    thrilling: 'thriller action adventure suspense',
    romantic: 'romance contemporary love story',
    dark: 'dark fiction gothic horror literary',
    hopeful: 'uplifting inspiring hope redemption',
    funny: 'humor comedy satire witty fiction',
  }
  const query = moodQueries[mood] || `${mood} fiction bestseller`
  return searchBooks(query, maxResults)
}

export async function getTrendingBooks(maxResults = 8) {
  // Use a rotating set of curated trending queries
  const queries = [
    'bestseller fiction 2024 2025',
    'prize winning novel literary',
    'debut novel acclaimed 2025',
  ]
  const q = queries[new Date().getDay() % queries.length]
  return searchBooks(q, maxResults)
}

export async function getBookById(googleBooksId) {
  const res = await fetch(`${BASE}/${googleBooksId}${API_KEY ? `?key=${API_KEY}` : ''}`)
  if (!res.ok) throw new Error(`Google Books error: ${res.status}`)
  const vol = await res.json()
  return normaliseVolume(vol)
}
