import { BookOpen } from 'lucide-react'

export function BookCard({ book, onClick }) {
  return (
    <div className="book-card" onClick={onClick}>
      {book.cover ? (
        <img
          src={book.cover}
          alt={book.title}
          className="book-cover"
          onError={(e) => {
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'flex'
          }}
        />
      ) : null}
      <div
        className="book-cover-ph"
        style={{ display: book.cover ? 'none' : 'flex' }}
      >
        <BookOpen size={28} />
      </div>
      <div className="book-title">{book.title}</div>
      <div className="book-author">{book.author}</div>
    </div>
  )
}
