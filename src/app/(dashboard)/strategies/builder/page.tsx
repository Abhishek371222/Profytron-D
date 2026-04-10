'use client';

import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, { 
  addEdge, 
  Background, 
  Controls, 
  Connection, 
  Edge, 
  Node,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Panel,
  BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Save, 
  Trash2, 
  Settings2, 
  ChevronLeft, 
  Target,
  Zap,
  Cpu,
  ShieldCheck,
  Activity,
  Box,
  RotateCcw,
  Sparkles,
  ArrowRight
} from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { FlowNode } from '@/components/builder/FlowNode';
import NodeLibrary from '@/components/builder/NodeLibrary';
import { cn } from '@/lib/utils';

const nodeTypes = {
  custom: FlowNode,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'custom',
    position: { x: 250, y: 150 },
    data: { label: 'RSI Oscillator', category: 'indicator' },
  },
  {
    id: '2',
    type: 'custom',
    position: { x: 750, y: 150 },
    data: { label: 'Market Ingress', category: 'action' },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#6366f1', strokeWidth: 3 } },
];

let id = 0;
const getId = () => `node_${id++}`;

export default function StrategyBuilderPage() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#6366f1', strokeWidth: 4, filter: 'drop-shadow(0 0 8px #6366f1)' } }, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const typeStr = event.dataTransfer.getData('application/reactflow');

      if (!typeStr || !reactFlowBounds) return;

      const { nodeType, label, category } = JSON.parse(typeStr);

      if (typeof nodeType === 'undefined' || !nodeType) return;

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode = {
        id: getId(),
        type: nodeType,
        position,
        data: { label: `${label}`, category },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col relative overflow-hidden bg-[#020205]">
      {/* Background Neural Lattice */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay opacity-20" />
          <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-p/10 blur-[200px] rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-500/10 blur-[150px] rounded-full translate-x-1/2 translate-y-1/2" />
      </div>

      {/* HUD Navbar - Institutional Grade */}
      <div className="h-28 bg-black/60 backdrop-blur-3xl border-b-2 border-white/5 px-12 flex items-center justify-between relative z-50 shadow-[0_10px_50px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-12">
              <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-p/10 border-2 border-p/20 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                        <Box className="w-6 h-6 text-p" />
                    </div>
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter font-syne leading-none">Fabrication_Core</h2>
                  </div>
                  <div className="flex items-center gap-3">
                     <span className="text-[10px] text-p font-black uppercase tracking-[0.6em] italic">NEURAL_IDE_v4.8</span>
                     <div className="w-1.5 h-1.5 rounded-full bg-p animate-pulse" />
                     <span className="text-[9px] text-white/20 font-black uppercase tracking-[0.4em]">Grid_Sync_Ready</span>
                  </div>
              </div>

              <div className="h-14 w-[2px] bg-white/5" />

              <div className="flex items-center gap-6 bg-black/40 p-2 rounded-[24px] border-2 border-white/5 shadow-inner">
                 <button className="px-8 py-3 rounded-2xl bg-p text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_10px_25px_rgba(99,102,241,0.3)] font-syne italic">Draft_Mesh</button>
                 <button className="px-8 py-3 rounded-2xl text-white/20 text-[11px] font-black uppercase tracking-[0.2em] hover:text-p transition-all font-syne italic">Simulation_Lab</button>
                 <button className="px-8 py-3 rounded-2xl text-white/20 text-[11px] font-black uppercase tracking-[0.2em] hover:text-emerald-400 transition-all font-syne italic">Production_Node</button>
              </div>
          </div>

          <div className="flex items-center gap-10">
              {/* Telemetry HUD */}
              <div className="hidden xl:flex items-center gap-12 border-x-2 border-white/5 px-10 h-16 mr-6">
                 <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] font-syne">Logic_Density</span>
                    <span className="text-sm font-black text-p italic font-mono uppercase tracking-widest">14_STATIONS</span>
                 </div>
                 <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] font-syne">Mesh_Health</span>
                    <span className="text-sm font-black text-emerald-400 italic font-mono uppercase tracking-widest">OPTIMAL</span>
                 </div>
              </div>

              <div className="flex items-center gap-4">
                  <Button variant="ghost" className="w-14 h-14 rounded-2xl bg-white/[0.02] border-2 border-white/5 text-white/20 hover:text-white hover:border-white/10 transition-all group/save">
                      <Save className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  </Button>
                  <Button variant="ghost" className="w-14 h-14 rounded-2xl bg-white/[0.02] border-2 border-white/5 text-red-500/30 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all group/trash">
                      <Trash2 className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                  </Button>
                  
                  <div className="w-0.5 h-10 bg-white/10 mx-2" />

                  <Button 
                    onClick={() => setIsSimulating(!isSimulating)}
                    className={cn(
                        "h-16 px-12 rounded-[28px] text-[12px] font-black uppercase tracking-[0.5em] transition-all relative overflow-hidden group italic font-syne shadow-2xl",
                        isSimulating ? "bg-emerald-500 text-white shadow-emerald-500/40" : "bg-p text-white shadow-p/40"
                    )}
                  >
                      <AnimatePresence mode="wait">
                        {isSimulating ? (
                            <motion.div 
                              key="simulating"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="flex items-center gap-4 relative z-10"
                            >
                                <RotateCcw className="w-5 h-5 animate-spin-slow" />
                                <span>TERMINATING_SIM...</span>
                            </motion.div>
                        ) : (
                            <motion.div 
                              key="idle"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="flex items-center gap-4 relative z-10"
                            >
                                <Play className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
                                <span>INITIALIZE_FLUX</span>
                            </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </Button>
              </div>
          </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Component Library Sidebar - High Density */}
        <aside className="w-[500px] shrink-0 shadow-[20px_0_50px_rgba(0,0,0,0.5)] relative z-30">
          <NodeLibrary />
        </aside>

        {/* Builder Canvas - The Fabrication Mesh */}
        <main className="flex-1 relative overflow-hidden group/canvas">
          {/* Canvas Atmosphere */}
          <div className="absolute inset-0 pointer-events-none z-10">
             <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-[#020205] to-transparent opacity-80" />
             <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-[#020205] to-transparent opacity-80" />
             <div className="absolute top-0 right-0 w-[800px] h-full bg-gradient-to-l from-p/10 via-p/5 to-transparent blur-[150px] opacity-0 group-hover/canvas:opacity-100 transition-opacity duration-1000" />
          </div>

          <div className="h-full w-full" ref={reactFlowWrapper}>
            <ReactFlowProvider>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={setReactFlowInstance}
                onDrop={onDrop}
                onDragOver={onDragOver}
                nodeTypes={nodeTypes}
                fitView
                className="fabrication-grid"
              >
                <Background 
                    variant={BackgroundVariant.Lines} 
                    gap={100} 
                    size={2} 
                    color="rgba(99, 102, 241, 0.08)" 
                />
                <Background 
                    variant={BackgroundVariant.Dots} 
                    gap={25} 
                    size={1.5} 
                    color="rgba(255, 255, 255, 0.05)" 
                />
                
                <Controls 
                    className="!bg-black/60 !border-2 !border-white/10 !rounded-[24px] !fill-white/60 !shadow-2xl overflow-hidden backdrop-blur-3xl !m-12 !p-2 !flex-row !gap-4" 
                    showInteractive={false}
                />
                
                {/* Advanced Telemetry Panel */}
                <Panel position="top-right" className="m-12">
                     <div className="p-10 rounded-[40px] bg-black/60 backdrop-blur-3xl border-2 border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.8)] space-y-8 relative overflow-hidden group/panel flex flex-col items-center min-w-[320px]">
                        <div className="absolute inset-0 bg-scanlines opacity-[0.05]" />
                        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
                        
                        <div className="w-20 h-20 rounded-[28px] bg-white/[0.02] border-2 border-white/10 flex items-center justify-center relative group-hover/panel:scale-110 transition-transform duration-700">
                           <div className="absolute inset-0 bg-p/5 blur-2xl rounded-full" />
                           <Activity className="w-10 h-10 text-white/20 group-hover/panel:text-emerald-400 transition-colors relative z-10" />
                        </div>

                        <div className="text-center space-y-2">
                            <h4 className="text-[14px] font-black text-white uppercase tracking-[0.5em] font-syne italic">Network_Telemetry</h4>
                            <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.4em]">Validation_Chain_Active</p>
                        </div>

                        <div className="w-full h-px bg-white/5" />

                        <div className="grid grid-cols-1 gap-8 w-full">
                            <div className="flex flex-col items-center gap-1 group/stat">
                                <span className="text-[28px] font-black text-white font-syne italic tracking-tighter group-hover/stat:text-p transition-colors duration-500">8.42%</span>
                                <div className="flex items-center gap-2">
                                   <div className="w-1.5 h-1.5 rounded-full bg-p animate-pulse" />
                                   <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.4em]">Backtest_Yield_APR</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-1 group/stat">
                                <span className="text-[28px] font-black text-emerald-400 font-syne italic tracking-tighter">1.82</span>
                                <div className="flex items-center gap-2">
                                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                   <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.4em]">Efficiency_Ratio</span>
                                </div>
                            </div>
                        </div>

                        <div className="w-full pt-4">
                           <button className="w-full h-14 rounded-2xl bg-white/[0.03] border-2 border-white/5 text-[10px] font-black uppercase tracking-[0.4em] text-white/40 hover:text-white hover:bg-white/5 transition-all font-syne">View_Extended_Log</button>
                        </div>
                     </div>
                </Panel>

                {/* Navigation Status Bar */}
                <Panel position="bottom-center" className="mb-14">
                   <div className="px-14 h-20 rounded-[32px] bg-black/60 backdrop-blur-3xl border-2 border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.8)] flex items-center gap-12 group overflow-hidden relative">
                       <div className="absolute inset-0 bg-gradient-to-r from-p/5 via-transparent to-p/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                       <div className="flex items-center gap-5 relative z-10">
                          <div className="w-3 h-3 rounded-full bg-p shadow-[0_0_15px_#6366f1] animate-pulse" />
                          <div className="flex flex-col">
                             <span className="text-[11px] font-black text-white uppercase tracking-[0.4em] font-syne italic">Fabrication_Grid_Stable</span>
                             <span className="text-[8px] text-white/20 font-black uppercase tracking-[0.2em]">MESH_COORDINATES: OK_22.4.9</span>
                          </div>
                       </div>
                       <div className="w-px h-8 bg-white/10 relative z-10" />
                       <div className="flex items-center gap-6 relative z-10">
                          <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] font-syne">Use <kbd className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-white font-mono mx-2">SPACE</kbd> for High-Density Zoom</span>
                       </div>
                       <div className="hidden lg:flex items-center gap-4 relative z-10 ml-6">
                           <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                              <div className="w-[84%] h-full bg-p animate-pulse" />
                           </div>
                           <span className="text-[8px] font-black text-p/60 uppercase tracking-widest font-mono">NODE_MEM: 84%</span>
                       </div>
                   </div>
                </Panel>
              </ReactFlow>
            </ReactFlowProvider>
          </div>
        </main>
      </div>
    </div>
  );
}
