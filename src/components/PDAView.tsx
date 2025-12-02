import React from 'react';
import type { PDAValidationResponse, StackOperation } from '../api/client';
import { PacketBlocks } from './PacketBlocks';
import { StackView } from './StackView';
import { Controls } from './Controls';
import { GraphView } from './GraphView';
import type { GraphData } from '../api/client';

interface Props {
    validation: PDAValidationResponse | null;
    currentStepIndex: number;
    isPlaying: boolean;
    onNext: () => void;
    onPrev: () => void;
    onReset: () => void;
    onPlayPause: () => void;
    graphData?: GraphData;
    activeNodeId?: string;
    activeEdge?: { source: string; target: string } | null;
    onShowDerivation?: () => void;
    onShowGrammar?: () => void;
}

export const PDAView: React.FC<Props> = ({ validation, currentStepIndex, isPlaying, onNext, onPrev, onReset, onPlayPause, graphData, activeNodeId, activeEdge, onShowDerivation, onShowGrammar }) => {
    const step: StackOperation | undefined = validation?.trace[currentStepIndex];
    const proto = step?.symbol?.startsWith('proto=') ? step.symbol.split('=')[1] : '-';
    const service = step?.symbol?.startsWith('service=') ? step.symbol.split('=')[1] : '-';
    const state = step && !step.symbol.startsWith('proto=') && !step.symbol.startsWith('service=') ? step.symbol.replace(/^state=/, '') : '-';

    const traceLen = validation ? (validation.trace ? validation.trace.length : 0) : 0;
    const isFinished = validation && traceLen > 0 && currentStepIndex >= (traceLen - 1);
    const isValid = validation ? !!validation.is_valid : false;

    const tileClass = isFinished ? (isValid ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500') : 'bg-white border-gray-200';
    const tileTextClass = isFinished ? (isValid ? 'text-green-700' : 'text-red-700') : 'text-gray-700';
    

    return (
        <div>
            <div className={`p-4 rounded-lg border-2 mb-4 transition-colors duration-500 ${tileClass}`}>
                <h3 className={`font-bold mb-3 ${tileTextClass}`}>
                    {isFinished ? (isValid ? 'PDA Accepted' : 'PDA Rejected') : 'Processing PDA...'}
                </h3>
                <PacketBlocks proto={proto} service={service} state={state} activeIndex={
                    step ? (step.symbol.startsWith('proto=') ? 0 : step.symbol.startsWith('service=') ? 1 : 2) : -1
                } />
                {isFinished && (
                    <div className={`mt-3 text-center font-bold ${tileTextClass}`}>
                        Final: {isValid ? 'Accepted' : 'Rejected'}
                    </div>
                )}
            </div>

            <div className="flex flex-col lg:flex-row gap-4">
                <div className="bg-white p-4 rounded-lg shadow border border-gray-200 lg:w-80">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold">PDA Stack</h3>
                    </div>
                    <StackView stack={step?.stack || []} />
                </div>

                <div className="flex-1">
                    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                        <h4 className="text-sm font-bold text-gray-500 mb-2 uppercase">PDA Playback</h4>
                        <Controls
                            isPlaying={isPlaying}
                            onPlayPause={onPlayPause}
                            onNext={onNext}
                            onPrev={onPrev}
                            onReset={onReset}
                            canNext={validation ? currentStepIndex < (validation.trace.length - 1) : false}
                            canPrev={currentStepIndex > 0}
                            currentStep={currentStepIndex}
                            totalSteps={validation ? validation.trace.length : 0}
                        />
                    </div>

                    <div className="mt-4">
                        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-semibold">PDA Graph</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { if (typeof onShowDerivation === 'function') onShowDerivation(); }}
                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                    >
                                        Show Derivation
                                    </button>
                                    <button
                                        onClick={() => { if (typeof onShowGrammar === 'function') onShowGrammar(); }}
                                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        View Grammar
                                    </button>
                                </div>
                            </div>
                            <GraphView data={graphData} activeNodeId={activeNodeId} activeEdge={activeEdge} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
