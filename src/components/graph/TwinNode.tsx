// Custom Node Component for React Flow Digital Twin Graph
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  Factory,
  Building2,
  Store,
  Users,
  Truck,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Package,
} from 'lucide-react';

export interface TwinNodeData {
  id: string;
  name: string;
  type: 'Supplier' | 'Material' | 'Factory' | 'Distribution Centre' | 'Store' | 'Customer';
  city?: string;
  state?: string;
  stock?: string;
  daysOfCover?: number;
  activeOrdersCount?: number;
  status?: 'healthy' | 'atRisk' | 'disrupted';
  isHighlighted?: boolean;
}

const getNodeIcon = (type: TwinNodeData['type']) => {
  switch (type) {
    case 'Supplier':
      return Truck;
    case 'Material':
      return Layers;
    case 'Factory':
      return Factory;
    case 'Distribution Centre':
      return Building2;
    case 'Store':
      return Store;
    case 'Customer':
      return Users;
    default:
      return Package;
  }
};

export const TwinNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as TwinNodeData;
  const Icon = getNodeIcon(nodeData.type);

  const status = nodeData.status || 'healthy';

  const getStatusStyles = () => {
    if (status === 'disrupted') {
      return 'border-rose-500 bg-rose-950/40 text-rose-300 ring-2 ring-rose-500/30';
    }
    if (status === 'atRisk') {
      return 'border-amber-500 bg-amber-950/40 text-amber-300 ring-2 ring-amber-500/30';
    }
    return 'border-slate-700 bg-slate-900/90 text-slate-200 hover:border-slate-500';
  };

  return (
    <div
      className={`relative px-3.5 py-2.5 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-200 min-w-[170px] select-none ${getStatusStyles()} ${
        selected ? 'ring-2 ring-blue-500 scale-105' : ''
      } ${nodeData.isHighlighted ? 'ring-2 ring-teal-400 border-teal-400' : ''}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-2.5 h-2.5 bg-slate-400 border border-slate-900"
      />

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-lg ${
              status === 'disrupted'
                ? 'bg-rose-500/20 text-rose-400'
                : status === 'atRisk'
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-blue-500/10 text-blue-400'
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">
              {nodeData.type}
            </div>
            <div className="text-xs font-bold text-white tracking-tight truncate max-w-[110px]">
              {nodeData.name}
            </div>
          </div>
        </div>

        {status === 'disrupted' && (
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
        )}
      </div>

      {/* Node Metrics & Stock Info */}
      <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
        {nodeData.stock ? (
          <span className="text-slate-300 truncate">
            Stock: <strong className="text-white">{nodeData.stock}</strong>
          </span>
        ) : nodeData.city ? (
          <span className="text-slate-400 truncate">{nodeData.city}</span>
        ) : (
          <span className="text-slate-400">Normal</span>
        )}

        {nodeData.activeOrdersCount !== undefined && nodeData.activeOrdersCount > 0 && (
          <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-semibold">
            {nodeData.activeOrdersCount} ord
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-2.5 h-2.5 bg-slate-400 border border-slate-900"
      />
    </div>
  );
});

TwinNode.displayName = 'TwinNode';
