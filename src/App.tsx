import { useState, useEffect, useCallback } from 'react';
import { api } from './api/client';
import type { GraphData, PDAValidationResponse, StackOperation, Packet, DFAPacketResponse } from './api/client';
import { GraphView } from './components/GraphView';
import { StackView } from './components/StackView';
import { Controls } from './components/Controls';
import { InputSection } from './components/InputSection';

function App() {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [graphData, setGraphData] = useState<GraphData | undefined>(undefined);
    const [validationResult, setValidationResult] = useState<PDAValidationResponse | null>(null);
    const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // DFA State
    const [currentDFAState, setCurrentDFAState] = useState<string>("s4");
    const [packetHistory, setPacketHistory] = useState<Packet[]>([]);
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
            })
            .catch(err => setError("Failed to start session: " + err.message))
            .finally(() => setIsLoading(false));

        api.getGraph()
            .then(setGraphData)
            .catch(err => setError(err.message));
    };

    const handleGetDerivation = async () => {
        if (!sessionId) return;
        setIsLoading(true);
        try {
            const res = await api.getDerivation(sessionId);
            setDerivationSteps(res.steps);
            setShowDerivation(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendPacket = async (packet: Packet) => {
        if (!sessionId) return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await api.sendPacket(sessionId, packet);
            setDfaResult(result);
            setCurrentDfaStepIndex(0); // Start at the beginning
            setIsDfaPlaying(true); // Auto-play? Or let user play? User said "played STEP BY STEP, so the user can follow along"
            // Let's auto-play for now but slowly, or just set to 0 and let user control.
            // "rn when i submit a packet EVERYTHING BREAKS... Lets make it simpler and jsut hightlight where we are"
            // "We need the STEP BY STEP run thru the DFA"
            
            setPacketHistory(prev => [...prev, packet]);
        } catch (err: any) {
            setError(err.message);
            if (err.message.includes("Session not found")) {
                // Optional: Auto-restart or just let the user see the error
            }
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

    useEffect(() => {
        let interval: number;
        if (isDfaPlaying) {
            interval = setInterval(handleDfaNext, 1000);
        }
        return () => clearInterval(interval);
    }, [isDfaPlaying, handleDfaNext]);

    // Update currentDFAState based on playback
    useEffect(() => {
        if (dfaResult && currentDfaStepIndex >= 0 && currentDfaStepIndex < dfaResult.steps.length) {
            setCurrentDFAState(dfaResult.steps[currentDfaStepIndex].current_state);
        } else if (dfaResult && currentDfaStepIndex >= dfaResult.steps.length) {
             setCurrentDFAState(dfaResult.final_state);
        }
    }, [currentDfaStepIndex, dfaResult]);


    const handleValidateHost = async (hostId: string) => {
        if (!sessionId) return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await api.validateHost(sessionId, hostId);
            setValidationResult(result);
            setCurrentStepIndex(0);
            setIsPlaying(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
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
        setCurrentStepIndex(0);
        setIsPlaying(false);
    };

    useEffect(() => {
        let interval: number;
        if (isPlaying) {
            interval = setInterval(handleNext, 1000);
        }
        return () => clearInterval(interval);
    }, [isPlaying, handleNext]);

    const currentStep: StackOperation | undefined = validationResult?.trace[currentStepIndex];
    
    // Packet Visualization Helper
    const renderPacketVisualization = () => {
        if (!dfaResult || currentDfaStepIndex === -1) return null;
        
        const steps = dfaResult.steps;
        // We assume steps map to proto -> service -> state
        // But the steps are transitions.
        // Let's just show the 3 blocks: Proto, Service, ConnState
        // And highlight based on which step we are in.
        // Step 0: Processing Proto
        // Step 1: Processing Service
        // Step 2: Processing ConnState
        
        const packet = packetHistory[packetHistory.length - 1]; // The one being processed
        if (!packet) return null;

        const getBlockColor = (index: number) => {
            if (currentDfaStepIndex === index) return "bg-yellow-400 border-yellow-600 text-yellow-900 animate-pulse";
            if (currentDfaStepIndex > index) {
                if (isFinished) {
                    return dfaResult.is_malicious 
                        ? "bg-red-500 border-red-700 text-white" 
                        : "bg-green-500 border-green-700 text-white";
                }
                return "bg-green-500 border-green-700 text-white";
            }
            return "bg-gray-200 border-gray-300 text-gray-500";
        };

        const isFinished = currentDfaStepIndex >= steps.length;
        const finalColor = dfaResult.is_malicious ? "bg-red-100 border-red-500" : "bg-green-100 border-green-500";
        const finalTextColor = dfaResult.is_malicious ? "text-red-700" : "text-green-700";

        return (
            <div className={`p-4 rounded-lg border-2 mb-4 transition-colors duration-500 ${isFinished ? finalColor : "bg-white border-gray-200"}`}>
                <h3 className={`font-bold mb-3 ${isFinished ? finalTextColor : "text-gray-700"}`}>
                    {isFinished ? (dfaResult.is_malicious ? "MALICIOUS PACKET DETECTED" : "PACKET ACCEPTED (BENIGN)") : "Processing Packet..."}
                </h3>
                <div className="flex gap-2">
                    <div className={`flex-1 p-3 rounded border-2 font-mono text-center transition-all duration-300 ${getBlockColor(0)}`}>
                        <div className="text-xs uppercase opacity-75">Protocol</div>
                        <div className="font-bold">{packet.proto}</div>
                    </div>
                    <div className={`flex-1 p-3 rounded border-2 font-mono text-center transition-all duration-300 ${getBlockColor(1)}`}>
                        <div className="text-xs uppercase opacity-75">Service</div>
                        <div className="font-bold">{packet.service}</div>
                    </div>
                    <div className={`flex-1 p-3 rounded border-2 font-mono text-center transition-all duration-300 ${getBlockColor(2)}`}>
                        <div className="text-xs uppercase opacity-75">State</div>
                        <div className="font-bold">{packet.conn_state}</div>
                    </div>
                </div>
                {isFinished && (
                    <div className={`mt-3 text-center font-bold ${finalTextColor}`}>
                        Final State: {dfaResult.final_state}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-900 relative">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Network Automata Visualizer</h1>
                <p className="text-gray-600 mt-2">Visualize PDA/DFA validation for IoT Malware detection</p>
            </header>

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
                onSendPacket={handleSendPacket} 
                onValidateHost={handleValidateHost} 
                isLoading={isLoading || !sessionId} 
            />

            <div className="flex gap-6 flex-col lg:flex-row">
                <div className="flex-1 flex flex-col gap-6">
                    
                    {/* Packet Processing Visualization */}
                    {dfaResult && renderPacketVisualization()}

                    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold">DFA Status</h3>
                            <button 
                                onClick={handleGetDerivation}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs font-bold"
                                disabled={isLoading || packetHistory.length === 0}
                            >
                                Show Derivation
                            </button>
                        </div>
                        <div className="flex gap-4 text-sm items-center">
                            <div>Current State: <span className="font-mono font-bold text-blue-600">{currentDFAState}</span></div>
                            <div>Packets Processed: <span className="font-mono font-bold">{packetHistory.length}</span></div>
                        </div>
                    </div>

                    {/* Derivation Modal */}
                    {showDerivation && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white p-6 rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold">Leftmost Derivation</h3>
                                    <button onClick={() => setShowDerivation(false)} className="text-gray-500 hover:text-gray-700">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </button>
                                </div>
                                <div className="font-mono text-xs bg-gray-50 p-4 rounded overflow-y-auto flex-1">
                                    {derivationSteps.map((step, i) => (
                                        <div key={i} className="mb-2 border-b border-gray-100 pb-1 last:border-0">
                                            <span className="text-gray-400 mr-3 inline-block w-8 text-right">{i+1}.</span>
                                            {step.split(' ').map((token, j) => {
                                                if (token.startsWith('proto=') || token.startsWith('service=') || token.startsWith('state=')) {
                                                    return <span key={j} className="text-green-600 font-bold mr-1">{token}</span>;
                                                }
                                                // Highlight non-terminals (usually uppercase)
                                                if (/^[A-Z][A-Z0-9_]*$/.test(token)) {
                                                     return <span key={j} className="text-blue-600 font-bold mr-1">{token}</span>;
                                                }
                                                return <span key={j} className="mr-1">{token}</span>;
                                            })}
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <button onClick={() => setShowDerivation(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded">Close</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DFA Controls */}
                    {dfaResult && (
                        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                            <h4 className="text-sm font-bold text-gray-500 mb-2 uppercase">DFA Playback</h4>
                            <Controls
                                isPlaying={isDfaPlaying}
                                onPlayPause={() => setIsDfaPlaying(!isDfaPlaying)}
                                onNext={handleDfaNext}
                                onPrev={handleDfaPrev}
                                onReset={handleDfaReset}
                                canNext={currentDfaStepIndex < dfaResult.steps.length} // Allow going to "finished" state
                                canPrev={currentDfaStepIndex > 0}
                                currentStep={currentDfaStepIndex} // 0-based index passed to Controls which adds 1
                                totalSteps={dfaResult.steps.length + 1} // +1 for finished state
                            />
                        </div>
                    )}

                    <GraphView data={graphData} activeNodeId={currentDFAState} />

                    {validationResult && (
                        <Controls
                            isPlaying={isPlaying}
                            onPlayPause={() => setIsPlaying(!isPlaying)}
                            onNext={handleNext}
                            onPrev={handlePrev}
                            onReset={handleReset}
                            canNext={currentStepIndex < validationResult.trace.length - 1}
                            canPrev={currentStepIndex > 0}
                            currentStep={currentStepIndex}
                            totalSteps={validationResult.trace.length}
                        />
                    )}
                </div>

                <div className="flex flex-col gap-6 w-full lg:w-80">
                    {/* Packet History Log */}
                    <div className="bg-white p-4 rounded-lg shadow border border-gray-200 h-64 flex flex-col">
                        <h3 className="font-semibold mb-2">Packet History</h3>
                        <div className="flex-1 overflow-y-auto text-xs font-mono space-y-1">
                            {packetHistory.map((p, i) => (
                                <div key={i} className="p-1 border-b border-gray-100 hover:bg-gray-50">
                                    <span className="text-gray-400 mr-2">#{i+1}</span>
                                    <span className="text-blue-600">{p.proto}</span>/
                                    <span className="text-green-600">{p.service}</span> 
                                    <span className="ml-2 font-bold">{p.conn_state}</span>
                                </div>
                            ))}
                            {packetHistory.length === 0 && <div className="text-gray-400 italic">No packets sent</div>}
                        </div>
                    </div>

                    {validationResult && (
                        <>
                            <StackView stack={currentStep?.stack || []} />
                            
                            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                                <h3 className="font-semibold mb-2">PDA Step Info</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Action:</span>
                                        <span className="font-mono font-bold text-blue-600">{currentStep?.action || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Symbol:</span>
                                        <span className="font-mono">{currentStep?.symbol || '-'}</span>
                                    </div>
                                    <div className="mt-4 pt-2 border-t border-gray-100">
                                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Validation Status</div>
                                        <div className={`font-bold text-lg ${validationResult.is_valid ? 'text-green-600' : 'text-red-600'}`}>
                                            {validationResult.is_valid ? 'VALID' : 'INVALID'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;
