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
import GrammarModal from './components/GrammarModal';

function App() {
    const [graphData, setGraphData] = useState<GraphData | undefined>(undefined);
    const [pdaGraphData, setPdaGraphData] = useState<GraphData | undefined>(undefined);
    const [selectedPacketIndex, setSelectedPacketIndex] = useState<number | null>(null);
    const [validationResult, setValidationResult] = useState<PDAValidationResponse | null>(null);
    const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [currentDFAState, setCurrentDFAState] = useState<string>("");
    const [packetHistory, setPacketHistory] = useState<Packet[]>([]);
    const [packetFlags, setPacketFlags] = useState<boolean[]>([]);
    const [derivationSteps, setDerivationSteps] = useState<string[]>([]);
    const [showDerivation, setShowDerivation] = useState(false);
    const [grammarRules, setGrammarRules] = useState<string[]>([]);
    const [showGrammar, setShowGrammar] = useState(false);
    const [pdaGrammarRules, setPdaGrammarRules] = useState<string[]>([]);
    const [showPdaGrammar, setShowPdaGrammar] = useState(false);
    
    const [dfaResult, setDfaResult] = useState<DFAPacketResponse | null>(null);
    const [currentDfaStepIndex, setCurrentDfaStepIndex] = useState<number>(-1);
    const [isDfaPlaying, setIsDfaPlaying] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        setError(null);
        // fetch graphs and grammars in parallel
    Promise.all([api.getGraph(), api.getPDAGraph(), api.getGrammar().catch(() => ({ rules: [] })), api.getPDAGrammar().catch(() => ({ rules: [] }))])
            .then(([g, pg, gRules, pRules]) => {
                setGraphData(g);
                setPdaGraphData(pg);
        setGrammarRules(gRules.rules || []);
        setPdaGrammarRules(pRules.rules || []);

                // Initialize current DFA state from the graph's start node
                if (g && Array.isArray(g.nodes) && g.nodes.length > 0) {
                    const startNode = g.nodes.find(n => !!(n as any).is_start) as any | undefined;
                    const startId = startNode ? (startNode as any).id : (g.nodes[0] as any).id;
                    if (startId) setCurrentDFAState(startId);
                }
            })
            .catch(err => setError(err.message))
            .finally(() => setIsLoading(false));
    }, []);

    const [requestResult, setRequestResult] = useState<import('./api/client').RequestProcessingResponse | null>(null);
    const [lastRequestStartIndex, setLastRequestStartIndex] = useState<number | null>(null);

    const handleSendRequest = async (packets: Packet[], threshold = 3) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.sendRequest(packets, threshold);
            setRequestResult(res);
            setPacketFlags(res.packets ? res.packets.map(p => !!p.is_malicious) : []);
            setValidationResult(res.pda);
            // Start before the first trace step so the UI shows the pre-transition
            // (empty) stack. The PDA DOT may include an explicit bootstrap push
            // (e.g. __start -> Start pushing Z0). We want the frontend to show
            // the state before that transition until the user advances playback.
            setCurrentStepIndex(-1);
            setPacketHistory(packets);
            setLastRequestStartIndex(0);
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
        setCurrentStepIndex(-1);
        setIsPlaying(false);
    };

    const inspectPacketAtIndex = (idx: number) => {
        if (!requestResult || lastRequestStartIndex === null) return;
        const rel = idx - lastRequestStartIndex;
        if (rel < 0 || rel >= requestResult.packets.length) return;
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
        setIsLoading(true);
        try {
            const pkt = packetHistory[selectedPacketIndex ?? (packetHistory.length - 1)];
            if (!pkt) {
                setError('No packet available for derivation');
                setIsLoading(false);
                return;
            }
            const res = await api.getDerivation(pkt);
            setDerivationSteps(res.steps || []);
            setShowDerivation(true);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch derivation');
        } finally {
            setIsLoading(false);
        }
    };

    const handleShowGrammar = () => {
        setShowGrammar(true);
    };

    const handleShowPDAGrammar = () => {
        setShowPdaGrammar(true);
    };

    const handleShowPDADerivation = async () => {
        setIsLoading(true);
        try {
            if (!packetHistory || packetHistory.length === 0) {
                setError('No packet history available for PDA derivation');
                setIsLoading(false);
                return;
            }
            const res = await api.getPDADerivation(packetHistory);
            setDerivationSteps(res.steps || []);
            setShowDerivation(true);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch PDA derivation');
        } finally {
            setIsLoading(false);
        }
    };

    const { activeNodeId, activeEdge } = useActiveHighlight({
        dfaResult,
        currentDfaStepIndex,
        validationResult,
        currentStepIndex,
        currentDFAState
    });

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
                </div>
            )}

            <InputSection 
                onSendRequest={handleSendRequest} 
                isLoading={isLoading} 
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
                            onShowGrammar={handleShowGrammar}
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
                    onShowDerivation={handleShowPDADerivation}
                    onShowGrammar={handleShowPDAGrammar}
                />
                        )
                    )}

                    {/* StatusPanel is rendered inside DFAView / PDAView to avoid duplication */}

                    {/* Derivation Modal */}
                    <DerivationModal show={showDerivation} steps={derivationSteps} onClose={() => setShowDerivation(false)} />
                    <GrammarModal show={showGrammar} rules={grammarRules} title="DFA Grammar" onClose={() => setShowGrammar(false)} />
                    <GrammarModal show={showPdaGrammar} rules={pdaGrammarRules} title="PDA Grammar" onClose={() => setShowPdaGrammar(false)} />

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
                        <PacketList packets={packetHistory} selectedIndex={selectedPacketIndex} onSelect={inspectPacketAtIndex} flags={packetFlags} compact={true} />

                    {/* PDA right-column widgets moved into PDAView and StatusPanel */}
                </div>
            </div>
            {/* Note: graph displayed inline above; PDA is shown when no packet is selected, DFA shown when a packet is selected */}
        </div>
    );
}

export default App;
