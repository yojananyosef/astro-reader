import { useEffect, useState } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { preferences } from '../../../stores/preferences';

export default function ReaderRuler() {
    const $prefs = useStore(preferences);
    const [position, setPosition] = useState(-100);

    useEffect(() => {
        if (!$prefs.rulerEnabled) return;

        const handleMove = (e: MouseEvent) => {
            requestAnimationFrame(() => {
                setPosition(e.clientY);
            });
        };

        window.addEventListener('mousemove', handleMove);
        return () => window.removeEventListener('mousemove', handleMove);
    }, [$prefs.rulerEnabled]);

    if (!$prefs.rulerEnabled) return null;

    return (
        <div
            style={{
                top: `${position}px`,
                transform: 'translateY(-50%)',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)' // Dim everything else
            }}
            className="fixed left-0 w-full h-16 pointer-events-none z-[100] mix-blend-multiply border-y border-yellow-400/30 bg-yellow-400/10"
        />
    );
}
