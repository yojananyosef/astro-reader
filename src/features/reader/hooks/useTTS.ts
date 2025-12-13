import { useState, useEffect, useRef } from 'preact/hooks';
import { preferences } from '../../../stores/preferences';

export function useTTS() {
    const [isPlaying, setIsPlaying] = useState(false);
    const synth = useRef<SpeechSynthesis | null>(null);
    const utterance = useRef<SpeechSynthesisUtterance | null>(null);
    const [rate, setRate] = useState(1.0);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            synth.current = window.speechSynthesis;
        }
    }, []);

    const stop = () => {
        if (synth.current) {
            synth.current.cancel();
            setIsPlaying(false);
            document.querySelectorAll('.speaking-highlight').forEach(el =>
                el.classList.remove('speaking-highlight')
            );
        }
    };

    const play = (textBlocksSelector = '.reader-content p, .reader-content h1') => {
        if (!synth.current) return;

        // If already speaking, pause/resume? Or just stop.
        if (isPlaying) {
            stop();
            return;
        }

        setIsPlaying(true);

        // Get all readable elements
        const elements = Array.from(document.querySelectorAll(textBlocksSelector));
        let currentIndex = 0;

        const speakNext = () => {
            if (currentIndex >= elements.length) {
                stop();
                return;
            }

            const element = elements[currentIndex];
            // Cloning to process text without altering DOM
            const clone = element.cloneNode(true) as HTMLElement;
            const currentPrefs = preferences.get();

            if (currentPrefs.skipVerses) {
                clone.querySelectorAll('sup').forEach(el => el.remove());
            }

            if (currentPrefs.skipFootnotes) {
                clone.querySelectorAll('a').forEach(el => el.remove());
            }

            const text = clone.innerText;

            if (!text.trim()) {
                currentIndex++;
                speakNext();
                return;
            }

            // Create utterance
            const u = new SpeechSynthesisUtterance(text);
            u.rate = rate;
            u.lang = 'es-ES'; // Default to Spanish

            u.onstart = () => {
                // Highlight
                document.querySelectorAll('.speaking-highlight').forEach(el =>
                    el.classList.remove('speaking-highlight')
                );
                element.classList.add('speaking-highlight');
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            };

            u.onend = () => {
                element.classList.remove('speaking-highlight');
                currentIndex++;
                speakNext();
            };

            u.onerror = () => {
                element.classList.remove('speaking-highlight');
                stop();
            };

            utterance.current = u;
            if (synth.current) {
                synth.current.speak(u);
            }
        };

        speakNext();
    };

    return { isPlaying, play, stop, rate, setRate };
}
