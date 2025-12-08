import { useStore } from '@nanostores/preact';
import { useEffect, useState } from 'preact/hooks';
import { preferences, type Theme, resetPreferences } from '../../../stores/preferences';
import { Settings, Type, AlignJustify, MoveHorizontal, Palette, RotateCcw, X, Sun, Moon, BookOpen, Menu } from 'lucide-preact';

export default function ReaderControls() {
    const $preferences = useStore(preferences);
    const [isOpen, setIsOpen] = useState(false);

    // Sync state to DOM whenever preferences change (including resets)
    useEffect(() => {
        if (typeof document !== 'undefined') {
            const body = document.body;
            body.setAttribute('data-theme', $preferences.theme);
            body.setAttribute('data-font', $preferences.fontFamily);
            body.style.setProperty('--font-size', `${$preferences.fontSize}px`);
            body.style.setProperty('--line-height', `${$preferences.lineHeight}`);
            body.style.setProperty('--letter-spacing', `${$preferences.letterSpacing}em`);
            body.style.setProperty('--word-spacing', `${$preferences.wordSpacing}em`);
        }
    }, [$preferences]);

    const update = (key: keyof typeof $preferences, value: any) => {
        const newPrefs = { ...$preferences, [key]: value };
        preferences.set(newPrefs);

        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('bible-reader-prefs', JSON.stringify(newPrefs));
        }

        // Direct DOM update
        if (typeof document !== 'undefined') {
            const body = document.body;
            if (key === 'theme') body.setAttribute('data-theme', value);
            if (key === 'fontFamily') body.setAttribute('data-font', value);
            if (key === 'fontSize') body.style.setProperty('--font-size', `${value}px`);
            if (key === 'lineHeight') body.style.setProperty('--line-height', `${value}`);
            if (key === 'letterSpacing') body.style.setProperty('--letter-spacing', `${value}em`);
            if (key === 'wordSpacing') body.style.setProperty('--word-spacing', `${value}em`);
        }
    };

    return (
        <>
            {/* Fixed Navbar */}
            <nav className="fixed top-0 left-0 right-0 h-16 bg-theme-bg/80 backdrop-blur-md border-b border-theme-text/10 z-50 flex items-center justify-between px-4 md:px-8 transition-colors duration-300">
                <div className="flex items-center gap-3">
                    <BookOpen className="w-6 h-6 text-theme-link" />
                    <h1 className="text-xl font-bold text-theme-text font-dyslexic m-0" style={{ margin: 0 }}>Lectura Accesible</h1>
                </div>
                <button
                    onClick={() => setIsOpen(true)}
                    className="p-2 rounded-md hover:bg-theme-text/5 text-theme-text transition-colors"
                    aria-label="Abrir configuración"
                >
                    <Settings className="w-6 h-6" />
                </button>
            </nav>

            {/* Settings Sheet (Sidebar) */}
            <div className={`fixed inset-0 z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />

                {/* Panel */}
                <div className={`absolute right-0 top-0 bottom-0 w-full max-w-sm bg-theme-bg border-l border-theme-text/10 shadow-2xl transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-theme-text/10">
                        <h2 className="text-lg font-bold text-theme-text flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            Configuración
                        </h2>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 rounded-md hover:bg-theme-text/5 text-theme-text/60 hover:text-theme-text transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-8">

                        {/* Theme */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-theme-text/80">
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
                                        className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${$preferences.theme === theme.value
                                            ? 'border-theme-link bg-theme-link/10 text-theme-link'
                                            : 'border-transparent bg-theme-text/5 hover:bg-theme-text/10 text-theme-text'
                                            }`}
                                    >
                                        <theme.icon className="w-5 h-5 mb-1" />
                                        <span className="text-xs font-medium">{theme.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Font Family */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-theme-text/80">
                                <Type className="w-4 h-4" />
                                <label>Fuente</label>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => update('fontFamily', 'sans')}
                                    className={`p-3 rounded-lg border-2 transition-all font-sans ${$preferences.fontFamily === 'sans'
                                        ? 'border-theme-link bg-theme-link/10 text-theme-link'
                                        : 'border-transparent bg-theme-text/5 hover:bg-theme-text/10 text-theme-text'
                                        }`}
                                >
                                    Arial
                                </button>
                                <button
                                    onClick={() => update('fontFamily', 'dyslexic')}
                                    className={`p-3 rounded-lg border-2 transition-all font-dyslexic ${$preferences.fontFamily === 'dyslexic'
                                        ? 'border-theme-link bg-theme-link/10 text-theme-link'
                                        : 'border-transparent bg-theme-text/5 hover:bg-theme-text/10 text-theme-text'
                                        }`}
                                >
                                    Comic Sans
                                </button>
                            </div>
                        </div>

                        <div className="h-px bg-theme-text/10 my-4" />

                        {/* Sliders Section */}
                        <div className="space-y-6">
                            {/* Font Size */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm font-medium text-theme-text/80">
                                    <div className="flex items-center gap-2">
                                        <Type className="w-4 h-4" />
                                        <label>Tamaño</label>
                                    </div>
                                    <span className="text-xs bg-theme-text/10 px-2 py-0.5 rounded font-mono">{$preferences.fontSize}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="14"
                                    max="32"
                                    value={$preferences.fontSize}
                                    onInput={(e) => update('fontSize', Number((e.target as HTMLInputElement).value))}
                                    className="w-full h-2 bg-theme-text/10 rounded-lg appearance-none cursor-pointer accent-theme-link"
                                />
                            </div>

                            {/* Line Height */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm font-medium text-theme-text/80">
                                    <div className="flex items-center gap-2">
                                        <AlignJustify className="w-4 h-4" />
                                        <label>Interlineado</label>
                                    </div>
                                    <span className="text-xs bg-theme-text/10 px-2 py-0.5 rounded font-mono">{$preferences.lineHeight}</span>
                                </div>
                                <input
                                    type="range"
                                    min="1.2"
                                    max="2.5"
                                    step="0.1"
                                    value={$preferences.lineHeight}
                                    onInput={(e) => update('lineHeight', Number((e.target as HTMLInputElement).value))}
                                    className="w-full h-2 bg-theme-text/10 rounded-lg appearance-none cursor-pointer accent-theme-link"
                                />
                            </div>

                            {/* Letter Spacing */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm font-medium text-theme-text/80">
                                    <div className="flex items-center gap-2">
                                        <MoveHorizontal className="w-4 h-4" />
                                        <label>Espaciado</label>
                                    </div>
                                    <span className="text-xs bg-theme-text/10 px-2 py-0.5 rounded font-mono">{$preferences.letterSpacing}em</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="0.1"
                                    step="0.01"
                                    value={$preferences.letterSpacing}
                                    onInput={(e) => update('letterSpacing', Number((e.target as HTMLInputElement).value))}
                                    className="w-full h-2 bg-theme-text/10 rounded-lg appearance-none cursor-pointer accent-theme-link"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-theme-text/10 bg-theme-text/5">
                        <button
                            onClick={resetPreferences}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-theme-text text-theme-bg font-bold rounded-lg hover:opacity-90 transition-opacity shadow-sm"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Restaurar Valores
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
