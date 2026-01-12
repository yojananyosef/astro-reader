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

            // CRITICAL: Stop TTS when navigating
            const handleNavigation = () => {
                if (synth.current) {
                    stop();
                }
            };

            window.addEventListener('beforeunload', handleNavigation);
            window.addEventListener('popstate', handleNavigation);
            
            // Astro View Transitions support
            document.addEventListener('astro:before-preparation', handleNavigation);
            document.addEventListener('astro:after-swap', handleNavigation);

            // Watch for URL changes manually for cases where popstate doesn't fire
            let lastUrl = window.location.href;
            const urlCheckInterval = setInterval(() => {
                if (window.location.href !== lastUrl) {
                    lastUrl = window.location.href;
                    handleNavigation();
                }
            }, 500);

            return () => {
                window.removeEventListener('beforeunload', handleNavigation);
                window.removeEventListener('popstate', handleNavigation);
                document.removeEventListener('astro:before-preparation', handleNavigation);
                document.removeEventListener('astro:after-swap', handleNavigation);
                clearInterval(urlCheckInterval);
                if (synth.current) {
                    synth.current.cancel();
                }
            };
        }
    }, []); // Only on mount

    // Separate effect for keepAlive to avoid re-triggering logic on isPlaying change
    useEffect(() => {
        let timeoutId: any;
        const keepAlive = () => {
            if (synth.current?.speaking && !synth.current?.paused) {
                synth.current.pause();
                synth.current.resume();
            }
            if (isPlaying) {
                timeoutId = setTimeout(keepAlive, 10000);
            }
        };

        if (isPlaying) {
            keepAlive();
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [isPlaying]);

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
            // On some browsers, pause/resume is buggy. 
            // We'll store the state to handle it in resume()
        }
    };

    const resume = () => {
        if (synth.current && isPlaying && isPaused) {
            // Safari/Chrome on Mobile sometimes lose context on pause
            if (synth.current.paused) {
                synth.current.resume();
            } else {
                // If not actually paused in the engine but our state says so,
                // it might have lost the utterance. Restarting from current element is safer.
                if (utterance.current) {
                    synth.current.speak(utterance.current);
                }
            }
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

        // IMPORTANT: Always reset engine and clear everything before starting new audio
        // to prevent context loss bugs on chapter changes
        synth.current.cancel();
        
        // Wait for cancel to propagate (especially on mobile)
        setTimeout(() => {
            setIsLoading(true);
            setIsPlaying(true);
            setIsPaused(false);
            isStoppingRef.current = false;

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
                // Ensure element still exists in the DOM (important after navigation)
                if (!element || !document.body.contains(element)) {
                    stop();
                    return;
                }

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
                    
                    // Highlight current element - FIRST REMOVE OTHERS
                    document.querySelectorAll('.speaking-highlight').forEach(el =>
                        el.classList.remove('speaking-highlight')
                    );
                    
                    // THEN ADD TO CURRENT
                    element.classList.add('speaking-highlight');
                    
                    // Ensure element is visible
                    const rect = element.getBoundingClientRect();
                    const isVisible = (rect.top >= 50 && rect.bottom <= window.innerHeight - 50);
                    if (!isVisible) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                };

                u.onend = () => {
                    if (isStoppingRef.current) return;
                    
                    // Only increment and continue if the engine is not stopping
                    currentIndexRef.current++;
                    
                    // Double check if we are still on the same page and have more elements
                    if (document.body.contains(element) && currentIndexRef.current < elementsRef.current.length) {
                        speakNext();
                    } else if (currentIndexRef.current >= elementsRef.current.length) {
                        stop();
                        if (onComplete) onComplete();
                    } else {
                        stop();
                    }
                };

                u.onerror = (event) => {
                    // On some browsers, 'interrupted' happens on normal stop or quick play clicks.
                    // We silence this in production as it's an expected behavior during navigation/cancellation.
                    if (event.error === 'interrupted') {
                        if (!isStoppingRef.current) {
                            // Try to recover or just move on if it wasn't a deliberate stop
                            setTimeout(speakNext, 100);
                        }
                        return;
                    }
                    
                    console.error('TTS Error:', event);
                    stop();
                };

                utterance.current = u;
                
                // Tiny delay between utterances for better stability on some browsers
                setTimeout(() => {
                    if (!isStoppingRef.current && synth.current) {
                        synth.current.speak(u);
                    }
                }, 50);
            };

            speakNext();
        }, 150);
    };

    return { isPlaying, isPaused, isLoading, play, stop, pause, resume, rate, setRate };
}
