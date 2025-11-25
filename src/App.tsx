import { useState, useEffect, useCallback } from 'react';
import { api } from './api/client';
import { useAutoPlay } from './hooks/useAutoPlay';
import { useActiveHighlight } from './hooks/useActiveHighlight';
import type { GraphData, PDAValidationResponse, Packet, DFAPacketResponse } from './api/client';
import { InputSection } from './components/InputSection';

import { PacketList } from './components/PacketList';
import DFAView from './components/DFAView';
import { PDAView } from './components/PDAView';
import DerivationModal from './components/DerivationModal';

function App() {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [graphData, setGraphData] = useState<GraphData | undefined>(undefined);
    const [pdaGraphData, setPdaGraphData] = useState<GraphData | undefined>(undefined);
    const [selectedPacketIndex, setSelectedPacketIndex] = useState<number | null>(null);
    const [validationResult, setValidationResult] = useState<PDAValidationResponse | null>(null);
    const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // DFA State
    const [currentDFAState, setCurrentDFAState] = useState<string>("s4");
    const [packetHistory, setPacketHistory] = useState<Packet[]>([]);
    const [packetFlags, setPacketFlags] = useState<boolean[]>([]);
    const [derivationSteps, setDerivationSteps] = useState<string[]>([]);
    const [showDerivation, setShowDerivation] = useState(false);
    
    // DFA Playback State
    const [dfaResult, setDfaResult] = useState<DFAPacketResponse | null>(null);
    const [currentDfaStepIndex, setCurrentDfaStepIndex] = useState<number>(-1);
    const [isDfaPlaying, setIsDfaPlaying] = useState(false);

    useEffect(() => {
        startNewSession();
    }, []);

    const startNewSession = () => {
        setIsLoading(true);
        setError(null);
        api.startSession()
            .then(res => {
                setSessionId(res.session_id);
                setPacketHistory([]);
                setCurrentDFAState("s4");
                setValidationResult(null);
                setDerivationSteps([]);
                setShowDerivation(false);
                setDfaResult(null);
                setCurrentDfaStepIndex(-1);
                setRequestResult(null);
            })
            .catch(err => setError("Failed to start session: " + err.message))
            .finally(() => setIsLoading(false));

        api.getGraph()
            .then(setGraphData)
            .catch(err => setError(err.message));
        // Also fetch PDA graph so we can show it when no packet is selected
        api.getPDAGraph()
            .then(setPdaGraphData)
            .catch(err => console.warn('Failed to fetch PDA graph:', err.message));
    };

    // Derivation fetching removed from top controls; retained modal state so it can be triggered elsewhere if needed.

    // New: send a whole request (array of packets)
    const [requestResult, setRequestResult] = useState<import('./api/client').RequestProcessingResponse | null>(null);
    const [lastRequestStartIndex, setLastRequestStartIndex] = useState<number | null>(null);

    const handleSendRequest = async (hostId: string, packets: Packet[], threshold = 1) => {
        if (!sessionId) return;
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.sendRequest(sessionId, hostId, packets, threshold);
            // Store the request-level result and give ability to inspect per-packet DFA results
            setRequestResult(res);
                // Map per-packet suspicious flags to UI
                setPacketFlags(res.packets ? res.packets.map(p => !!p.is_malicious) : []);
            // Also surface PDA validation immediately in the PDA view + stack
            setValidationResult(res.pda);
            setCurrentStepIndex(0);
            // Replace packet history with this request's packets (clickable list of last request)
            setPacketHistory(packets.map(p => ({ ...p, host_id: hostId })));
            setLastRequestStartIndex(0);
            // Clear any previously selected packet; show PDA by default after sending a request
            setSelectedPacketIndex(null);
            setDfaResult(null);
            setCurrentDfaStepIndex(-1);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDfaNext = useCallback(() => {
        if (dfaResult && currentDfaStepIndex < dfaResult.steps.length) {
            setCurrentDfaStepIndex(prev => prev + 1);
        } else {
            setIsDfaPlaying(false);
            // If finished, update the main current state to the final state of this packet
            if (dfaResult) {
                setCurrentDFAState(dfaResult.final_state);
            }
        }
    }, [dfaResult, currentDfaStepIndex]);

    const handleDfaPrev = () => {
        if (currentDfaStepIndex > 0) {
            setCurrentDfaStepIndex(prev => prev - 1);
        }
    };

    const handleDfaReset = () => {
        setCurrentDfaStepIndex(0);
        setIsDfaPlaying(false);
        if (dfaResult && dfaResult.steps.length > 0) {
             setCurrentDFAState(dfaResult.steps[0].current_state);
        }
    };

    // useAutoPlay handles DFA playback interval side-effects
    // and keeps App focused on state only.
    // DFA autoplay
    // (hook imported lazily below)


    // PDA validate-by-host removed; PDA validation occurs as part of request processing now.

    const handleNext = useCallback(() => {
        if (validationResult && currentStepIndex < validationResult.trace.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            setIsPlaying(false);
        }
    }, [validationResult, currentStepIndex]);

    const handlePrev = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
        }
    };

    const handleReset = () => {
        setCurrentStepIndex(0);
        setIsPlaying(false);
    };

    // PDA autoplay handled by hook (see below)

    // currentStep is now used inside PDAView; keep this line commented for reference
    // const currentStep: StackOperation | undefined = validationResult?.trace[currentStepIndex];
    
    // Packet Visualization Helper
    // DFA visualization is handled by `DFAView` when `dfaResult` is present

    // Allow selecting a packet from history to inspect its DFA result
    const inspectPacketAtIndex = (idx: number) => {
        if (!requestResult || lastRequestStartIndex === null) return;
        const rel = idx - lastRequestStartIndex;
        if (rel < 0 || rel >= requestResult.packets.length) return;
        // Toggle selection: deselect if already selected
        if (selectedPacketIndex === idx) {
            setSelectedPacketIndex(null);
            setDfaResult(null);
            setCurrentDfaStepIndex(-1);
            return;
        }
        const pres = requestResult.packets[rel];
        setSelectedPacketIndex(idx);
        setDfaResult(pres);
        setCurrentDfaStepIndex(0);
    };

    const handleShowDerivation = async () => {
        if (!sessionId) {
            setError('No active session');
            return;
        }
        setIsLoading(true);
        try {
            const res = await api.getDerivation(sessionId);
            setDerivationSteps(res.steps || []);
            setShowDerivation(true);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch derivation');
        } finally {
            setIsLoading(false);
        }
    };

    // Use hook to compute active node and active edge based on playback/validation state.
    const { activeNodeId, activeEdge } = useActiveHighlight({
        dfaResult,
        currentDfaStepIndex,
        validationResult,
        currentStepIndex,
        currentDFAState
    });

    // Hook to auto-advance DFA and PDA playback when playing
    useAutoPlay(isDfaPlaying, handleDfaNext, 1000, [dfaResult, currentDfaStepIndex]);
    useAutoPlay(isPlaying, handleNext, 1000, [validationResult, currentStepIndex]);

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-900 relative">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Network Automata Visualizer</h1>
                <p className="text-gray-600 mt-2">Visualize PDA/DFA validation for IoT Malware detection</p>
                {/* Derivation button moved into DFA view */}
            </header>

            {/* top-level status banner removed — it will be shown near the packet selector */}

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex justify-between items-center">
                    <span>{error}</span>
                    {error.includes("Session not found") && (
                        <button 
                            onClick={startNewSession}
                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-sm"
                        >
                            Reconnect
                        </button>
                    )}
                </div>
            )}

            <InputSection 
                onSendRequest={handleSendRequest} 
                isLoading={isLoading || !sessionId} 
            />

            <div className="flex gap-6 flex-col lg:flex-row">
                <div className="flex-1 flex flex-col gap-6">
                    
                    {/* Packet Processing Visualization: show DFA when a packet is selected, otherwise PDA view */}
                    {dfaResult ? (
                        <DFAView
                            dfaResult={dfaResult}
                            packet={packetHistory[selectedPacketIndex ?? (packetHistory.length - 1)]}
                            currentStepIndex={currentDfaStepIndex}
                            isPlaying={isDfaPlaying}
                            onNext={handleDfaNext}
                            onPrev={handleDfaPrev}
                            onReset={handleDfaReset}
                            onPlayPause={() => setIsDfaPlaying(!isDfaPlaying)}
                            graphData={graphData}
                                activeNodeId={activeNodeId}
                                activeEdge={activeEdge}
                            onShowDerivation={handleShowDerivation}
                            isSuspicious={selectedPacketIndex !== null ? (!!packetFlags[selectedPacketIndex]) : false}
                        />
                    ) : (
                        validationResult && (
                            <PDAView
                                validation={validationResult}
                                currentStepIndex={currentStepIndex}
                                isPlaying={isPlaying}
                                onNext={handleNext}
                                onPrev={handlePrev}
                                onReset={handleReset}
                                onPlayPause={() => setIsPlaying(!isPlaying)}
                                graphData={pdaGraphData}
                                    activeNodeId={activeNodeId}
                                    activeEdge={activeEdge}
                            />
                        )
                    )}

                    {/* StatusPanel is rendered inside DFAView / PDAView to avoid duplication */}

                    {/* Derivation Modal */}
                    <DerivationModal show={showDerivation} steps={derivationSteps} onClose={() => setShowDerivation(false)} />

                    {/* DFA Controls */}
                    {/* PDA/DFA graph and controls are rendered by the components above */}
                </div>

                <div className="flex flex-col gap-6 w-full lg:w-80">
                        {/* Packet History Log */}
                        {requestResult && requestResult.is_malicious && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 flex items-center justify-center font-semibold">
                                REQUEST FLAGGED AS MALICIOUS
                            </div>
                        )}
                        <PacketList packets={packetHistory} selectedIndex={selectedPacketIndex} onSelect={inspectPacketAtIndex} flags={packetFlags} />

                    {/* PDA right-column widgets moved into PDAView and StatusPanel */}
                </div>
            </div>
            {/* Note: graph displayed inline above; PDA is shown when no packet is selected, DFA shown when a packet is selected */}
        </div>
    );
}

export default App;
