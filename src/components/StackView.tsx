import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StackViewProps {
    stack: string[];
}

export const StackView: React.FC<StackViewProps> = ({ stack }) => {
    return (
        <div className="w-64 bg-gray-100 p-4 rounded-lg border border-gray-200 h-[600px] flex flex-col">
            <h3 className="text-lg font-semibold mb-4 text-center text-gray-700">Stack</h3>
            <div className="flex-1 overflow-y-auto flex flex-col-reverse gap-2 p-2 bg-white rounded border border-gray-300 shadow-inner">
                <AnimatePresence>
                    {stack.map((item, index) => (
                        <motion.div
                            key={`${index}-${item}`}
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="bg-blue-100 border border-blue-300 p-2 rounded text-center font-mono text-sm text-blue-800"
                        >
                            {item}
                        </motion.div>
                    ))}
                </AnimatePresence>
                {stack.length === 0 && (
                    <div className="text-center text-gray-400 italic mt-auto mb-auto">Empty Stack</div>
                )}
            </div>
        </div>
    );
};
