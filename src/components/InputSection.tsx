import React, { useState, useEffect } from 'react';
import type { Packet } from '../api/client';
import TemplatesModal from './TemplatesModal';
import Collapsible from './ui/Collapsible';
import { DndContext } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface InputSectionProps {
    onSendRequest: (packets: Packet[], threshold: number) => void;
    isLoading: boolean;
}

const PROTO_OPTIONS = ['tcp', 'udp', 'icmp'];
const SERVICE_OPTIONS = ['http', 'dns', 'dhcp', 'ssh', 'ssl', '-'];
const STATE_OPTIONS = ['S0', 'S1', 'SF', 'REJ', 'S2', 'RSTO', 'RSTR', 'RSTOS0', 'OTH', 'SH'];

export const InputSection: React.FC<InputSectionProps> = ({ onSendRequest, isLoading }) => {
    const [threshold, setThreshold] = useState<number>(3);
    const [packets, setPackets] = useState<Packet[]>([
        { proto: 'tcp', service: 'http', conn_state: 'S0' }
    ]);
    const [templates, setTemplates] = useState<any | undefined>(undefined);
    const [showTemplates, setShowTemplates] = useState(false);

    // Templates produce full request packet sequences

    useEffect(() => {
        // Load templates.json from public/ folder
        // Use import.meta.env.BASE_URL to respect the deployment base path
        fetch(`${import.meta.env.BASE_URL}templates.json`)
            .then(r => r.json())
            .then(setTemplates)
            .catch(() => setTemplates(undefined));
    }, []);

    const updatePacket = (idx: number, patch: Partial<Packet>) => {
        setPackets(prev => prev.map((p, i) => i === idx ? { ...p, ...patch } : p));
    };

    const removePacket = (idx: number) => {
        setPackets(prev => prev.filter((_, i) => i !== idx));
    };

    // Add a blank packet to the end
    const addPacket = () => {
        setPackets(prev => [...prev, { proto: 'tcp', service: '-', conn_state: 'S0' }]);
    };

    // Reorder packets using dnd-kit
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const from = Number(active.id);
        const to = Number(over.id);
        if (isNaN(from) || isNaN(to)) return;
        setPackets(prev => arrayMove(prev, from, to));
    };

    interface SortablePacketProps {
        id: string;
        idx: number;
        packet: Packet;
        updatePacket: (idx: number, patch: Partial<Packet>) => void;
        removePacket: (idx: number) => void;
        setPackets: React.Dispatch<React.SetStateAction<Packet[]>>;
    }

    const SortablePacketRow: React.FC<SortablePacketProps> = ({ id, idx, packet, updatePacket, removePacket, setPackets }) => {
        const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
        const style: React.CSSProperties = {
            transform: transform ? CSS.Transform.toString(transform) : undefined,
            transition,
            opacity: isDragging ? 0.9 : 1,
        };

        return (
            <div ref={setNodeRef} style={style} className="p-2 border border-gray-100 rounded grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
                <div className="col-span-6 md:col-span-1 flex items-center gap-2">
                    <div className="text-xs text-gray-500">#{idx + 1}</div>
                    <div {...listeners} {...attributes} className="cursor-move text-gray-400">☰</div>
                </div>
                <div className="md:col-span-2">
                    <label className="text-xs text-gray-600">Protocol</label>
                    <select value={packet.proto} onChange={(e) => updatePacket(idx, { proto: e.target.value })} className="w-full p-2 border rounded text-sm">
                        {PROTO_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs text-gray-600">Service</label>
                    <select value={packet.service} onChange={(e) => updatePacket(idx, { service: e.target.value })} className="w-full p-2 border rounded text-sm">
                        {SERVICE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs text-gray-600">State</label>
                    <select value={packet.conn_state} onChange={(e) => updatePacket(idx, { conn_state: e.target.value })} className="w-full p-2 border rounded text-sm">
                        {STATE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
                <div className="flex gap-2 md:justify-end">
                    <button onClick={() => removePacket(idx)} className="bg-red-500 text-white px-3 py-1 rounded text-sm">Remove</button>
                    <button onClick={() => setPackets(prev => {
                        const arr = [...prev];
                        if (idx > 0) {
                            const tmp = arr[idx-1]; arr[idx-1] = arr[idx]; arr[idx] = tmp;
                        }
                        return arr;
                    })} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">Up</button>
                    <button onClick={() => setPackets(prev => {
                        const arr = [...prev];
                        if (idx < arr.length - 1) {
                            const tmp = arr[idx+1]; arr[idx+1] = arr[idx]; arr[idx] = tmp;
                        }
                        return arr;
                    })} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">Down</button>
                </div>
            </div>
        );
    };

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (packets.length === 0) return;
        onSendRequest(packets, threshold);
    };

    return (
        <>
        <Collapsible title={<div className="text-lg font-semibold text-gray-700">Request Builder</div>} defaultOpen={true}>
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <div className="flex flex-col gap-4">

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Choose Request Template</label>
                        <div className="flex gap-2 items-center">
                            <button onClick={() => setShowTemplates(true)} className="bg-blue-600 text-white px-3 py-2 rounded">Open Templates</button>
                            {/* <div className="text-xs text-gray-500 ml-3">Or quick: </div>
                            <button onClick={() => applyTemplate('tcp')} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">TCP</button>
                            <button onClick={() => applyTemplate('udp')} className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs">UDP</button>
                            <button onClick={() => applyTemplate('icmp')} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">ICMP</button> */}
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
                    <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-medium text-gray-700">Packets</div>
                        <div className="flex gap-2">
                            <button onClick={addPacket} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Add Packet</button>
                            <button onClick={() => setPackets([])} className="bg-gray-100 text-gray-800 px-3 py-1 rounded text-sm">Clear</button>
                        </div>
                    </div>
                    <DndContext onDragEnd={handleDragEnd}>
                        <SortableContext items={packets.map((_, i) => String(i))} strategy={verticalListSortingStrategy}>
                            {packets.map((p, idx) => (
                                <SortablePacketRow key={idx} id={String(idx)} idx={idx} packet={p} updatePacket={updatePacket} removePacket={removePacket} setPackets={setPackets} />
                            ))}
                        </SortableContext>
                    </DndContext>
                    {packets.length === 0 && <div className="text-gray-400 italic">No packets in request. Add one using templates above.</div>}
                </div>

                {/* legacy validate button removed — PDA validation is performed as part of Requests */}
            </div>
        </Collapsible>

        <TemplatesModal show={showTemplates} templates={templates} onClose={() => setShowTemplates(false)} onApply={(pks) => {
                // templates may contain host_id/data — strip them and keep only the fields we use
                const normalized = pks.map(pk => ({ proto: pk.proto, service: pk.service, conn_state: pk.conn_state }));
                setPackets(normalized);
            }} />
        </>
    );
};
