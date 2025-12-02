import React from 'react';

interface Props {
    show: boolean;
    title?: string;
    rules: string[];
    onClose: () => void;
}

export const GrammarModal: React.FC<Props> = ({ show, title = 'Grammar', rules, onClose }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">{title}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <div className="font-mono text-sm bg-gray-50 p-4 rounded overflow-y-auto flex-1">
                    {rules.length === 0 ? (
                        <div className="text-gray-500">No grammar rules available.</div>
                    ) : (
                        rules.map((r, i) => (
                            <div key={i} className="mb-2">
                                <code className="break-words">{r}</code>
                            </div>
                        ))
                    )}
                </div>
                <div className="mt-4 flex justify-end">
                    <button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded">Close</button>
                </div>
            </div>
        </div>
    );
};

export default GrammarModal;
