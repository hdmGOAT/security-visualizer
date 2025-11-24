import React, { useEffect } from 'react';
import ReactFlow, { 
    Background, 
    Controls, 
    useNodesState, 
    useEdgesState,
    MarkerType
} from 'reactflow';
import type { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import type { GraphData } from '../api/client';

interface GraphViewProps {
    data?: GraphData;
    activeNodeId?: string;
}

export const GraphView: React.FC<GraphViewProps> = ({ data, activeNodeId }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    useEffect(() => {
        if (!data) return;

        const newNodes: Node[] = data.nodes.map((node, index) => {
            // Simple circular layout
            const angle = (index / data.nodes.length) * 2 * Math.PI;
            const radius = 300;
            return {
                id: node.id,
                position: {
                    x: Math.cos(angle) * radius + 400,
                    y: Math.sin(angle) * radius + 300
                },
                data: { label: node.label, isStart: node.is_start, isAccepting: node.is_accepting },
                style: {
                    background: node.is_start ? '#e0f2fe' : '#fff',
                    // Double circle for accepting states
                    border: node.is_accepting ? '4px double #dc2626' : (node.is_start ? '2px solid #0284c7' : '1px solid #777'),
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    transition: 'background-color 0.3s ease'
                }
            };
        });

        // Group edges by source and target
        const edgeMap = new Map<string, { source: string; target: string; labels: string[] }>();

        data.edges.forEach(edge => {
            const key = `${edge.source}-${edge.target}`;
            if (!edgeMap.has(key)) {
                edgeMap.set(key, { source: edge.source, target: edge.target, labels: [] });
            }
            edgeMap.get(key)!.labels.push(edge.label);
        });

        const newEdges: Edge[] = Array.from(edgeMap.values()).map((edge, i) => ({
            id: `e${i}`,
            source: edge.source,
            target: edge.target,
            label: edge.labels.join(',\n'), // CSV labels with newlines for readability if too long
            type: 'default', // Bezier curve for curved lines
            markerEnd: {
                type: MarkerType.ArrowClosed,
            },
            style: { stroke: '#555' },
            labelStyle: { fill: '#555', fontWeight: 700, fontSize: 10 }
        }));

        setNodes(newNodes);
        setEdges(newEdges);
    }, [data, setNodes, setEdges]);

    useEffect(() => {
        setNodes((nds) =>
            nds.map((node) => {
                const isActive = node.id === activeNodeId;
                const isStart = node.data.isStart;
                const isAccepting = node.data.isAccepting;
                const baseBorder = isAccepting ? '4px double #dc2626' : (isStart ? '2px solid #0284c7' : '1px solid #777');
                
                return {
                    ...node,
                    style: {
                        ...node.style,
                        background: isActive ? '#fde047' : (isStart ? '#e0f2fe' : '#fff'),
                        // transform: isActive ? 'scale(1.2)' : 'scale(1)', // Removing transform to avoid conflict with React Flow positioning
                        zIndex: isActive ? 10 : 1,
                        boxShadow: isActive ? '0 0 15px rgba(253, 224, 71, 1)' : 'none',
                        border: isActive ? '3px solid #eab308' : baseBorder
                    },
                };
            })
        );
    }, [activeNodeId, setNodes]);

    return (
        <div className="h-[600px] w-full border border-gray-200 rounded-lg bg-gray-50 shadow-inner">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
            >
                <Background color="#aaa" gap={16} />
                <Controls />
            </ReactFlow>
        </div>
    );
};
