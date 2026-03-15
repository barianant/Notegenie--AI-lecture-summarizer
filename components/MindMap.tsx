
import React from 'react';

interface MindMapProps {
  data: {
    nodes: { id: string; label: string; x: number; y: number }[];
    edges: { source: string; target: string }[];
  };
}

const MindMapComponent: React.FC<MindMapProps> = ({ data }) => {
  // Simple SVG-based mind map for demonstration without needing external graph libs
  // Since we want interactive but light
  
  // Calculate bounding box for responsive viewbox
  const padding = 100;
  const minX = Math.min(...data.nodes.map(n => n.x)) - padding;
  const minY = Math.min(...data.nodes.map(n => n.y)) - padding;
  const maxX = Math.max(...data.nodes.map(n => n.x)) + padding;
  const maxY = Math.max(...data.nodes.map(n => n.y)) + padding;
  
  const width = maxX - minX;
  const height = maxY - minY;

  const getNodeColor = (id: string) => {
    const seed = id.length % 4;
    switch(seed) {
      case 0: return 'fill-indigo-500/20 stroke-indigo-400';
      case 1: return 'fill-cyan-500/20 stroke-cyan-400';
      case 2: return 'fill-purple-500/20 stroke-purple-400';
      default: return 'fill-emerald-500/20 stroke-emerald-400';
    }
  };

  return (
    <div className="w-full h-full bg-slate-900 overflow-auto flex items-center justify-center">
      <svg 
        viewBox={`${minX} ${minY} ${width} ${height}`} 
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#475569" />
          </marker>
        </defs>

        {/* Edges */}
        {data.edges.map((edge, i) => {
          const source = data.nodes.find(n => n.id === edge.source);
          const target = data.nodes.find(n => n.id === edge.target);
          if (!source || !target) return null;
          
          return (
            <line
              key={i}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke="#334155"
              strokeWidth="2"
            />
          );
        })}

        {/* Nodes */}
        {data.nodes.map((node, i) => (
          <g key={i} transform={`translate(${node.x}, ${node.y})`}>
            <rect
              x="-60"
              y="-20"
              width="120"
              height="40"
              rx="8"
              className={`transition-all duration-300 hover:brightness-125 ${getNodeColor(node.id)}`}
              strokeWidth="2"
            />
            <text
              textAnchor="middle"
              dy=".3em"
              fill="#e2e8f0"
              fontSize="10"
              fontWeight="600"
              className="pointer-events-none select-none"
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default MindMapComponent;
