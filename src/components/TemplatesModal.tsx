import React from 'react';
import type { Packet } from '../api/client';

interface TemplateEntry {
    title: string;
    packets: Packet[];
}

interface TemplatesFile {
    categories: {
        benign?: TemplateEntry[];
        suspicious?: TemplateEntry[];
        malicious?: TemplateEntry[];
        [key: string]: TemplateEntry[] | undefined;
    };
}

interface Props {
    show: boolean;
    onClose: () => void;
    templates?: TemplatesFile;
    onApply: (packets: Packet[]) => void;
}

const TemplatesModal: React.FC<Props> = ({ show, onClose, templates, onApply }) => {
    if (!show) return null;

    const cats = templates?.categories || {};

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Choose a Request Template</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">Close</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.keys(cats).length ? Object.keys(cats).map((cat) => (
                        <div key={cat} className="border rounded p-3">
                            <h4 className="font-semibold mb-2 text-sm uppercase">{cat}</h4>
                            <div className="space-y-2">
                                {(cats as any)[cat]?.length ? (cats as any)[cat].map((entry: TemplateEntry, idx: number) => (
                                    <div key={idx} className="p-2 rounded hover:bg-gray-50 flex justify-between items-center">
                                        <div>
                                            <div className="font-medium truncate max-w-[12rem]" title={entry.title}>{entry.title}</div>
                                            <div className="text-xs text-gray-500">{entry.packets.length} packet(s)</div>
                                        </div>
                                        <div>
                                            <button
                                                onClick={() => { onApply(entry.packets); onClose(); }}
                                                className={`inline-flex items-center px-3 py-1 rounded text-sm font-medium ${cat === 'malicious' ? 'bg-red-600 text-white' : cat === 'suspicious' ? 'bg-yellow-500 text-white' : 'bg-green-600 text-white'}`}
                                            >
                                                Use
                                            </button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-xs text-gray-400 italic">No templates</div>
                                )}
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-3 text-sm text-gray-500 italic">No templates available</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TemplatesModal;
