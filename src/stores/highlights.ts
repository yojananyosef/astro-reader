import { map } from 'nanostores';

interface HighlightState {
    [key: string]: boolean;
}

export const highlights = map<HighlightState>({});

const HIGHLIGHTS_STORAGE_KEY = 'bible-reader-highlights';

if (typeof localStorage !== 'undefined') {
    try {
        const stored = localStorage.getItem(HIGHLIGHTS_STORAGE_KEY);
        if (stored) {
            highlights.set(JSON.parse(stored));
        }
    } catch (e) {
        console.error('Error loading highlights', e);
    }
}

// Sync with localStorage
highlights.subscribe((value) => {
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem(HIGHLIGHTS_STORAGE_KEY, JSON.stringify(value));
    }
});

export function toggleHighlight(verseId: string) {
    const current = highlights.get();
    if (current[verseId]) {
        const { [verseId]: _, ...rest } = current;
        highlights.set(rest);
    } else {
        highlights.setKey(verseId, true);
    }
}
