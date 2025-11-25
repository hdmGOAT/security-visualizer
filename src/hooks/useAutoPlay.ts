import { useEffect } from 'react';

// Simple hook to manage an auto-play interval for advancing steps.
// - isPlaying: whether playback is active
// - onNext: callback to advance one step
// - intervalMs: milliseconds between steps (default 1000)
// The hook sets/clears the interval based on isPlaying and dependencies.
export function useAutoPlay(isPlaying: boolean, onNext: () => void, intervalMs = 1000, deps: unknown[] = []) {
    useEffect(() => {
        if (!isPlaying) return;
        const id = setInterval(() => {
            try {
                onNext();
            } catch (e) {
                // swallow errors from callbacks - they should be handled upstream
                // but avoid leaving interval running
                console.error('useAutoPlay onNext error', e);
            }
        }, intervalMs);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPlaying, onNext, intervalMs, ...deps]);
}
