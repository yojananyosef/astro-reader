import { useStore } from '@nanostores/preact';
import { useEffect } from 'preact/hooks';
import { preferences, type Theme, type FontFamily, resetPreferences } from '../../../stores/preferences';

export default function SettingsPanel() {
    const $preferences = useStore(preferences);

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

        // Direct DOM update to ensure immediate feedback
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
        <div style={{
            padding: '1rem',
            borderBottom: '1px solid var(--color-text)',
            marginBottom: '2rem',
            backgroundColor: 'rgba(0,0,0,0.05)'
        }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>

                {/* Theme */}
                <div>
                    <label style={{ display: 'block', fontWeight: 'bold' }}>Tema</label>
                    <select
                        value={$preferences.theme}
                        onChange={(e) => update('theme', (e.target as HTMLSelectElement).value as Theme)}
                        style={{ padding: '0.5rem' }}
                    >
                        <option value="light">Claro (Marfil)</option>
                        <option value="dark">Oscuro</option>
                        <option value="sepia">Sepia</option>
                    </select>
                </div>

                {/* Font Size */}
                <div>
                    <label style={{ display: 'block', fontWeight: 'bold' }}>Tamaño ({$preferences.fontSize}px)</label>
                    <input
                        type="range"
                        min="14"
                        max="32"
                        value={$preferences.fontSize}
                        onInput={(e) => update('fontSize', Number((e.target as HTMLInputElement).value))}
                    />
                </div>

                {/* Line Height */}
                <div>
                    <label style={{ display: 'block', fontWeight: 'bold' }}>Interlineado ({$preferences.lineHeight})</label>
                    <input
                        type="range"
                        min="1.2"
                        max="2.5"
                        step="0.1"
                        value={$preferences.lineHeight}
                        onInput={(e) => update('lineHeight', Number((e.target as HTMLInputElement).value))}
                    />
                </div>

                {/* Letter Spacing */}
                <div>
                    <label style={{ display: 'block', fontWeight: 'bold' }}>Espaciado Letras</label>
                    <input
                        type="range"
                        min="0"
                        max="0.1"
                        step="0.01"
                        value={$preferences.letterSpacing}
                        onInput={(e) => update('letterSpacing', Number((e.target as HTMLInputElement).value))}
                    />
                </div>

                {/* Font Family */}
                <div>
                    <label style={{ display: 'block', fontWeight: 'bold' }}>Fuente</label>
                    <select
                        value={$preferences.fontFamily}
                        onChange={(e) => update('fontFamily', (e.target as HTMLSelectElement).value as FontFamily)}
                        style={{ padding: '0.5rem' }}
                    >
                        <option value="sans">Sans Serif (Arial/Verdana)</option>
                        <option value="dyslexic">OpenDyslexic / Comic Sans</option>
                    </select>
                </div>

                <button
                    onClick={resetPreferences}
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: 'var(--color-text)',
                        color: 'var(--color-bg)',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    Resetear
                </button>

            </div>
        </div>
    );
}
