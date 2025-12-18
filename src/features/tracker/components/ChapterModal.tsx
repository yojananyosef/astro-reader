import { X, Check } from "lucide-preact";
import type { Book } from "../hooks/useTracker";

type Props = {
  book: Book;
  completedChapters: number[];
  onToggleChapter: (chapter: number) => void;
  onClose: () => void;
  isOpen: boolean;
};

export default function ChapterModal({ book, completedChapters, onToggleChapter, onClose, isOpen }: Props) {
  if (!isOpen) return null;

  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);
  const progress = Math.round((completedChapters.length / book.chapters) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all" onClick={onClose}>
      <div
        className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
      >
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "color-mix(in srgb, var(--color-text), transparent 90%)" }}>
          <div>
            <h3 className="text-xl font-bold tracking-tight">{book.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-1.5 w-24 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: 'var(--color-link)' }} />
              </div>
              <p className="text-xs font-medium opacity-70">{progress}% Completado</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-5 gap-3">
            {chapters.map((chapter) => {
              const isCompleted = completedChapters.includes(chapter);
              return (
                <button
                  key={chapter}
                  onClick={() => onToggleChapter(chapter)}
                  className={`
                    relative aspect-square flex items-center justify-center rounded-xl text-lg font-bold transition-all duration-300 ease-out
                    border-2
                    ${isCompleted
                      ? 'text-white scale-105 z-10'
                      : 'bg-gray-50 dark:bg-gray-800/50 border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:scale-105'
                    }
                  `}
                  style={isCompleted ? {
                    backgroundColor: 'var(--color-link)',
                    borderColor: 'var(--color-link)',
                    boxShadow: '0 4px 12px color-mix(in srgb, var(--color-link), transparent 70%)'
                  } : {}}
                  aria-pressed={isCompleted}
                  aria-label={`Capítulo ${chapter}, ${isCompleted ? 'leído' : 'no leído'}`}
                >
                  {/* Check Icon Overlay */}
                  <div className={`
                    absolute top-1 right-1 transition-all duration-300
                    ${isCompleted ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-45'}
                  `}>
                    <Check className="w-3.5 h-3.5" strokeWidth={4} />
                  </div>

                  {/* Chapter Number */}
                  <span className={`transition-all duration-300 ${isCompleted ? 'scale-110' : 'scale-100'}`}>
                    {chapter}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
