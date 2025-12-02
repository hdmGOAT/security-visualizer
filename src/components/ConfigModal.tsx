import { useState, useEffect } from 'react';
import { api } from '../api/client';

interface ConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Dataset {
    name: string;
    files: string[];
}

export default function ConfigModal({ isOpen, onClose }: ConfigModalProps) {
    const [status, setStatus] = useState('');
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [selectedDataset, setSelectedDataset] = useState<string>('');
    const [generatorOutput, setGeneratorOutput] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadDatasets();
            setGeneratorOutput('');
            setStatus('');
            setIsLoading(false);
        }
    }, [isOpen]);

    const loadDatasets = async () => {
        try {
            const list = await api.listDatasets();
            setDatasets(list);
        } catch (err: any) {
            setStatus('Error loading datasets: ' + err.message);
        }
    };

    if (!isOpen) return null;

    const handleLoadDataset = async () => {
        if (!selectedDataset) return;
        try {
            setIsLoading(true);
            setStatus('Generating automaton from dataset...');
            setGeneratorOutput('');
            const res = await api.loadDataset(selectedDataset);
            setGeneratorOutput(res.output);
            setStatus('Success! Dataset loaded and automaton generated.');
            // Removed auto-reload to let user see output
        } catch (err: any) {
            setStatus('Error: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReload = () => {
        window.location.reload();
    };

    const handleReset = async () => {
        try {
            setIsLoading(true);
            setStatus('Resetting...');
            await api.resetConfig();
            setStatus('Success! Config reset.');
            setTimeout(() => {
                setStatus('');
                onClose();
                window.location.reload();
            }, 1000);
        } catch (err: any) {
            setStatus('Error: ' + err.message);
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-1/2 max-h-[90vh] overflow-y-auto text-black">
                <h2 className="text-xl font-bold mb-4">Configuration</h2>
                
                <div className="mb-6">
                    <h3 className="font-bold mb-2">Select Dataset (CSV)</h3>
                    <p className="text-sm text-gray-600 mb-2">
                        Select a dataset to generate a new automaton. This will temporarily override the default DFA.
                    </p>
                    <select 
                        className="w-full border p-2 rounded"
                        value={selectedDataset}
                        onChange={e => setSelectedDataset(e.target.value)}
                    >
                        <option value="">-- Select a dataset --</option>
                        {datasets.map(d => (
                            <option key={d.name} value={d.name}>{d.name}</option>
                        ))}
                    </select>
                </div>

                {generatorOutput && (
                    <div className="mb-6">
                        <h3 className="font-bold mb-2">Generator Output</h3>
                        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto max-h-48 border">
                            {generatorOutput}
                        </pre>
                        <div className="mt-2 text-right">
                            <button 
                                onClick={handleReload}
                                className="text-sm text-blue-600 hover:underline"
                            >
                                Reload Page to Apply Changes
                            </button>
                        </div>
                    </div>
                )}

                <div className="mt-4 flex justify-between items-center">
                    <div className="text-sm font-bold text-blue-600">{status}</div>
                    <div className="space-x-2">
                        <button 
                            onClick={handleReset}
                            disabled={isLoading}
                            className={`px-4 py-2 rounded text-white ${isLoading ? 'bg-red-300' : 'bg-red-500 hover:bg-red-600'}`}
                        >
                            Reset to Default
                        </button>
                        <button 
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleLoadDataset}
                            disabled={!selectedDataset || isLoading}
                            className={`px-4 py-2 rounded text-white ${(!selectedDataset || isLoading) ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-600'}`}
                        >
                            {isLoading ? 'Processing...' : 'Load & Generate'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
