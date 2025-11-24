import React from 'react';
import { Play, Pause, SkipForward, SkipBack, RotateCcw } from 'lucide-react';

interface ControlsProps {
    isPlaying: boolean;
    onPlayPause: () => void;
    onNext: () => void;
    onPrev: () => void;
    onReset: () => void;
    canNext: boolean;
    canPrev: boolean;
    currentStep: number;
    totalSteps: number;
}

export const Controls: React.FC<ControlsProps> = ({
    isPlaying,
    onPlayPause,
    onNext,
    onPrev,
    onReset,
    canNext,
    canPrev,
    currentStep,
    totalSteps
}) => {
    return (
        <div className="flex items-center justify-center gap-4 p-4 bg-white rounded-lg shadow border border-gray-200">
            <button
                onClick={onReset}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
                title="Reset"
            >
                <RotateCcw size={20} />
            </button>
            <button
                onClick={onPrev}
                disabled={!canPrev}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Previous Step"
            >
                <SkipBack size={24} />
            </button>
            <button
                onClick={onPlayPause}
                className="p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-md transition-colors"
                title={isPlaying ? "Pause" : "Play"}
            >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button
                onClick={onNext}
                disabled={!canNext}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Next Step"
            >
                <SkipForward size={24} />
            </button>
            <div className="ml-4 text-sm font-medium text-gray-500">
                Step {currentStep + 1} / {totalSteps}
            </div>
        </div>
    );
};
