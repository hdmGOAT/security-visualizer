import React from 'react';

interface Props {
    title: string;
    items: { label: string; value: React.ReactNode }[];
}

export const StatusPanel: React.FC<Props> = ({ title, items }) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">{title}</h3>
            </div>
            <div className="flex gap-4 text-sm items-center">
                {items.map((it, i) => (
                    <div key={i}>
                        <div className="text-xs text-gray-500">{it.label}</div>
                        <div className="font-mono font-bold text-blue-600">{it.value}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};
