import { useState, useEffect, useRef } from 'preact/hooks';
import { preferences } from '../../../stores/preferences';

export function useTTS() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const synth = useRef<SpeechSynthesis | null>(null);
    const utterance = useRef<SpeechSynthesisUtterance | null>(null);
    const [rate, setRate] = useState(1.0);
    const elementsRef = useRef<Element[]>([]);
    const currentIndexRef = useRef(0);
    const isStoppingRef = useRef(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            synth.current = window.speechSynthesis;
            
            // Wake up speech engine on mobile/Safari
            const wakeUp = () => {
                if (synth.current) {
                    const u = new SpeechSynthesisUtterance('');
                    u.volume = 0;
                    synth.current.speak(u);
                }
                window.removeEventListener('touchstart', wakeUp);
                window.removeEventListener('click', wakeUp);
            };
            window.addEventListener('touchstart', wakeUp);
            window.addEventListener('click', wakeUp);
        }

        return () => {
            if (synth.current) {
                synth.current.cancel();
            }
        };
    }, []);

    const stop = () => {
        isStoppingRef.current = true;
        if (synth.current) {
            synth.current.cancel();
            setIsPlaying(false);
            setIsPaused(false);
            setIsLoading(false);
            currentIndexRef.current = 0;
            document.querySelectorAll('.speaking-highlight').forEach(el =>
                el.classList.remove('speaking-highlight')
            );
        }
        // Small delay to prevent race conditions with speakNext
        setTimeout(() => {
            isStoppingRef.current = false;
        }, 150);
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

        // If we're stopping, wait a bit
        if (isStoppingRef.current) {
            setTimeout(() => play(textBlocksSelector, onComplete), 200);
            return;
        }

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

        // Cancel any current speech before starting new one
        synth.current.cancel();
        
        setIsLoading(true);
        setIsPlaying(true);
        setIsPaused(false);

        // Get all readable elements
        const elements = Array.from(document.querySelectorAll(textBlocksSelector));
        if (elements.length === 0) {
            setIsLoading(false);
            setIsPlaying(false);
            return;
        }

        elementsRef.current = elements;
        currentIndexRef.current = 0;

        const speakNext = () => {
            if (isStoppingRef.current) return;

            if (currentIndexRef.current >= elementsRef.current.length) {
                stop();
                if (onComplete) onComplete();
                return;
            }

            const element = elementsRef.current[currentIndexRef.current];
            // Cloning to process text without altering DOM
            const clone = element.cloneNode(true) as HTMLElement;
            const currentPrefs = preferences.get();

            // FIX: Skip verse numbers (both new .verse-num and old sup)
            if (currentPrefs.skipVerses) {
                clone.querySelectorAll('.verse-num, sup').forEach(el => {
                    // Replace with a space to avoid joining words incorrectly
                    el.textContent = ' ';
                    el.remove();
                });
            }

            // FIX: Skip footnotes and other links
            if (currentPrefs.skipFootnotes) {
                clone.querySelectorAll('.footnote-ref, a').forEach(el => {
                    el.textContent = ' ';
                    el.remove();
                });
            }

            // Remove icons, svgs, or buttons that might be in the text
            clone.querySelectorAll('.commentary-icon, svg, button, .select-none-ui').forEach(el => {
                el.textContent = ' ';
                el.remove();
            });

            // Final text cleanup: replace multiple spaces and remove hidden characters
            const text = clone.innerText
                .replace(/\s+/g, ' ')
                .trim();

            if (!text) {
                currentIndexRef.current++;
                speakNext();
                return;
            }

            // Create utterance
            const u = new SpeechSynthesisUtterance(text);
            u.rate = rate;
            u.lang = 'es-ES'; // Default to Spanish

            u.onstart = () => {
                if (isStoppingRef.current) return;
                setIsLoading(false);
                
                // Highlight current element
                document.querySelectorAll('.speaking-highlight').forEach(el =>
                    el.classList.remove('speaking-highlight')
                );
                element.classList.add('speaking-highlight');
                
                // Ensure element is visible
                const rect = element.getBoundingClientRect();
                const isVisible = (rect.top >= 0 && rect.bottom <= window.innerHeight);
                if (!isVisible) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            };

            u.onend = () => {
                if (isStoppingRef.current) return;
                element.classList.remove('speaking-highlight');
                currentIndexRef.current++;
                speakNext();
            };

            u.onerror = (event) => {
                console.error('TTS Error:', event);
                element.classList.remove('speaking-highlight');
                
                // On some browsers, 'interrupted' happens on normal stop or quick play clicks
                if (event.error === 'interrupted' && !isStoppingRef.current) {
                    // Try to recover or just move on
                    setTimeout(speakNext, 100);
                    return;
                }
                
                if (event.error !== 'interrupted') {
                    stop();
                }
            };

            utterance.current = u;
            
            // Tiny delay between utterances for better stability on some browsers
            setTimeout(() => {
                if (!isStoppingRef.current && synth.current) {
                    synth.current.speak(u);
                }
            }, 50);
        };

        // Initial delay to let the cancel() call finish properly
        setTimeout(speakNext, 100);
    };

    return { isPlaying, isPaused, isLoading, play, stop, pause, resume, rate, setRate };
}
