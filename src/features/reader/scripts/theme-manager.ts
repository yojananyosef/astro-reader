import { preferences } from '../../../stores/preferences';

export function initThemeManager() {
    console.log('ThemeManager: Initializing');

    const applyPreferences = (prefs: any) => {
        console.log('ThemeManager: Applying prefs', prefs);
        const body = document.body;
        if (!body) return;

        body.setAttribute('data-theme', prefs.theme);
        body.setAttribute('data-font', prefs.fontFamily);
        body.style.setProperty('--font-size', `${prefs.fontSize}px`);
        body.style.setProperty('--line-height', `${prefs.lineHeight}`);
        body.style.setProperty('--letter-spacing', `${prefs.letterSpacing}em`);
        body.style.setProperty('--word-spacing', `${prefs.wordSpacing}em`);
    };

    // Listen for updates from the React component
    window.addEventListener('bible-preferences-changed', (e: any) => {
        applyPreferences(e.detail);
    });

    // Also try to subscribe to the store directly as a backup/init
    preferences.subscribe(applyPreferences);
}
