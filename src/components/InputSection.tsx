import React, { useState } from 'react';
import type { Packet } from '../api/client';

interface InputSectionProps {
    onSendPacket: (packet: Packet) => void;
    onValidateHost: (hostId: string) => void;
    isLoading: boolean;
}

const PROTO_OPTIONS = ['tcp', 'udp', 'icmp'];
const SERVICE_OPTIONS = ['http', 'dns', 'dhcp', 'ssh', 'ssl', '-'];
const STATE_OPTIONS = ['S0', 'S1', 'SF', 'REJ', 'S2', 'S3', 'RSTO', 'RSTR', 'RSTOS0', 'OTH', 'SH', 'SHR'];

export const InputSection: React.FC<InputSectionProps> = ({ onSendPacket, onValidateHost, isLoading }) => {
    const [packet, setPacket] = useState<Packet>({
        proto: 'tcp',
        service: 'http',
        conn_state: 'S0',
        host_id: '192.168.1.100'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSendPacket(packet);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <div className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold text-gray-700">Packet Simulator</h2>
                
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Host ID</label>
                        <input
                            type="text"
                            value={packet.host_id}
                            onChange={(e) => setPacket({ ...packet, host_id: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Protocol</label>
                        <select
                            value={packet.proto}
                            onChange={(e) => setPacket({ ...packet, proto: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        >
                            {PROTO_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                        <select
                            value={packet.service}
                            onChange={(e) => setPacket({ ...packet, service: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        >
                            {SERVICE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                        <select
                            value={packet.conn_state}
                            onChange={(e) => setPacket({ ...packet, conn_state: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        >
                            {STATE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors h-[42px]"
                    >
                        Send Packet
                    </button>
                </form>

                <div className="border-t pt-4 mt-2">
                    <button
                        onClick={() => onValidateHost(packet.host_id)}
                        disabled={isLoading}
                        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50 transition-colors w-full md:w-auto"
                    >
                        Validate Host History (PDA)
                    </button>
                </div>
            </div>
        </div>
    );
};
