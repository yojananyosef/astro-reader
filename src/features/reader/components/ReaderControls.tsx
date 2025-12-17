import { useStore } from '@nanostores/preact';
import { useEffect, useState } from 'preact/hooks';
import { preferences, type Theme, resetPreferences, type Preferences, PREFS_STORAGE_KEY } from '../../../stores/preferences';
import { Settings, Type, AlignJustify, MoveHorizontal, Palette, RotateCcw, X, Sun, Moon, BookOpen, Menu, ChevronRight, Ruler, Play, Square, MessageSquare, Quote, Check } from 'lucide-preact';
import ReaderRuler from './ReaderRuler';
import { useTTS } from '../hooks/useTTS';
import { applyThemeToDocument } from '../scripts/theme-manager';

interface Book {
    code: string;
    name: string;
    chapters: number;
}

interface ReaderControlsProps {
    books?: Book[];
}

export default function ReaderControls({ books = [] }: ReaderControlsProps) {
    const $preferences = useStore(preferences);
    const [isOpen, setIsOpen] = useState(false);
    const { isPlaying, play, stop, setRate } = useTTS();

    // Sync state to DOM whenever preferences change (including resets)
    useEffect(() => {
        applyThemeToDocument($preferences);
    }, [$preferences]);

    // Update rate from prefs
    useEffect(() => {
        setRate($preferences.speechRate);
    }, [$preferences.speechRate]);

    const update = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
        const newPrefs: Preferences = { ...$preferences, [key]: value } as Preferences;
        preferences.set(newPrefs);

        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(newPrefs));
        }

        // DOM update is handled by the useEffect above
    };

    const [view, setView] = useState<'settings' | 'books' | 'chapters'>('settings');
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);

    // Reset view when closing
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setView('settings');
                setSelectedBook(null);
            }, 300);
        }
    }, [isOpen]);

    const navigateToChapter = (chapter: number) => {
        if (selectedBook) {
            window.location.href = `/?book=${selectedBook.code}&chapter=${chapter}`;
            setIsOpen(false);
        }
    };

    return (
        <>
            <ReaderRuler />

            {/* Fixed Navbar */}
            <nav
                className="fixed top-0 left-0 right-0 h-16 border-b border-theme-text/10 z-50 flex items-center justify-between px-4 md:px-8 transition-colors duration-300"
                style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
            >
                <div className="flex items-center gap-3">
                    <BookOpen className="w-6 h-6 text-[var(--color-link)]" />
                    <h1 className="text-xl font-bold text-[var(--color-link)] m-0" style={{ margin: 0 }}>Lectura Accesible</h1>
                </div>
                <div className="flex gap-2">
                    {/* Quick TTS Toggle */}
                    <button
                        onClick={() => isPlaying ? stop() : play()}
                        className={`p-2 rounded-md transition-colors ${isPlaying ? 'bg-theme-link/10 text-theme-link' : 'hover:bg-theme-text/5 text-theme-text'}`}
                        aria-label={isPlaying ? "Detener lectura" : "Leer en voz alta"}
                    >
                        {isPlaying ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5" />}
                    </button>

                    <button
                        onClick={() => {
                            setView('books');
                            setIsOpen(true);
                        }}
                        className="p-2 rounded-md hover:bg-theme-text/5 text-theme-text transition-colors flex items-center gap-2"
                        aria-label="Abrir navegación"
                    >
                        <Menu className="w-6 h-6" />
                        <span className="hidden md:inline text-sm font-semibold">Libros</span>
                    </button>
                    <button
                        onClick={() => {
                            setView('settings');
                            setIsOpen(true);
                        }}
                        className="p-2 rounded-md hover:bg-theme-text/5 text-theme-text transition-colors"
                        aria-label="Abrir configuración"
                    >
                        <Settings className="w-6 h-6" />
                    </button>
                </div>
            </nav>

            {/* Settings Sheet (Sidebar) */}
            <div className={`fixed inset-0 z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />

                {/* Panel */}
                <div
                    className={`absolute right-0 top-0 bottom-0 w-full max-w-sm border-l border-theme-text/10 shadow-2xl transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                    style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                >

                    {/* Header */}
                    <div
                        className="flex items-center justify-between p-6 border-b"
                        style={{ borderColor: 'color-mix(in srgb, var(--color-text), transparent 90%)' }}
                    >
                        <div className="flex items-center gap-2">
                            {view === 'chapters' && (
                                <button
                                    onClick={() => setView('books')}
                                    className="mr-2 hover:opacity-70 transition-opacity"
                                >
                                    <ChevronRight className="w-5 h-5 rotate-180" />
                                </button>
                            )}
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                {view === 'settings' && <><Settings className="w-5 h-5" /> Configuración</>}
                                {view === 'books' && <><BookOpen className="w-5 h-5" /> Libros</>}
                                {view === 'chapters' && selectedBook?.name}
                            </h2>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 rounded-md transition-colors"
                            style={{ backgroundColor: 'transparent' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-text), transparent 95%)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">

                        {/* VIEW: SETTINGS */}
                        {view === 'settings' && (
                            <div className="space-y-8">
                                {/* Accessibility Tools */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm font-medium opacity-80">
                                        <Ruler className="w-4 h-4" />
                                        <label>Herramientas de Lectura</label>
                                    </div>

                                    {/* Ruler Toggle */}
                                    <div
                                        className="flex items-center justify-between p-3 rounded-lg border surface-card"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Ruler className="w-5 h-5 opacity-60" />
                                            <span className="font-medium text-sm">Guía de Lectura</span>
                                        </div>
                                        <button
                                            onClick={() => update('rulerEnabled', !$preferences.rulerEnabled)}
                                            className="w-11 h-6 rounded-full transition-all duration-200 relative shadow-inner"
                                            style={{
                                                backgroundColor: $preferences.rulerEnabled ? 'var(--color-link)' : 'color-mix(in srgb, var(--color-text), transparent 75%)',
                                                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
                                            }}
                                            aria-checked={$preferences.rulerEnabled}
                                            role="switch"
                                        >
                                            <div
                                                className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full shadow-md transition-all duration-200 ${$preferences.rulerEnabled ? 'left-[22px]' : 'left-0.5'}`}
                                                style={{
                                                    backgroundColor: 'var(--color-bg)',
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                                }}
                                            />
                                        </button>
                                    </div>

                                    {/* Audio Speed */}
                                    <div className="space-y-2 p-3 rounded-lg border surface-card">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Play className="w-5 h-5 opacity-60" style={{ color: 'var(--color-text)' }} />
                                                <span className="font-medium text-sm">Velocidad de Voz</span>
                                            </div>
                                            <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--surface-muted-border)' }}>x{$preferences.speechRate}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.5"
                                            max="2"
                                            step="0.1"
                                            value={$preferences.speechRate}
                                            onInput={(e) => update('speechRate', Number((e.target as HTMLInputElement).value))}
                                            className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[var(--color-link)]"
                                            style={{ backgroundColor: 'var(--surface-muted-border)' }}
                                        />
                                    </div>

                                    {/* Skip Options */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => update('skipVerses', !$preferences.skipVerses)}
                                            className="p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all"
                                            style={{
                                                borderColor: $preferences.skipVerses ? 'var(--color-link)' : 'color-mix(in srgb, var(--color-text), transparent 90%)',
                                                backgroundColor: $preferences.skipVerses ? 'color-mix(in srgb, var(--color-link), transparent 90%)' : 'color-mix(in srgb, var(--color-text), transparent 95%)',
                                                color: $preferences.skipVerses ? 'var(--color-link)' : 'var(--color-text)'
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Quote className="w-5 h-5" />
                                                {$preferences.skipVerses && <Check className="w-4 h-4" />}
                                            </div>
                                            <span className="text-xs font-medium">Saltar Versos</span>
                                        </button>
                                        <button
                                            onClick={() => update('skipFootnotes', !$preferences.skipFootnotes)}
                                            className="p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all"
                                            style={{
                                                borderColor: $preferences.skipFootnotes ? 'var(--color-link)' : 'color-mix(in srgb, var(--color-text), transparent 90%)',
                                                backgroundColor: $preferences.skipFootnotes ? 'color-mix(in srgb, var(--color-link), transparent 90%)' : 'color-mix(in srgb, var(--color-text), transparent 95%)',
                                                color: $preferences.skipFootnotes ? 'var(--color-link)' : 'var(--color-text)'
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <MessageSquare className="w-5 h-5" />
                                                {$preferences.skipFootnotes && <Check className="w-4 h-4" />}
                                            </div>
                                            <span className="text-xs font-medium">Saltar Notas</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="h-px bg-theme-text/10 my-4" />

                                {/* Theme */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm font-medium opacity-80">
                                        <Palette className="w-4 h-4" />
                                        <label>Tema</label>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { value: 'light', label: 'Claro', icon: Sun },
                                            { value: 'dark', label: 'Oscuro', icon: Moon },
                                            { value: 'sepia', label: 'Sepia', icon: BookOpen },
                                        ].map((theme) => (
                                            <button
                                                key={theme.value}
                                                onClick={() => update('theme', theme.value as Theme)}
                                                className="flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all"
                                                style={{
                                                    borderColor: $preferences.theme === theme.value ? 'var(--color-link)' : 'transparent',
                                                    backgroundColor: $preferences.theme === theme.value ? 'color-mix(in srgb, var(--color-link), transparent 90%)' : 'color-mix(in srgb, var(--color-text), transparent 95%)',
                                                    color: $preferences.theme === theme.value ? 'var(--color-link)' : 'var(--color-text)'
                                                }}
                                            >
                                                <theme.icon className="w-5 h-5 mb-1" />
                                                <span className="text-xs font-medium">{theme.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Font Family */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm font-medium opacity-80">
                                        <Type className="w-4 h-4" />
                                        <label>Fuente</label>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => update('fontFamily', 'sans')}
                                            className="p-3 rounded-lg border-2 transition-all font-sans"
                                            style={{
                                                borderColor: $preferences.fontFamily === 'sans' ? 'var(--color-link)' : 'transparent',
                                                backgroundColor: $preferences.fontFamily === 'sans' ? 'color-mix(in srgb, var(--color-link), transparent 90%)' : 'color-mix(in srgb, var(--color-text), transparent 95%)',
                                                color: $preferences.fontFamily === 'sans' ? 'var(--color-link)' : 'var(--color-text)'
                                            }}
                                        >
                                            Arial
                                        </button>
                                        <button
                                            onClick={() => update('fontFamily', 'dyslexic')}
                                            className="p-3 rounded-lg border-2 transition-all font-dyslexic"
                                            style={{
                                                borderColor: $preferences.fontFamily === 'dyslexic' ? 'var(--color-link)' : 'transparent',
                                                backgroundColor: $preferences.fontFamily === 'dyslexic' ? 'color-mix(in srgb, var(--color-link), transparent 90%)' : 'color-mix(in srgb, var(--color-text), transparent 95%)',
                                                color: $preferences.fontFamily === 'dyslexic' ? 'var(--color-link)' : 'var(--color-text)'
                                            }}
                                        >
                                            OpenDyslexic
                                        </button>
                                    </div>
                                </div>

                                <div className="h-px bg-theme-text/10 my-4" />

                                {/* Sliders Section */}
                                <div className="space-y-6">
                                    {/* Font Size */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm font-medium opacity-80">
                                            <div className="flex items-center gap-2">
                                                <Type className="w-4 h-4" />
                                                <label>Tamaño</label>
                                            </div>
                                            <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ backgroundColor: 'color-mix(in srgb, var(--color-text), transparent 90%)' }}>{$preferences.fontSize}px</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="14"
                                            max="32"
                                            value={$preferences.fontSize}
                                            onInput={(e) => update('fontSize', Number((e.target as HTMLInputElement).value))}
                                            className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[var(--color-link)]"
                                            style={{ backgroundColor: 'color-mix(in srgb, var(--color-text), transparent 90%)' }}
                                        />
                                    </div>

                                    {/* Line Height */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm font-medium opacity-80">
                                            <div className="flex items-center gap-2">
                                                <AlignJustify className="w-4 h-4" />
                                                <label>Interlineado</label>
                                            </div>
                                            <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ backgroundColor: 'color-mix(in srgb, var(--color-text), transparent 90%)' }}>{$preferences.lineHeight}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1.2"
                                            max="2.5"
                                            step="0.1"
                                            value={$preferences.lineHeight}
                                            onInput={(e) => update('lineHeight', Number((e.target as HTMLInputElement).value))}
                                            className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[var(--color-link)]"
                                            style={{ backgroundColor: 'color-mix(in srgb, var(--color-text), transparent 90%)' }}
                                        />
                                    </div>

                                    {/* Letter Spacing */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm font-medium opacity-80">
                                            <div className="flex items-center gap-2">
                                                <MoveHorizontal className="w-4 h-4" />
                                                <label>Espaciado</label>
                                            </div>
                                            <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ backgroundColor: 'color-mix(in srgb, var(--color-text), transparent 90%)' }}>{$preferences.letterSpacing}em</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="0.1"
                                            step="0.01"
                                            value={$preferences.letterSpacing}
                                            onInput={(e) => update('letterSpacing', Number((e.target as HTMLInputElement).value))}
                                            className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[var(--color-link)]"
                                            style={{ backgroundColor: 'color-mix(in srgb, var(--color-text), transparent 90%)' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* VIEW: BOOKS */}
                        {view === 'books' && (
                            <div className="space-y-2">
                                {books.map((book) => (
                                    <button
                                        key={book.code}
                                        onClick={() => {
                                            setSelectedBook(book);
                                            setView('chapters');
                                        }}
                                        className="w-full text-left p-3 rounded-lg flex items-center justify-between group transition-colors"
                                        style={{ backgroundColor: 'transparent' }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-text), transparent 95%)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <span className="font-medium">{book.name}</span>
                                        <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-60" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* VIEW: CHAPTERS */}
                        {view === 'chapters' && selectedBook && (
                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                                {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((chapter) => (
                                    <button
                                        key={chapter}
                                        onClick={() => navigateToChapter(chapter)}
                                        className="p-3 rounded-lg font-medium text-center transition-colors"
                                        style={{ backgroundColor: 'color-mix(in srgb, var(--color-text), transparent 95%)' }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-text), transparent 90%)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-text), transparent 95%)'}
                                    >
                                        {chapter}
                                    </button>
                                ))}
                            </div>
                        )}

                    </div>

                    {/* Footer - Only settings */}
                    {view === 'settings' && (
                        <div
                            className="p-6 border-t"
                            style={{
                                borderColor: 'color-mix(in srgb, var(--color-text), transparent 90%)',
                                backgroundColor: 'color-mix(in srgb, var(--color-text), transparent 95%)'
                            }}
                        >
                            <button
                                onClick={resetPreferences}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 font-bold rounded-lg hover:opacity-90 transition-opacity shadow-sm"
                                style={{ backgroundColor: 'var(--color-text)', color: 'var(--color-bg)' }}
                            >
                                <RotateCcw className="w-4 h-4" />
                                Restaurar valores
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
