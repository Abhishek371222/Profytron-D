'use client';

import { create } from 'zustand';
import { 
 Connection, 
 Edge, 
 EdgeChange, 
 Node, 
 NodeChange, 
 addEdge, 
 OnNodesChange, 
 OnEdgesChange, 
 OnConnect, 
 applyNodeChanges, 
 applyEdgeChanges 
} from 'reactflow';

export interface NodeData {
 label: string;
 category: 'indicator' | 'condition' | 'action' | 'risk';
 params: Record<string, unknown>;
 description?: string;
}

interface BuilderState {
 nodes: Node<NodeData>[];
 edges: Edge[];
 selectedNodeId: string | null;
 history: { nodes: Node<NodeData>[]; edges: Edge[] }[];
 historyIndex: number;
 strategyName: string;
 isSaving: boolean;
 
 // Actions
 onNodesChange: OnNodesChange;
 onEdgesChange: OnEdgesChange;
 onConnect: OnConnect;
 setNodes: (nodes: Node<NodeData>[]) => void;
 setEdges: (edges: Edge[]) => void;
 selectNode: (id: string | null) => void;
 updateNodeParams: (id: string, params: Record<string, unknown>) => void;
 setStrategyName: (name: string) => void;
 
 // History Actions
 pushToHistory: () => void;
 undo: () => void;
 redo: () => void;
 
 // Complex Actions
 addNodeFromPalette: (type: string, data: NodeData, position: { x: number; y: number }) => void;
 loadTemplate: (nodes: Node<NodeData>[], edges: Edge[]) => void;
}

export const useBuilderStore = create<BuilderState>((set, get) => ({
 nodes: [],
 edges: [],
 selectedNodeId: null,
 history: [],
 historyIndex: -1,
 strategyName:"Untitled Strategy",
 isSaving: false,

 onNodesChange: (changes: NodeChange[]) => {
 set((state) => ({
 nodes: applyNodeChanges(changes, state.nodes),
 }));
 },

 onEdgesChange: (changes: EdgeChange[]) => {
 set((state) => ({
 edges: applyEdgeChanges(changes, state.edges),
 }));
 },

 onConnect: (connection: Connection) => {
 set((state) => {
 const newEdges = addEdge({ ...connection, animated: true, style: { stroke: '#4f46e5' } }, state.edges);
 get().pushToHistory();
 return { edges: newEdges };
 });
 },

 setNodes: (nodes) => set({ nodes }),
 setEdges: (edges) => set({ edges }),

 selectNode: (id) => set({ selectedNodeId: id }),

 updateNodeParams: (id, params) => {
 set((state) => ({
 nodes: state.nodes.map((node) => 
 node.id === id ? { ...node, data: { ...node.data, params: { ...node.data.params, ...params } } } : node
 ),
 }));
 get().pushToHistory();
 },

 setStrategyName: (strategyName) => set({ strategyName }),

 pushToHistory: () => {
 const { nodes, edges, history, historyIndex } = get();
 const newHistory = history.slice(0, historyIndex + 1);
 newHistory.push({ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) });
 
 // Limit history to 20 states
 if (newHistory.length > 20) newHistory.shift();
 
 set({ 
 history: newHistory, 
 historyIndex: newHistory.length - 1 
 });
 },

 undo: () => {
 const { history, historyIndex } = get();
 if (historyIndex > 0) {
 const prevState = history[historyIndex - 1];
 set({ 
 nodes: prevState.nodes, 
 edges: prevState.edges, 
 historyIndex: historyIndex - 1 
 });
 }
 },

 redo: () => {
 const { history, historyIndex } = get();
 if (historyIndex < history.length - 1) {
 const nextState = history[historyIndex + 1];
 set({ 
 nodes: nextState.nodes, 
 edges: nextState.edges, 
 historyIndex: historyIndex + 1 
 });
 }
 },

 addNodeFromPalette: (type, data, position) => {
 const newNode: Node<NodeData> = {
 id: `${type}_${Date.now()}`,
 type: 'custom',
 position,
 data,
 };
 set((state) => ({ nodes: [...state.nodes, newNode] }));
 get().pushToHistory();
 },

 loadTemplate: (nodes, edges) => {
 set({ nodes, edges, history: [{ nodes, edges }], historyIndex: 0 });
 }
}));
