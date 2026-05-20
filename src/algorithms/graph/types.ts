export type Node = { id: number; x: number; y: number; label?: string };
export type Edge = { from: number; to: number; weight: number; directed?: boolean };

export type GraphInput = {
  nodes: Node[];
  edges: Edge[];
};

export type GraphState = {
  highlightedEdges: Set<string>;  // "from-to"
  rejectedEdges: Set<string>;
  highlightedNodes: Map<number, string>; // nodeId -> color or label
  nodeOrder?: number[];            // topo order (running)
  nodeStack?: number[];            // dfs stack for tarjan
  totalWeight?: number;
  note?: string;
  line?: number;
};

export const edgeKey = (a: number, b: number, directed = false) =>
  directed ? `${a}->${b}` : a < b ? `${a}-${b}` : `${b}-${a}`;

export type GraphAlgo = (g: GraphInput) => Generator<GraphState, void, void>;

export function initialGraphState(): GraphState {
  return {
    highlightedEdges: new Set(),
    rejectedEdges: new Set(),
    highlightedNodes: new Map(),
  };
}
