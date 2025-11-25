import type { EdgeProps } from 'reactflow';

export default function CustomSelfLoopEdge(props: EdgeProps) {
  const { sourceX = 0, sourceY = 0, data } = props;
  const loopRadius = 45;

  // Offset loop so it renders above the node
  const offsetX = sourceX;
  const offsetY = sourceY - loopRadius;

  // Simple cubic bezier arc
  const path = `M ${sourceX} ${sourceY} C ${offsetX + loopRadius} ${offsetY - loopRadius}, ${offsetX - loopRadius} ${offsetY - loopRadius}, ${sourceX} ${sourceY}`;

  const fullLabel: string = (data && (data as any).fullLabel) || '';

  const onHover = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data && typeof (data as any).onHover === 'function') {
      (data as any).onHover((e as any).clientX, (e as any).clientY);
    }
  };

  const onMove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data && typeof (data as any).onMove === 'function') {
      (data as any).onMove((e as any).clientX, (e as any).clientY);
    }
  };

  const onLeave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data && typeof (data as any).onLeave === 'function') {
      (data as any).onLeave();
    }
  };

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data && typeof (data as any).onClick === 'function') {
      (data as any).onClick();
    }
  };

  // Render path and a small text label above the loop
  return (
    <g className="react-flow__edge" onMouseEnter={onHover} onMouseMove={onMove} onMouseLeave={onLeave} onClick={onClick}>
      <path d={path} fill="none" stroke="#0ea5e9" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <text x={sourceX} y={sourceY - loopRadius - 12} textAnchor="middle" fontSize={11} fontFamily="monospace">
        {fullLabel.length > 60 ? fullLabel.slice(0, 57) + '…' : fullLabel}
      </text>
    </g>
  );
}
