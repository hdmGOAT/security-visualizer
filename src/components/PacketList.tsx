import React from 'react';
import type { Packet } from '../api/client';

interface Props {
    packets: Packet[];
    selectedIndex: number | null;
    onSelect: (idx: number) => void;
    flags?: boolean[]; // optional per-packet suspicious flags
}

export const PacketList: React.FC<Props> = ({ packets, selectedIndex, onSelect, flags }) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 h-64 flex flex-col">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Last Request Packets</h3>
                <div className="text-xs text-gray-500">Click a packet to inspect DFA check</div>
            </div>
            <div className="flex-1 overflow-y-auto text-xs font-mono space-y-1">
                {packets.map((p, i) => {
                    const isSuspicious = flags && flags[i];
                    return (
                    <div key={i}
                         className={`p-1 border-b border-gray-100 cursor-pointer flex justify-between items-center gap-2 transition-colors duration-150 ${selectedIndex === i ? 'bg-gray-200 text-white hover:bg-gray-200' : 'hover:bg-gray-50'}`}
                         onClick={() => onSelect(i)}
                    >
                        <div>
                            <span className="text-gray-400 mr-2">#{i+1}</span>
                            <span className={`mr-1 ${isSuspicious ? 'text-yellow-700' : 'text-blue-600'}`}>{p.proto}</span>/
                            <span className={`${isSuspicious ? 'text-yellow-700' : 'text-green-600'}`}>{p.service}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            {isSuspicious && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Suspicious</span>}
                            <div className="font-bold">{p.conn_state}</div>
                        </div>
                    </div>
                )})}
                {packets.length === 0 && <div className="text-gray-400 italic">No recent request</div>}
            </div>
        </div>
    );
};
