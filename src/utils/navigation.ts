import booksIndex from "../data/books-index.json";

export interface NavigationTarget {
    book: string;
    chapter: number;
    verse?: number;
}

export function getNextChapter(bookCode: string, chapter: number): NavigationTarget | null {
    const bookIndex = booksIndex.findIndex(b => b.code === bookCode);
    if (bookIndex === -1) return null;

    const book = booksIndex[bookIndex];
    if (chapter < book.chapters) {
        return { book: bookCode, chapter: chapter + 1 };
    }

    if (bookIndex < booksIndex.length - 1) {
        const nextBook = booksIndex[bookIndex + 1];
        return { book: nextBook.code, chapter: 1 };
    }

    return null;
}

export function getPrevChapter(bookCode: string, chapter: number): NavigationTarget | null {
    const bookIndex = booksIndex.findIndex(b => b.code === bookCode);
    if (bookIndex === -1) return null;

    if (chapter > 1) {
        return { book: bookCode, chapter: chapter - 1 };
    }

    if (bookIndex > 0) {
        const prevBook = booksIndex[bookIndex - 1];
        return { book: prevBook.code, chapter: prevBook.chapters };
    }

    return null;
}

export function getNextVerse(bookCode: string, chapter: number, verse: number, totalChapters: number, chapterVersesCount: number): NavigationTarget | null {
    if (verse < chapterVersesCount) {
        return { book: bookCode, chapter, verse: verse + 1 };
    }

    if (chapter < totalChapters) {
        return { book: bookCode, chapter: chapter + 1, verse: 1 };
    }

    // No pasamos al siguiente libro en el interlineal por ahora, 
    // pero podríamos si quisiéramos. El código actual no lo hace.
    return null;
}

export function getPrevVerse(bookCode: string, chapter: number, verse: number): NavigationTarget | null {
    if (verse > 1) {
        return { book: bookCode, chapter, verse: verse - 1 };
    }

    if (chapter > 1) {
        // Aquí necesitaríamos saber cuántos versículos tiene el capítulo anterior 
        // para ir al último versículo. El código actual solo va al versículo 1.
        return { book: bookCode, chapter: chapter - 1, verse: 1 };
    }

    return null;
}
