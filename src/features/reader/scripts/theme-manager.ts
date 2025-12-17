import type { Preferences } from '../../../stores/preferences';

export const applyThemeToDocument = (prefs: Preferences) => {
    if (typeof document === 'undefined') return;

    const body = document.body;
    if (!body) return;

    body.setAttribute('data-theme', prefs.theme);
    body.setAttribute('data-font', prefs.fontFamily);
    body.style.setProperty('--font-size', `${prefs.fontSize}px`);
    body.style.setProperty('--line-height', `${prefs.lineHeight}`);
    body.style.setProperty('--letter-spacing', `${prefs.letterSpacing}em`);
    body.style.setProperty('--word-spacing', `${prefs.wordSpacing}em`);
};
