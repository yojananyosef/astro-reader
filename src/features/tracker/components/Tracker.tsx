import { useState } from "preact/hooks";
import { useTracker, type Book } from "../hooks/useTracker";
import ChapterModal from "./ChapterModal";
import { RotateCcw } from "lucide-preact";

export default function Tracker() {
  const {
    books,
    completedChapters,
    toggleChapter,
    getBookProgress,
    getTotalProgress,
    resetProgress,
    isLoading
  } = useTracker();

  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  if (isLoading) {
    return <div className="p-8 text-center">Cargando progreso...</div>;
  }

  const totalProgress = getTotalProgress();
  const otBooks = books.filter(b => b.section === "at");
  const ntBooks = books.filter(b => b.section === "nt");

  const otProgress = Math.round(
    otBooks.reduce((acc, book) => acc + (completedChapters[book.code]?.length || 0), 0) /
    otBooks.reduce((acc, book) => acc + book.chapters, 0) * 100
  );

  const ntProgress = Math.round(
    ntBooks.reduce((acc, book) => acc + (completedChapters[book.code]?.length || 0), 0) /
    ntBooks.reduce((acc, book) => acc + book.chapters, 0) * 100
  );

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20 px-4 md:px-8">

      {/* Header & Main Progress */}
      <div className="flex flex-col items-center justify-center py-8 relative">
        <h1 className="text-3xl font-bold mb-8">Año bíblico</h1>

        <button
          onClick={resetProgress}
          className="absolute top-8 right-0 md:right-8 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2"
          title="Reiniciar todo el progreso"
        >
          <RotateCcw className="w-5 h-5" />
          <span className="hidden md:inline text-sm">Reiniciar</span>
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border w-full max-w-2xl flex flex-col md:flex-row items-center justify-around gap-8"
          style={{ backgroundColor: "var(--color-bg)", borderColor: "color-mix(in srgb, var(--color-text), transparent 90%)" }}>

          {/* Circular Progress */}
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                className="text-gray-200 dark:text-gray-700 stroke-current"
                stroke-width="10"
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
              ></circle>
              <circle
                className="text-[var(--color-link)] progress-ring__circle stroke-current transition-all duration-1000 ease-out"
                stroke-width="10"
                stroke-linecap="round"
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke-dasharray={`${2 * Math.PI * 40}`}
                stroke-dashoffset={`${2 * Math.PI * 40 * (1 - totalProgress / 100)}`}
              ></circle>
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-sm font-medium text-gray-500">La Biblia entera</span>
              <span className="text-4xl font-bold">{totalProgress}%</span>
            </div>
          </div>

          {/* Sub Progress Stats */}
          <div className="flex gap-8">
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24 mb-2 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle className="text-gray-200 dark:text-gray-700 stroke-current" stroke-width="8" cx="50" cy="50" r="40" fill="transparent"></circle>
                  <circle className="text-[var(--color-link)] stroke-current transition-all duration-1000 ease-out" stroke-width="8" stroke-linecap="round" cx="50" cy="50" r="40" fill="transparent"
                    stroke-dasharray={`${2 * Math.PI * 40}`}
                    stroke-dashoffset={`${2 * Math.PI * 40 * (1 - otProgress / 100)}`}
                  ></circle>
                </svg>
                <span className="absolute text-lg font-bold">{otProgress}%</span>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Antiguo Testamento</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24 mb-2 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle className="text-gray-200 dark:text-gray-700 stroke-current" stroke-width="8" cx="50" cy="50" r="40" fill="transparent"></circle>
                  <circle className="text-[var(--color-link)] stroke-current transition-all duration-1000 ease-out" stroke-width="8" stroke-linecap="round" cx="50" cy="50" r="40" fill="transparent"
                    stroke-dasharray={`${2 * Math.PI * 40}`}
                    stroke-dashoffset={`${2 * Math.PI * 40 * (1 - ntProgress / 100)}`}
                  ></circle>
                </svg>
                <span className="absolute text-lg font-bold">{ntProgress}%</span>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Nuevo Testamento</span>
            </div>
          </div>

        </div>
      </div>

      {/* Book Lists */}
      <div className="space-y-12">
        <Section title="Antiguo Testamento" books={otBooks} onSelect={setSelectedBook} getProgress={getBookProgress} />
        <Section title="Nuevo Testamento" books={ntBooks} onSelect={setSelectedBook} getProgress={getBookProgress} />
      </div>

      {/* Modal */}
      {selectedBook && (
        <ChapterModal
          book={selectedBook}
          completedChapters={completedChapters[selectedBook.code] || []}
          onToggleChapter={(chapter) => toggleChapter(selectedBook.code, chapter)}
          onClose={() => setSelectedBook(null)}
          isOpen={!!selectedBook}
        />
      )}
    </div>
  );
}

function Section({ title, books, onSelect, getProgress }: { title: string, books: Book[], onSelect: (b: Book) => void, getProgress: (c: string) => number }) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-6">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {books.map(book => {
          const progress = getProgress(book.code);
          return (
            <button
              key={book.code}
              onClick={() => onSelect(book)}
              className="group relative p-4 rounded-xl border transition-all duration-200 text-left bg-white dark:bg-gray-800 hover:shadow-md"
              style={{
                borderColor: "color-mix(in srgb, var(--color-text), transparent 85%)"
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-link)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-text), transparent 85%)'}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-lg">{book.code.charAt(0).toUpperCase() + book.code.slice(1, 3)}</span>
                {progress === 100 && (
                  <span className="text-green-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>
              <div className="text-sm opacity-70 mb-3">{book.name}</div>

              <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-colors duration-300 ${progress === 100 ? 'bg-green-500' : ''}`}
                  style={{ width: `${progress}%`, backgroundColor: progress === 100 ? undefined : 'var(--color-link)' }}
                />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  );
}
