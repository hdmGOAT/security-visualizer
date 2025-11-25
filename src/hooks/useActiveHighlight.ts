import { useMemo } from 'react';
import type { DFAPacketResponse, PDAValidationResponse } from '../api/client';

export function useActiveHighlight(opts: {
    dfaResult: DFAPacketResponse | null;
    currentDfaStepIndex: number;
    validationResult: PDAValidationResponse | null;
    currentStepIndex: number;
    currentDFAState: string;
}) {
    const { dfaResult, currentDfaStepIndex, validationResult, currentStepIndex, currentDFAState } = opts;

    return useMemo(() => {
        let activeNodeId = currentDFAState;
        let activeEdge: { source: string; target: string } | null = null;

        if (dfaResult) {
            // DFA playback takes precedence
            if (dfaResult && currentDfaStepIndex >= 0 && currentDfaStepIndex < dfaResult.steps.length) {
                const step = dfaResult.steps[currentDfaStepIndex];
                activeNodeId = step.current_state || currentDFAState;
                if (step && step.current_state && step.next_state) {
                    activeEdge = { source: step.current_state, target: step.next_state };
                }
            } else if (dfaResult) {
                activeNodeId = dfaResult.final_state || currentDFAState;
            }
        } else if (validationResult && validationResult.trace && validationResult.trace.length > 0) {
            if (currentStepIndex < 0) {
                activeNodeId = currentDFAState;
            } else if (currentStepIndex >= validationResult.trace.length) {
                const last = validationResult.trace[validationResult.trace.length - 1];
                activeNodeId = (last && (last.next_state || last.current_state)) || currentDFAState;
            } else {
                const step = validationResult.trace[currentStepIndex];
                if (currentStepIndex === validationResult.trace.length - 1) {
                    activeNodeId = (step && (step.next_state || step.current_state)) || currentDFAState;
                } else {
                    activeNodeId = (step && (step.current_state || step.next_state)) || currentDFAState;
                }

                if (step && step.current_state && step.next_state) {
                    activeEdge = { source: step.current_state, target: step.next_state };
                }
            }
        }

        return { activeNodeId, activeEdge } as const;
    }, [dfaResult, currentDfaStepIndex, validationResult, currentStepIndex, currentDFAState]);
}
