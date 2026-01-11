import { persistentAtom } from '@nanostores/persistent';

interface NavigationState {
    lastBook: string;
    lastChapter: string;
}

// Store para la posición de lectura de la Biblia
export const lastBiblePosition = persistentAtom<NavigationState>(
    'bible-last-position',
    { lastBook: 'gen', lastChapter: '1' },
    {
        encode: JSON.stringify,
        decode: JSON.parse,
    }
);

// Store para la posición del Comentario
export const lastCommentaryPosition = persistentAtom<NavigationState>(
    'commentary-last-position',
    { lastBook: 'gen', lastChapter: '1' },
    {
        encode: JSON.stringify,
        decode: JSON.parse,
    }
);
