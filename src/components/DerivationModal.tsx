import React from 'react';

interface Props {
    show: boolean;
    steps: string[];
    onClose: () => void;
}

export const DerivationModal: React.FC<Props> = ({ show, steps, onClose }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Leftmost Derivation</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <div className="font-mono text-xs bg-gray-50 p-4 rounded overflow-y-auto flex-1">
                    {steps.map((step, i) => (
                        <div key={i} className="mb-2 border-b border-gray-100 pb-1 last:border-0">
                            <span className="text-gray-400 mr-3 inline-block w-8 text-right">{i+1}.</span>
                            {step.split(' ').map((token, j) => {
                                if (token.startsWith('proto=') || token.startsWith('service=') || token.startsWith('state=')) {
                                    return <span key={j} className="text-green-600 font-bold mr-1">{token}</span>;
                                }
                                if (/^[A-Z][A-Z0-9_]*$/.test(token)) {
                                    return <span key={j} className="text-blue-600 font-bold mr-1">{token}</span>;
                                }
                                return <span key={j} className="mr-1">{token}</span>;
                            })}
                        </div>
                    ))}
                </div>
                <div className="mt-4 flex justify-end">
                    <button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded">Close</button>
                </div>
            </div>
        </div>
    );
};

export default DerivationModal;
