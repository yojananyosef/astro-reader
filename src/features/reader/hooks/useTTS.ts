import { useState, useEffect, useRef } from 'preact/hooks';
import { preferences } from '../../../stores/preferences';

export function useTTS() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const synth = useRef<SpeechSynthesis | null>(null);
    const utterance = useRef<SpeechSynthesisUtterance | null>(null);
    const [rate, setRate] = useState(1.0);
    const elementsRef = useRef<Element[]>([]);
    const currentIndexRef = useRef(0);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            synth.current = window.speechSynthesis;
        }
    }, []);

    const stop = () => {
        if (synth.current) {
            synth.current.cancel();
            setIsPlaying(false);
            setIsPaused(false);
            currentIndexRef.current = 0;
            document.querySelectorAll('.speaking-highlight').forEach(el =>
                el.classList.remove('speaking-highlight')
            );
        }
    };

    const pause = () => {
        if (synth.current && isPlaying && !isPaused) {
            synth.current.pause();
            setIsPaused(true);
        }
    };

    const resume = () => {
        if (synth.current && isPlaying && isPaused) {
            synth.current.resume();
            setIsPaused(false);
        }
    };

    const play = (textBlocksSelector = '.reader-content p, .reader-content h1', onComplete?: () => void) => {
        if (!synth.current) return;

        // Handle Resume
        if (isPlaying && isPaused) {
            resume();
            return;
        }

        // Handle Pause
        if (isPlaying && !isPaused) {
            pause();
            return;
        }

        setIsPlaying(true);
        setIsPaused(false);

        // Get all readable elements
        const elements = Array.from(document.querySelectorAll(textBlocksSelector));
        elementsRef.current = elements;
        currentIndexRef.current = 0;

        const speakNext = () => {
            if (currentIndexRef.current >= elementsRef.current.length) {
                stop();
                if (onComplete) onComplete();
                return;
            }

            const element = elementsRef.current[currentIndexRef.current];
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
                currentIndexRef.current++;
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
                currentIndexRef.current++;
                speakNext();
            };

            u.onerror = (event) => {
                console.error('TTS Error:', event);
                element.classList.remove('speaking-highlight');
                // Don't stop on all errors, try next if possible
                if (event.error !== 'interrupted') {
                    stop();
                }
            };

            utterance.current = u;
            if (synth.current) {
                synth.current.speak(u);
            }
        };

        speakNext();
    };

    return { isPlaying, isPaused, play, stop, pause, resume, rate, setRate };
}
