import React, { useState, useEffect } from 'react';
import type { Packet } from '../api/client';
import TemplatesModal from './TemplatesModal';

interface InputSectionProps {
    onSendRequest: (hostId: string, packets: Packet[], threshold: number) => void;
    isLoading: boolean;
}

const PROTO_OPTIONS = ['tcp', 'udp', 'icmp'];
const SERVICE_OPTIONS = ['http', 'dns', 'dhcp', 'ssh', 'ssl', '-'];
const STATE_OPTIONS = ['S0', 'S1', 'SF', 'REJ', 'S2', 'RSTO', 'RSTR', 'RSTOS0', 'OTH', 'SH'];

export const InputSection: React.FC<InputSectionProps> = ({ onSendRequest, isLoading }) => {
    const [hostId, setHostId] = useState<string>('192.168.1.100');
    const [threshold, setThreshold] = useState<number>(1);
    const [packets, setPackets] = useState<Packet[]>([
        { proto: 'tcp', service: 'http', conn_state: 'S0', host_id: hostId }
    ]);
    const [templates, setTemplates] = useState<any | undefined>(undefined);
    const [showTemplates, setShowTemplates] = useState(false);

    // Templates produce full request packet sequences
    const applyTemplate = (template: 'tcp'|'udp'|'icmp') => {
        if (template === 'tcp') {
            const seq: Packet[] = [
                { proto: 'tcp', service: 'http', conn_state: 'S0', host_id: hostId, data: 'GET / HTTP/1.1' },
                { proto: 'tcp', service: 'http', conn_state: 'S1', host_id: hostId, data: '200 OK' },
                { proto: 'tcp', service: 'http', conn_state: 'SF', host_id: hostId, data: '' },
            ];
            setPackets(seq);
        } else if (template === 'udp') {
            const seq: Packet[] = [
                { proto: 'udp', service: 'dns', conn_state: 'SF', host_id: hostId, data: 'DNS_QUERY' },
            ];
            setPackets(seq);
        } else if (template === 'icmp') {
            const seq: Packet[] = [
                { proto: 'icmp', service: '-', conn_state: 'SF', host_id: hostId, data: 'ping' },
            ];
            setPackets(seq);
        }
    };

    useEffect(() => {
        // Load templates.json from public/ folder
        fetch('/templates.json')
            .then(r => r.json())
            .then(setTemplates)
            .catch(() => setTemplates(undefined));
    }, []);

    const updatePacket = (idx: number, patch: Partial<Packet>) => {
        setPackets(prev => prev.map((p, i) => i === idx ? { ...p, ...patch, host_id: hostId } : p));
    };

    const removePacket = (idx: number) => {
        setPackets(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (packets.length === 0) return;
        // Ensure host_id assigned on all packets
        const normalized = packets.map(p => ({ ...p, host_id: hostId }));
        onSendRequest(hostId, normalized, threshold);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <div className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold text-gray-700">Request Builder</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Host ID</label>
                        <input
                            type="text"
                            value={hostId}
                            onChange={(e) => setHostId(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Choose Request Template</label>
                        <div className="flex gap-2 items-center">
                            <button onClick={() => setShowTemplates(true)} className="bg-blue-600 text-white px-3 py-2 rounded">Open Templates</button>
                            <div className="text-xs text-gray-500 ml-3">Or quick: </div>
                            <button onClick={() => applyTemplate('tcp')} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">TCP</button>
                            <button onClick={() => applyTemplate('udp')} className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs">UDP</button>
                            <button onClick={() => applyTemplate('icmp')} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">ICMP</button>
                        </div>
                    </div>

                    <div className="text-right">
                        <label className="block text-sm font-medium text-gray-700 mb-1 invisible">Send</label>
                        <div className="mb-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Malicious Threshold (packets)</label>
                            <input aria-label="malicious-threshold" type="number" min={1} value={threshold} onChange={(e) => setThreshold(Math.max(1, Number(e.target.value || 1)))} className="w-full p-2 border border-gray-300 rounded" />
                            <div className="text-xs text-gray-500 mt-1">Number of packet-level detections required to flag the whole request as malicious.</div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={handleSend}
                                disabled={isLoading}
                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                                Send Request
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-4 space-y-3">
                    {packets.map((p, idx) => (
                        <div key={idx} className="p-3 border border-gray-100 rounded grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
                            <div className="md:col-span-2">
                                <label className="text-xs text-gray-600">Protocol</label>
                                <select value={p.proto} onChange={(e) => updatePacket(idx, { proto: e.target.value })} className="w-full p-2 border rounded">
                                    {PROTO_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-600">Service</label>
                                <select value={p.service} onChange={(e) => updatePacket(idx, { service: e.target.value })} className="w-full p-2 border rounded">
                                    {SERVICE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-600">State</label>
                                <select value={p.conn_state} onChange={(e) => updatePacket(idx, { conn_state: e.target.value })} className="w-full p-2 border rounded">
                                    {STATE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-600">Host</label>
                                <input value={p.host_id} onChange={(e) => updatePacket(idx, { host_id: e.target.value })} className="w-full p-2 border rounded" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-600">Data</label>
                                <input value={p.data || ''} onChange={(e) => updatePacket(idx, { data: e.target.value })} className="w-full p-2 border rounded" />
                            </div>
                            <div className="flex gap-2 md:justify-end">
                                <button onClick={() => removePacket(idx)} className="bg-red-500 text-white px-3 py-2 rounded">Remove</button>
                            </div>
                        </div>
                    ))}
                    {packets.length === 0 && <div className="text-gray-400 italic">No packets in request. Add one using templates above.</div>}
                </div>

                {/* legacy validate button removed — PDA validation is performed as part of Requests */}
            </div>

            <TemplatesModal show={showTemplates} templates={templates} onClose={() => setShowTemplates(false)} onApply={(pks) => {
                // ensure host_id is set to current hostId for each packet
                const normalized = pks.map(pk => ({ ...pk, host_id: hostId }));
                setPackets(normalized);
            }} />
        </div>
    );
};
