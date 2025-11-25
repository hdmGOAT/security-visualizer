import React from 'react';
import type { DFAPacketResponse, Packet, GraphData } from '../api/client';
import { Controls } from './Controls';
import { GraphView } from './GraphView';

interface Props {
    dfaResult: DFAPacketResponse;
    packet: Packet | undefined;
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
    isSuspicious?: boolean;
}

export const DFAView: React.FC<Props> = ({ dfaResult, packet, currentStepIndex, isPlaying, onNext, onPrev, onReset, onPlayPause, graphData, activeNodeId, activeEdge, onShowDerivation, isSuspicious }) => {
    const steps = dfaResult.steps || [];
    const isFinished = currentStepIndex >= steps.length;

    const getBlockColor = (index: number) => {
        if (currentStepIndex === index) return "bg-yellow-400 border-yellow-600 text-yellow-900 animate-pulse";
        if (currentStepIndex > index) {
            if (isFinished) {
                return dfaResult.is_malicious ? "bg-red-500 border-red-700 text-white" : "bg-green-500 border-green-700 text-white";
            }
            return "bg-green-500 border-green-700 text-white";
        }
        return "bg-gray-200 border-gray-300 text-gray-500";
    };

    return (
        <div>
            <div className={`p-4 rounded-lg border-2 mb-4 transition-colors duration-500 ${isFinished ? (dfaResult.is_malicious ? 'bg-red-100 border-red-500' : 'bg-green-100 border-green-500') : 'bg-white border-gray-200'}`}>
                <div className="flex justify-between items-start">
                    <h3 className={`font-bold mb-3 ${isFinished ? (dfaResult.is_malicious ? 'text-red-700' : 'text-green-700') : 'text-gray-700'}`}>
                        {isFinished ? (dfaResult.is_malicious ? 'SUSPICIOUS PACKET DETECTED' : 'PACKET ACCEPTED (BENIGN)') : 'Processing Packet...'}
                    </h3>
                    <div className="ml-4">
                        <button
                            onClick={() => { if (typeof onShowDerivation === 'function') onShowDerivation(); }}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                            Show Derivation
                        </button>
                    </div>
                </div>
                <div className="flex gap-2 items-center">
                    <div className={`flex-1 p-3 rounded border-2 font-mono text-center transition-all duration-300 ${getBlockColor(0)}`}>
                        <div className="text-xs uppercase opacity-75">Protocol</div>
                        <div className="font-bold">{packet?.proto || '-'}</div>
                    </div>
                    <div className={`flex-1 p-3 rounded border-2 font-mono text-center transition-all duration-300 ${getBlockColor(1)}`}>
                        <div className="text-xs uppercase opacity-75">Service</div>
                        <div className="font-bold">{packet?.service || '-'}</div>
                    </div>
                    <div className={`flex-1 p-3 rounded border-2 font-mono text-center transition-all duration-300 ${getBlockColor(2)}`}>
                        <div className="text-xs uppercase opacity-75">State</div>
                        <div className="font-bold">{packet?.conn_state || '-'}</div>
                    </div>
                    {isSuspicious && (
                        <div className="ml-3">
                            <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm font-semibold">Suspicious</span>
                        </div>
                    )}
                </div>
                {isFinished && (
                    <div className={`mt-3 text-center font-bold ${dfaResult.is_malicious ? 'text-red-700' : 'text-green-700'}`}>
                        Final State: {dfaResult.final_state}
                    </div>
                )}
            </div>

            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                <h4 className="text-sm font-bold text-gray-500 mb-2 uppercase">DFA Playback</h4>
                <Controls
                    isPlaying={isPlaying}
                    onPlayPause={onPlayPause}
                    onNext={onNext}
                    onPrev={onPrev}
                    onReset={onReset}
                    canNext={currentStepIndex < steps.length}
                    canPrev={currentStepIndex > 0}
                    currentStep={currentStepIndex}
                    totalSteps={steps.length + 1}
                />
            </div>

            <div className="mt-4">
                <GraphView data={graphData} activeNodeId={activeNodeId} activeEdge={activeEdge} />
            </div>
        </div>
    );
};

export default DFAView;
