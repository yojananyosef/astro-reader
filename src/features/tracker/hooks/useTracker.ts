import { useState, useEffect, useCallback } from 'preact/hooks';
import booksData from '../../../data/books-index.json';

export type Book = {
  code: string;
  name: string;
  chapters: number;
  section: string;
};

type CompletedChapters = {
  [bookCode: string]: number[];
};

const STORAGE_KEY = 'bible-tracker-progress';

export function useTracker() {
  const [completedChapters, setCompletedChapters] = useState<CompletedChapters>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCompletedChapters(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading tracker progress:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completedChapters));
    }
  }, [completedChapters, isLoading]);

  const toggleChapter = useCallback((bookCode: string, chapter: number) => {
    setCompletedChapters((prev) => {
      const currentBookChapters = prev[bookCode] || [];
      const isCompleted = currentBookChapters.includes(chapter);

      let newBookChapters;
      if (isCompleted) {
        newBookChapters = currentBookChapters.filter((c) => c !== chapter);
      } else {
        newBookChapters = [...currentBookChapters, chapter];
      }

      return {
        ...prev,
        [bookCode]: newBookChapters,
      };
    });
  }, []);

  const isChapterCompleted = useCallback((bookCode: string, chapter: number) => {
    return completedChapters[bookCode]?.includes(chapter) || false;
  }, [completedChapters]);

  const getBookProgress = useCallback((bookCode: string) => {
    const book = booksData.find((b) => b.code === bookCode);
    if (!book) return 0;
    const completedCount = completedChapters[bookCode]?.length || 0;
    return Math.round((completedCount / book.chapters) * 100);
  }, [completedChapters]);

  const getTotalProgress = useCallback(() => {
    const totalChapters = booksData.reduce((acc, book) => acc + book.chapters, 0);
    const totalCompleted = Object.values(completedChapters).reduce(
      (acc, chapters) => acc + chapters.length,
      0
    );
    return Math.round((totalCompleted / totalChapters) * 100);
  }, [completedChapters]);

  const resetProgress = useCallback(() => {
    if (confirm('¿Estás seguro de que quieres reiniciar todo tu progreso? Esta acción no se puede deshacer.')) {
      setCompletedChapters({});
    }
  }, []);

  return {
    completedChapters,
    isLoading,
    toggleChapter,
    isChapterCompleted,
    getBookProgress,
    getTotalProgress,
    resetProgress,
    books: booksData as Book[],
  };
}
