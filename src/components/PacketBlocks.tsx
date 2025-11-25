import React from 'react';

interface Props {
    proto?: string;
    service?: string;
    state?: string;
    activeIndex?: number; // 0=proto,1=service,2=state
}

export const PacketBlocks: React.FC<Props> = ({ proto = '-', service = '-', state = '-', activeIndex = -1 }) => {
    const getClass = (i: number) => {
        if (activeIndex === i) return 'bg-yellow-400 border-yellow-600 text-yellow-900 animate-pulse';
        if (activeIndex > i) return 'bg-green-500 border-green-700 text-white';
        return 'bg-gray-200 border-gray-300 text-gray-500';
    };

    return (
        <div className={`p-4 rounded-lg border-2 mb-4 transition-colors duration-500 bg-white border-gray-200`}>
            <div className="flex gap-2">
                <div className={`flex-1 p-3 rounded border-2 font-mono text-center transition-all duration-300 ${getClass(0)}`}>
                    <div className="text-xs uppercase opacity-75">Protocol</div>
                    <div className="font-bold">{proto}</div>
                </div>
                <div className={`flex-1 p-3 rounded border-2 font-mono text-center transition-all duration-300 ${getClass(1)}`}>
                    <div className="text-xs uppercase opacity-75">Service</div>
                    <div className="font-bold">{service}</div>
                </div>
                <div className={`flex-1 p-3 rounded border-2 font-mono text-center transition-all duration-300 ${getClass(2)}`}>
                    <div className="text-xs uppercase opacity-75">State</div>
                    <div className="font-bold">{state}</div>
                </div>
            </div>
        </div>
    );
};
