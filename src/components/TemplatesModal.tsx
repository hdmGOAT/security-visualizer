import React from 'react';
import type { Packet } from '../api/client';
import { Button } from './ui/Button';

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
    const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

    const entriesFor = (cat: string) => (cats as any)[cat] as TemplateEntry[] | undefined;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Choose a Request Template</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">Close</button>
                </div>

                {/* Show category overview first; click into a category to view templates */}
                {!selectedCategory ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.keys(cats).length ? Object.keys(cats).map((cat) => (
                            <div key={cat} className="border rounded p-4 hover:shadow cursor-pointer" onClick={() => setSelectedCategory(cat)}>
                                <div className="flex items-center justify-between">
                                    <div className="font-semibold text-sm uppercase">{cat}</div>
                                    <div className="text-xs text-gray-500">{(entriesFor(cat) || []).length} templates</div>
                                </div>
                                <div className="text-xs text-gray-500 mt-2">Click to view templates in this category</div>
                            </div>
                        )) : (
                            <div className="col-span-3 text-sm text-gray-500 italic">No templates available</div>
                        )}
                    </div>
                ) : (
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setSelectedCategory(null)} className="text-sm text-blue-600">← Back</button>
                                <h4 className="font-semibold text-lg capitalize">{selectedCategory}</h4>
                            </div>
                            <div className="text-xs text-gray-500">{(entriesFor(selectedCategory) || []).length} template(s)</div>
                        </div>
                        <div className="space-y-2">
                            {(entriesFor(selectedCategory) || []).length ? (entriesFor(selectedCategory) || []).map((entry: TemplateEntry, idx: number) => (
                                <div key={idx} className="p-2 rounded hover:bg-gray-50 flex justify-between items-center">
                                    <div>
                                        <div className="font-medium truncate max-w-[28rem]" title={entry.title}>{entry.title}</div>
                                        <div className="text-xs text-gray-500">{entry.packets.length} packet(s)</div>
                                    </div>
                                    <div>
                                        <Button
                                            onClick={() => { onApply(entry.packets); onClose(); }}
                                            variant={(selectedCategory === 'malicious') ? 'danger' : (selectedCategory === 'suspicious') ? 'secondary' : 'primary'}
                                        >
                                            Use
                                        </Button>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-xs text-gray-400 italic">No templates in this category</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TemplatesModal;
