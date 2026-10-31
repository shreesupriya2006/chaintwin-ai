// React Flow Digital Twin Supply Chain Graph
import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TwinNode } from './TwinNode';
import { NetworkSnapshot, DisruptionImpact } from '../../types';

interface TwinGraphProps {
  snapshot: NetworkSnapshot | null;
  impact: DisruptionImpact | null;
  selectedNodeId: string | null;
  selectedOrderId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  isSimulation?: boolean;
}

const nodeTypes = {
  twinNode: TwinNode,
};

export const TwinGraph: React.FC<TwinGraphProps> = ({
  snapshot,
  impact,
  selectedNodeId,
  selectedOrderId,
  onSelectNode,
  isSimulation = false,
}) => {
  // Construct nodes and edges from snapshot
  const { nodes, edges } = useMemo(() => {
    if (!snapshot) return { nodes: [], edges: [] };

    const nodeList: Node[] = [];
    const edgeList: Edge[] = [];

    // Find highlighted order path if an order is selected
    const selectedOrder = selectedOrderId
      ? snapshot.orders.find((o) => o.order_id === selectedOrderId)
      : null;
    const highlightedPathNodes = new Set<string>();
    if (selectedOrder) {
      highlightedPathNodes.add('SUP-01');
      highlightedPathNodes.add('MAT-01');
      highlightedPathNodes.add(selectedOrder.factory_id);
      highlightedPathNodes.add(selectedOrder.dc_id);
      highlightedPathNodes.add(selectedOrder.store_id);
      highlightedPathNodes.add(selectedOrder.customer_id);
    }

    // 1. Suppliers (Col 0: x = 50)
    snapshot.suppliers.slice(0, 5).forEach((sup, idx) => {
      const isDisrupted = impact?.nodeStatuses[sup.supplier_id] === 'disrupted';
      nodeList.push({
        id: sup.supplier_id,
        type: 'twinNode',
        position: { x: 50, y: 40 + idx * 110 },
        data: {
          id: sup.supplier_id,
          name: sup.name,
          type: 'Supplier',
          city: sup.city,
          status: isDisrupted ? 'disrupted' : 'healthy',
          isHighlighted: highlightedPathNodes.has(sup.supplier_id),
        },
      });
    });

    // 2. Materials (Col 1: x = 290)
    snapshot.materials.slice(0, 4).forEach((mat, idx) => {
      const isAffected = impact?.affectedMaterials.some((m) => m.material_id === mat.material_id);
      nodeList.push({
        id: mat.material_id,
        type: 'twinNode',
        position: { x: 290, y: 60 + idx * 120 },
        data: {
          id: mat.material_id,
          name: mat.name,
          type: 'Material',
          stock: mat.material_id === 'MAT-01' ? '13,900 kg' : 'Normal',
          status: isAffected ? 'atRisk' : 'healthy',
          isHighlighted: highlightedPathNodes.has(mat.material_id),
        },
      });
    });

    // Connect Suppliers to Materials
    snapshot.supplierMaterials.forEach((sm) => {
      if (nodeList.some((n) => n.id === sm.supplier_id) && nodeList.some((n) => n.id === sm.material_id)) {
        const isDisrupted = impact?.nodeStatuses[sm.supplier_id] === 'disrupted';
        edgeList.push({
          id: `edge-${sm.supplier_id}-${sm.material_id}`,
          source: sm.supplier_id,
          target: sm.material_id,
          animated: !isDisrupted,
          style: {
            stroke: isDisrupted ? '#ef4444' : '#60a5fa',
            strokeWidth: isDisrupted ? 2.5 : 1.5,
            strokeDasharray: isDisrupted ? '4,4' : undefined,
          },
          markerEnd: { type: MarkerType.ArrowClosed, color: isDisrupted ? '#ef4444' : '#60a5fa' },
        });
      }
    });

    // 3. Factories (Col 2: x = 540)
    snapshot.locations
      .filter((l) => l.type === 'Factory')
      .forEach((fac, idx) => {
        const status = impact?.nodeStatuses[fac.location_id] || 'healthy';
        const cover = impact?.factoryStockProjections[fac.location_id]?.['MAT-01']?.daysOfCover;
        nodeList.push({
          id: fac.location_id,
          type: 'twinNode',
          position: { x: 540, y: 100 + idx * 150 },
          data: {
            id: fac.location_id,
            name: fac.name,
            type: 'Factory',
            city: fac.city,
            stock: cover ? `${cover}d cover` : 'Normal',
            status,
            activeOrdersCount: snapshot.orders.filter((o) => o.factory_id === fac.location_id).length,
            isHighlighted: highlightedPathNodes.has(fac.location_id),
          },
        });

        // Edge Material -> Factory
        edgeList.push({
          id: `edge-mat-${fac.location_id}`,
          source: 'MAT-01',
          target: fac.location_id,
          animated: true,
          style: { stroke: status === 'disrupted' ? '#ef4444' : '#2dd4bf', strokeWidth: 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: status === 'disrupted' ? '#ef4444' : '#2dd4bf' },
        });
      });

    // 4. Distribution Centres (Col 3: x = 790)
    snapshot.locations
      .filter((l) => l.type === 'Distribution Centre')
      .forEach((dc, idx) => {
        const status = impact?.nodeStatuses[dc.location_id] || 'healthy';
        nodeList.push({
          id: dc.location_id,
          type: 'twinNode',
          position: { x: 790, y: 70 + idx * 130 },
          data: {
            id: dc.location_id,
            name: dc.name,
            type: 'Distribution Centre',
            city: dc.city,
            status,
            activeOrdersCount: snapshot.orders.filter((o) => o.dc_id === dc.location_id).length,
            isHighlighted: highlightedPathNodes.has(dc.location_id),
          },
        });
      });

    // Connect Factory -> DC via Routes
    snapshot.routes
      .filter((r) => r.from_id.startsWith('FAC-') && r.to_id.startsWith('DC-'))
      .forEach((r) => {
        edgeList.push({
          id: `edge-rt-${r.route_id}`,
          source: r.from_id,
          target: r.to_id,
          animated: true,
          style: { stroke: '#818cf8', strokeWidth: 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#818cf8' },
        });
      });

    // 5. Stores (Col 4: x = 1040)
    snapshot.locations
      .filter((l) => l.type === 'Store')
      .slice(0, 5)
      .forEach((st, idx) => {
        const status = impact?.nodeStatuses[st.location_id] || 'healthy';
        nodeList.push({
          id: st.location_id,
          type: 'twinNode',
          position: { x: 1040, y: 50 + idx * 105 },
          data: {
            id: st.location_id,
            name: st.name,
            type: 'Store',
            city: st.city,
            status,
            activeOrdersCount: snapshot.orders.filter((o) => o.store_id === st.location_id).length,
            isHighlighted: highlightedPathNodes.has(st.location_id),
          },
        });
      });

    // Connect DC -> Store
    snapshot.routes
      .filter((r) => r.from_id.startsWith('DC-') && r.to_id.startsWith('ST-'))
      .slice(0, 5)
      .forEach((r) => {
        edgeList.push({
          id: `edge-rt-${r.route_id}`,
          source: r.from_id,
          target: r.to_id,
          animated: true,
          style: { stroke: '#a78bfa', strokeWidth: 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#a78bfa' },
        });
      });

    // 6. Customers (Col 5: x = 1290)
    snapshot.customers.forEach((cus, idx) => {
      const status = impact?.nodeStatuses[cus.customer_id] || 'healthy';
      nodeList.push({
        id: cus.customer_id,
        type: 'twinNode',
        position: { x: 1290, y: 60 + idx * 115 },
        data: {
          id: cus.customer_id,
          name: cus.name,
          type: 'Customer',
          city: `Tier: ${cus.priority} (${cus.late_penalty_pct_per_day}%/d)`,
          status,
          activeOrdersCount: snapshot.orders.filter((o) => o.customer_id === cus.customer_id).length,
          isHighlighted: highlightedPathNodes.has(cus.customer_id),
        },
      });
    });

    // Connect Store -> Customer
    snapshot.locations
      .filter((l) => l.type === 'Store' && l.customer_id)
      .forEach((st) => {
        if (st.customer_id) {
          edgeList.push({
            id: `edge-st-${st.location_id}-${st.customer_id}`,
            source: st.location_id,
            target: st.customer_id,
            animated: true,
            style: { stroke: '#10b981', strokeWidth: 1.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
          });
        }
      });

    return { nodes: nodeList, edges: edgeList };
  }, [snapshot, impact, selectedNodeId, selectedOrderId]);

  return (
    <div className="w-full h-full relative bg-slate-950/80 rounded-2xl overflow-hidden border border-slate-800">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        onNodeClick={(_, node) => onSelectNode(node.id)}
        onPaneClick={() => onSelectNode(null)}
        minZoom={0.3}
        maxZoom={1.5}
      >
        <Background color="#334155" gap={24} size={1} />
        <Controls className="bg-slate-900 border border-slate-700 text-white fill-white" />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as any;
            if (data.status === 'disrupted') return '#ef4444';
            if (data.status === 'atRisk') return '#f97316';
            return '#3b82f6';
          }}
          className="bg-slate-900 border border-slate-800 rounded-xl"
        />
      </ReactFlow>
    </div>
  );
};
