import { map } from 'nanostores';

export type Theme = 'light' | 'dark' | 'sepia';
export type FontFamily = 'sans' | 'dyslexic';

export interface Preferences {
    theme: Theme;
    fontSize: number; // in px
    lineHeight: number;
    letterSpacing: number; // in em
    wordSpacing: number; // in em
    fontFamily: FontFamily;
}

export const defaultPreferences: Preferences = {
    theme: 'sepia',
    fontSize: 18,
    lineHeight: 1.6,
    letterSpacing: 0.02,
    wordSpacing: 0.16,
    fontFamily: 'dyslexic',
};

export const preferences = map<Preferences>(defaultPreferences);

// Helper to reset to defaults
export const resetPreferences = () => {
    preferences.set(defaultPreferences);
};
