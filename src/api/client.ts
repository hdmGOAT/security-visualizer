const API_BASE = 'http://localhost:8080/api';

export interface Packet {
    proto: string;
    service: string;
    conn_state: string;
    // host_id and data removed — only symbols used by DFA/PDA are kept
}

// sessions removed: no SessionResponse

export interface DFAStep {
    current_state: string;
    symbol: string;
    next_state: string;
}

export interface DFAPacketResponse {
    steps: DFAStep[];
    final_state: string;
    is_malicious: boolean;
    label: string;
}

export interface RequestProcessingResponse {
    pda: PDAValidationResponse;
    packets: DFAPacketResponse[];
    is_malicious?: boolean;
}

export interface StackOperation {
    step_index: number;
    action: string;
    symbol: string;
    stack: string[];
    current_state?: string;
    next_state?: string;
}

export interface PDAValidationResponse {
    is_valid: boolean;
    trace: StackOperation[];
}

export interface GraphData {
    nodes: { id: string; label: string; is_accepting: boolean; is_start: boolean }[];
    edges: { source: string; target: string; label: string }[];
}

export const api = {
    sendPacket: async (packet: Packet): Promise<DFAPacketResponse> => {
        const response = await fetch(`${API_BASE}/dfa/step`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ packet }),
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || 'Failed to send packet');
        }
        return response.json();
    },
    validateHistory: async (history: string[]): Promise<PDAValidationResponse> => {
        const response = await fetch(`${API_BASE}/pda/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ history }),
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || 'Validation failed');
        }
        return response.json();
    },

    getGraph: async (): Promise<GraphData> => {
        const response = await fetch(`${API_BASE}/graph`);
        if (!response.ok) throw new Error('Failed to fetch graph');
        return response.json();
    },

    getPDAGraph: async (): Promise<GraphData> => {
        const response = await fetch(`${API_BASE}/pda/graph`);
        if (!response.ok) throw new Error('Failed to fetch PDA graph');
        return response.json();
    },

    getDerivation: async (packet: Packet): Promise<{ steps: string[] }> => {
        const response = await fetch(`${API_BASE}/derivation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ packet }),
        });
        if (!response.ok) throw new Error('Failed to fetch derivation');
        return response.json();
    },

    sendRequest: async (packets: Packet[], threshold = 1): Promise<RequestProcessingResponse> => {
        const response = await fetch(`${API_BASE}/request/process`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ packets, threshold }),
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || 'Failed to send request');
        }
        return response.json();
    }
};
