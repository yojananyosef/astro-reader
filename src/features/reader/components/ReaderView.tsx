import { useState, useEffect, useMemo } from 'preact/hooks';
import { ArrowLeft, ArrowRight, BookOpen, Library, Info, EyeOff, Eye } from "lucide-preact";
import booksIndex from "../../../data/books-index.json";
import { highlights, toggleHighlight } from "../../../stores/highlights";
import { lastBiblePosition } from "../../../stores/navigation";
import { useStore } from '@nanostores/preact';

interface Verse {
    number: string;
    text: string;
    noteIndices: number[];
    isHighlighted: boolean;
}

export default function ReaderView() {
    const [bookData, setBookData] = useState<any>(null);
    const [commentaryData, setCommentaryData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'full' | 'partial'>('full');
    const $highlights = useStore(highlights);

    // Get params from URL
    const [activeNote, setActiveNote] = useState<string | null>(null);
    const [params, setParams] = useState({ book: 'gen', chapter: '1', verses: '' });

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash;
            if (hash.startsWith('#note-') || hash.startsWith('#v-')) {
                setActiveNote(hash.substring(1));
            } else {
                setActiveNote(null);
            }
        };

        handleHashChange();
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    useEffect(() => {
        const updateParams = () => {
            const searchParams = new URLSearchParams(window.location.search);
            setParams({ 
                book: searchParams.get('book') || 'gen',
                chapter: searchParams.get('chapter') || '1',
                verses: searchParams.get('verses') || ''
            });
        };

        updateParams();
        // Escuchar cambios en la URL (por si acaso con View Transitions)
        window.addEventListener('popstate', updateParams);
        return () => window.removeEventListener('popstate', updateParams);
    }, []);

    const { book: bookKey, chapter: chapterKey, verses: versesRange } = params;
    const currentBookEntry = useMemo(() => {
        return booksIndex.find((b) => b.code === bookKey) || booksIndex[0];
    }, [bookKey]);

    useEffect(() => {
        let isMounted = true;
        async function loadData() {
            setLoading(true);
            try {
                const bookCode = currentBookEntry.code;
                console.log(`Cargando datos para ${bookCode} capítulo ${chapterKey}`);
                
                // Usar rutas relativas a la raíz para mayor compatibilidad
                const [bookRes, commRes] = await Promise.all([
                    fetch(`/data/books/${bookCode}.json`),
                    fetch(`/data/commentary/${bookCode}.json`).catch(() => null)
                ]);

                if (!isMounted) return;

                if (bookRes.ok) {
                    const data = await bookRes.json();
                    setBookData(data);
                } else {
                    console.error(`Error al cargar libro: ${bookRes.status}`);
                    setBookData(null);
                }

                if (commRes && commRes.ok) {
                    const data = await commRes.json();
                    setCommentaryData(data);
                } else {
                    setCommentaryData(null);
                }

                // Save last position
                lastBiblePosition.set({ lastBook: bookKey, lastChapter: chapterKey });
            } catch (e) {
                console.error("Error loading reader data:", e);
                if (isMounted) setBookData(null);
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        loadData();
        return () => { isMounted = false; };
    }, [currentBookEntry.code, chapterKey]);

    const safeParseInt = (s: string) => {
        const n = parseInt(s, 10);
        return isNaN(n) ? null : n;
    };

    const currentChapNum = safeParseInt(chapterKey) || 1;
    const bookChaptersCount = currentBookEntry.chapters;
    const currentBookIndex = booksIndex.findIndex((b) => b.code === currentBookEntry.code);

    const prevLink = useMemo(() => {
        if (currentChapNum > 1) return `/?book=${bookKey}&chapter=${currentChapNum - 1}`;
        if (currentBookIndex > 0) {
            const prevBook = booksIndex[currentBookIndex - 1];
            return `/?book=${prevBook.code}&chapter=${prevBook.chapters}`;
        }
        return null;
    }, [bookKey, currentChapNum, currentBookIndex]);

    const nextLink = useMemo(() => {
        if (currentChapNum < bookChaptersCount) return `/?book=${bookKey}&chapter=${currentChapNum + 1}`;
        if (currentBookIndex < booksIndex.length - 1) {
            const nextBook = booksIndex[currentBookIndex + 1];
            return `/?book=${nextBook.code}&chapter=1`;
        }
        return null;
    }, [bookKey, currentChapNum, bookChaptersCount, currentBookIndex]);

    const parseVerseRange = (range: string): number[] => {
        const result: number[] = [];
        if (!range) return result;
        const parts = range.split(",");
        parts.forEach((part) => {
            if (part.includes("-")) {
                const [start, end] = part.split("-").map(Number);
                for (let i = start; i <= end; i++) result.push(i);
            } else {
                const n = Number(part);
                if (!isNaN(n)) result.push(n);
            }
        });
        return result;
    };

    const requiredVerses = useMemo(() => parseVerseRange(versesRange), [versesRange]);
    const chapterData = bookData?.capitulo?.[chapterKey] || {};

    const processedData = useMemo(() => {
        const footnotes: string[] = [];
        let noteCounter = 1;
        
        const versesList = Object.entries(chapterData)
            .map(([num, content]) => {
                let text = "";
                let verseNotes: number[] = [];

                if (typeof content === "string") {
                    text = content;
                } else if (typeof content === "object" && content !== null) {
                    text = (content as any).texto || "";
                    const notes = (content as any).notas as string[] | undefined;
                    if (notes && Array.isArray(notes)) {
                        notes.forEach((note) => {
                            footnotes.push(note);
                            verseNotes.push(noteCounter++);
                        });
                    }
                }

                const verseNum = parseInt(num);
                const isHighlighted = requiredVerses.length > 0 && requiredVerses.includes(verseNum);

                return {
                    number: num,
                    text,
                    noteIndices: verseNotes,
                    isHighlighted,
                };
            })
            .sort((a, b) => parseInt(a.number) - parseInt(b.number));

        return { versesList, footnotes };
    }, [chapterData, requiredVerses]);

    const { versesList, footnotes } = processedData;
    const highlightedCount = versesList.filter((v) => v.isHighlighted).length;

    const currentCommentaryChapter = commentaryData?.chapters?.find(
        (c: any) => c.chapter === currentChapNum
    );
    const currentChapterCommentaryVerses = currentCommentaryChapter?.verses || [];

    useEffect(() => {
        if (!loading && activeNote) {
            const scrollWithRetry = (retries = 5) => {
                const element = document.getElementById(activeNote);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    
                    setTimeout(() => {
                        const rect = element.getBoundingClientRect();
                        if (Math.abs(rect.top - 112) > 50) { // 112px es el scroll-mt-28
                            const top = rect.top + window.pageYOffset - 112;
                            window.scrollTo({ top, behavior: 'smooth' });
                        }
                    }, 500);
                } else if (retries > 0) {
                    setTimeout(() => scrollWithRetry(retries - 1), 200);
                }
            };
            
            const timer = setTimeout(() => scrollWithRetry(), 100);
            return () => clearTimeout(timer);
        }
    }, [loading, activeNote]);

    if (loading) {
        return (
            <div class="flex items-center justify-center min-h-[50vh]">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-link)]"></div>
            </div>
        );
    }

    if (!bookData) {
        return (
            <div class="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
                <Info class="w-12 h-12 text-red-500 mb-4 opacity-50" />
                <h2 class="text-xl font-bold mb-2">Error al cargar el contenido</h2>
                <p class="opacity-70 mb-6">No pudimos encontrar los datos para {currentBookEntry.name}.</p>
                <button 
                    onClick={() => window.location.reload()}
                    class="px-4 py-2 bg-[var(--color-link)] text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    const filteredVerses = viewMode === 'partial' ? versesList.filter(v => v.isHighlighted) : versesList;

    return (
        <article class="reader-content max-w-3xl mx-auto pb-32 px-4 md:px-0 relative">
            <div class="mb-8 text-center">
                <h1 class="text-3xl md:text-4xl font-bold text-[var(--color-link)] mb-2">
                    {bookData?.nombre || currentBookEntry.name} {chapterKey}
                </h1>
                {versesRange && (
                    <div class="flex flex-wrap items-center justify-center gap-3 mt-4">
                        <div class="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--color-link)] text-[var(--color-link)] bg-[var(--color-link)]/5">
                            <Info class="w-4 h-4" />
                            <span class="text-sm font-medium">
                                Plan de lectura: versículos {versesRange}
                            </span>
                        </div>
                        <span class="text-sm opacity-60">
                            {highlightedCount} de {versesList.length} versículos
                        </span>
                        <button
                            onClick={() => setViewMode(viewMode === 'full' ? 'partial' : 'full')}
                            class="text-sm px-3 py-1.5 rounded-md border border-theme-text/20 hover:bg-theme-text/5 transition-colors flex items-center gap-2"
                        >
                            <span>{viewMode === 'full' ? 'Ver solo requeridos' : 'Ver todo el capítulo'}</span>
                            {viewMode === 'full' ? <EyeOff class="w-4 h-4" /> : <Eye class="w-4 h-4" />}
                        </button>
                    </div>
                )}
            </div>

            {versesRange && (
                <div class="mb-8 p-4 rounded-xl border border-[var(--color-link)]/30 bg-[var(--color-link)]/5 flex gap-4 items-start animate-fade-in">
                    <div class="p-2 rounded-lg bg-[var(--color-link)] text-white shrink-0">
                        <BookOpen class="w-5 h-5" />
                    </div>
                    <div class="text-left">
                        <h3 class="font-bold text-[var(--color-link)]">Guía de lectura</h3>
                        <p class="text-sm opacity-80 leading-relaxed">
                            Estás siguiendo un plan de lectura. Los versículos resaltados son los asignados para hoy. 
                            Puedes cambiar a "Vista Parcial" para enfocarte solo en ellos.
                        </p>
                    </div>
                </div>
            )}

            {prevLink && (
                <a href={prevLink} class="nav-arrow nav-arrow-prev fixed top-1/2 -translate-y-1/2 z-40 visible" aria-label="Capítulo Anterior">
                    <ArrowLeft class="w-5 h-5" />
                </a>
            )}

            {nextLink && (
                <a href={nextLink} class="nav-arrow nav-arrow-next fixed top-1/2 -translate-y-1/2 z-40 visible" aria-label="Capítulo Siguiente">
                    <ArrowRight class="w-5 h-5" />
                </a>
            )}

            <div class="verses space-y-4">
                {filteredVerses.map((verse) => {
                    const verseId = `${bookKey}-${chapterKey}-${verse.number}`;
                    const isGlobalHighlighted = $highlights[verseId];
                    
                    return (
                        <p
                            key={verse.number}
                            id={`v-${verse.number}`}
                            onClick={() => toggleHighlight(verseId)}
                            class={`relative p-2 -mx-2 rounded transition-all cursor-pointer verse-item 
                                ${verse.isHighlighted ? "is-plan-highlighted" : ""} 
                                ${isGlobalHighlighted ? 'is-user-highlighted' : ''} 
                                ${activeNote === `v-${verse.number}` ? 'verse-selected' : ''}
                            `}
                            style={{ color: 'var(--color-text)' }}
                        >
                            <sup class={`text-xs font-bold mr-1 ${verse.isHighlighted ? "text-[var(--color-link)] opacity-100" : "opacity-40"}`}>
                                {verse.number}
                            </sup>
                            <span class={verse.isHighlighted ? "font-medium" : ""}>
                                {verse.text}
                            </span>
                            {currentChapterCommentaryVerses.some((c: any) => c.verse === parseInt(verse.number)) && (
                                <a
                                    href={`/commentary?book=${bookKey}&chapter=${chapterKey}#com-${verse.number}`}
                                    class="ml-1 text-[var(--color-link)] opacity-60 hover:opacity-100 transition-opacity inline-flex items-center align-middle"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Library class="w-3.5 h-3.5" />
                                </a>
                            )}
                            {verse.noteIndices.map((idx) => (
                                <a
                                    key={idx}
                                    href={`#note-${idx}`}
                                    class="ml-0.5 text-[var(--color-link)] font-bold cursor-pointer no-underline hover:underline text-xs align-super"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    [{idx}]
                                </a>
                            ))}
                        </p>
                    );
                })}
            </div>

            {footnotes.length > 0 && (
                <div class="mt-16 pt-8 border-t border-theme-text/20" id="footnotes">
                    <h3 class="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)', opacity: 0.8 }}>
                        <BookOpen class="w-5 h-5" />
                        Notas del Capítulo
                    </h3>
                    <ol class="list-none space-y-3 reader-text opacity-80" style={{ color: 'var(--color-text)' }}>
                        {footnotes.map((note, idx) => (
                            <li key={idx} id={`note-${idx + 1}`} class={`pl-2 flex gap-2 group p-2 hover:bg-theme-text/5 rounded transition-colors scroll-mt-28 ${activeNote === `note-${idx + 1}` ? 'note-selected shadow-sm' : ''}`}>
                                <span class="font-bold text-[var(--color-link)] shrink-0">[{idx + 1}]</span>
                                <span>{note}</span>
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </article>
    );
}
