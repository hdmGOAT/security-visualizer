import React, { useEffect, useState } from 'react';
import CustomSelfLoopEdge from './CustomSelfLoopEdge';
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
    activeEdge?: { source: string; target: string } | null;
}

export const GraphView: React.FC<GraphViewProps> = ({ data, activeNodeId, activeEdge }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; text: string }>({ visible: false, x: 0, y: 0, text: '' });
    const [, setExpandedEdges] = useState<Set<string>>(new Set());

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

            const newEdges: Edge[] = Array.from(edgeMap.values()).map((edge, i) => {
            const id = `e${i}`;
            const fullLabel = edge.labels.join(', ');
            const isSelf = edge.source === edge.target;
            // For self-loops, increase stroke width and offset the label so it doesn't overlap the node.
            const baseStyle: any = { stroke: isSelf ? '#1e40af' : '#555', strokeWidth: isSelf ? 3 : 1 };
            const labelStyle: any = { fill: '#111', fontWeight: 700, fontSize: 11 };
            if (isSelf) {
                // Move label above the node for better readability
                labelStyle.transform = 'translateY(-28px)';
            }

                if (isSelf) {
                const onHover = (x: number, y: number) => setTooltip({ visible: true, x, y, text: fullLabel });
                const onMove = (x: number, y: number) => setTooltip(t => ({ ...t, x, y }));
                const onLeave = () => setTooltip({ visible: false, x: 0, y: 0, text: '' });
                const onClick = () => { /* handled in custom edge */ };

                return {
                    id,
                    source: edge.source,
                    target: edge.target,
                    label: '', // label handled by custom self-loop edge renderer for self loops
                    data: { fullLabel, onHover, onMove, onLeave, onClick, key: `${edge.source}-${edge.target}` },
                    type: 'selfLoop',
                    // omit arrowheads on self-loops to reduce overlap
                    markerEnd: undefined,
                    style: {
                        ...baseStyle,
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round'
                    },
                    animated: true,
                    // remove label background so label text overlays cleanly; offset self-loop labels higher
                    labelStyle: { ...labelStyle, transform: 'translateY(-36px)', background: 'transparent' },
                } as Edge;
            }

            return {
                id,
                source: edge.source,
                target: edge.target,
                label: edge.labels.join(',\n'),
                data: { fullLabel, key: `${edge.source}-${edge.target}` },
                type: 'default',
                markerEnd: { type: MarkerType.ArrowClosed },
                style: { stroke: '#555' },
                labelStyle: { fill: '#333', fontWeight: 700, fontSize: 10, pointerEvents: 'none' }
            } as Edge;
        });

        setNodes(newNodes);
        setEdges(newEdges);
    }, [data, setNodes, setEdges]);

    // When activeEdge changes, update edge styles to highlight the matching edge
    useEffect(() => {
        if (!activeEdge) {
            // reset highlight
            setEdges(eds => eds.map(e => ({ ...e, style: { ...(e.style || {}), stroke: e.type === 'selfLoop' ? '#1e40af' : '#555', strokeWidth: undefined }, animated: e.type === 'selfLoop' ? true : false })));
            return;
        }

        const key = `${activeEdge.source}-${activeEdge.target}`;
        setEdges(eds => eds.map(e => {
            const eKey = (e.data && (e.data as any).key) || `${e.source}-${e.target}`;
            if (eKey === key) {
                return {
                    ...e,
                    style: { ...(e.style || {}), stroke: '#f59e0b', strokeWidth: 4 },
                    animated: true
                } as Edge;
            }
            // dim other edges slightly
            return {
                ...e,
                style: { ...(e.style || {}), stroke: '#bbb', strokeWidth: e.type === 'selfLoop' ? 2 : 1 },
                animated: false
            } as Edge;
        }));
    }, [activeEdge, setEdges]);

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

    // Edge hover/click handlers
    const onEdgeMouseEnter = (_: any, edge: Edge) => {
        const full = (edge.data && (edge.data as any).fullLabel) || edge.label || '';
        setTooltip({ visible: true, x: 0, y: 0, text: full });
    };

    const onEdgeMouseMove = (event: React.MouseEvent, _edge: Edge) => {
        setTooltip(t => ({ ...t, x: event.clientX + 12, y: event.clientY + 12 }));
    };

    const onEdgeMouseLeave = (_: any) => {
        setTooltip({ visible: false, x: 0, y: 0, text: '' });
    };

    const onEdgeClick = (_: any, edge: Edge) => {
        setExpandedEdges(prev => {
            const copy = new Set(prev);
            if (copy.has(edge.id)) {
                copy.delete(edge.id);
            } else {
                copy.add(edge.id);
            }
            setEdges(eds => eds.map(e => {
                if (e.id === edge.id) {
                    const full = (edge.data && (edge.data as any).fullLabel) || '';
                    return { ...e, label: copy.has(edge.id) ? full : (full.length > 60 ? full.slice(0,57) + '…' : full) } as Edge;
                }
                return e;
            }));
            return copy;
        });
    };

    return (
        <div className="h-[600px] w-full border border-gray-200 rounded-lg bg-gray-50 shadow-inner">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onEdgeMouseEnter={onEdgeMouseEnter}
                onEdgeMouseMove={onEdgeMouseMove}
                onEdgeMouseLeave={onEdgeMouseLeave}
                onEdgeClick={onEdgeClick}
                fitView
                edgeTypes={{ selfLoop: CustomSelfLoopEdge }}
            >
                <Background color="#aaa" gap={16} />
                <Controls />
            </ReactFlow>

            {tooltip.visible && (
                <div style={{ position: 'fixed', left: tooltip.x, top: tooltip.y, zIndex: 9999, pointerEvents: 'none' }}>
                    <div className="bg-white border border-gray-300 text-sm p-2 rounded shadow">
                        <div className="font-mono text-xs">{tooltip.text}</div>
                    </div>
                </div>
            )}
        </div>
    );
};
