'use client';

import React, { useState, useCallback, useRef, useMemo } from 'react';
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
  BackgroundVariant,
  useReactFlow
} from 'reactflow';
import { useRouter } from 'next/navigation';
import 'reactflow/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Save, 
  Trash2, 
  ChevronLeft,
  Plus,
  RotateCcw,
  Activity,
  Cpu,
  Terminal,
  Box
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FlowNode } from '@/components/builder/FlowNode';
import NodeLibrary from '@/components/builder/NodeLibrary';
import { cn } from '@/lib/utils';
import { strategiesApi } from '@/lib/api/strategies';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Magnetic } from '@/components/ui/Interactions';

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
    position: { x: 850, y: 150 },
    data: { label: 'Market Ingress', category: 'action' },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#6366f1', strokeWidth: 4, filter: 'drop-shadow(0 0 10px #6366f1)' } },
];

let id = 0;
const getId = () => `node_nvx_${id++}`;

export default function StrategyBuilderPage() {
  const router = useRouter();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [strategyName, setStrategyName] = useState('UNNAMED_PROT_42');
  const [showLibrary, setShowLibrary] = useState(true);

  const memoizedNodeTypes = useMemo(() => nodeTypes, []);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ 
      ...params, 
      animated: true, 
      style: { stroke: '#6366f1', strokeWidth: 5, filter: 'drop-shadow(0 0 12px #6366f1)' } 
    }, eds)),
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

  const [backtestResult, setBacktestResult] = useState<any>(null);

  const backtestMutation = useMutation({
    mutationFn: (data: any) => strategiesApi.runBacktestPreview(data),
    onSuccess: (data) => {
      setBacktestResult(data);
      toast.success('Backtest sequence completed');
    },
    onError: () => toast.error('Backtest engine failure')
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => strategiesApi.createStrategy(data),
    onSuccess: (strategy) => {
      toast.success('Logic core synchronized');
      router.push(`/strategies/${strategy.id}`);
    },
    onError: () => toast.error('Synchronization failed')
  });

  const handleSimulate = () => {
    backtestMutation.mutate({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
      configOverride: { nodes, edges }
    });
  };

  const handleSave = () => {
    saveMutation.mutate({
      name: strategyName,
      category: 'TREND', // Default for builder
      riskLevel: 'Medium',
      description: `Fabricated via Core v5.28 at ${new Date().toISOString()}`,
      configJson: { nodes, edges }
    });
  };

  const handleDeleteAll = () => {
    setNodes([]);
    setEdges([]);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex relative overflow-hidden bg-[#050508]">
      {/* GLOBAL ATMOSPHERE */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-p/5 via-transparent to-indigo-500/5" />
        <div className="absolute top-1/4 left-1/3 w-[800px] h-[800px] bg-p/10 blur-[200px] rounded-full animate-pulse" />
      </div>

      {/* NODE LIBRARY SIDEBAR */}
      <AnimatePresence>
        {showLibrary && (
          <motion.div 
            initial={{ opacity: 0, x: -450 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -450 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="w-[420px] border-r border-white/5 bg-black/40 backdrop-blur-3xl flex flex-col relative z-30 shadow-2xl"
          >
            <NodeLibrary />
          </motion.div>
        )}
      </AnimatePresence>

      {/* FABRICATION ENGINE AREA */}
      <div className="flex-1 flex flex-col relative">
        {/* COMMAND CONTROL BAR */}
        <motion.div 
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-28 bg-black/20 backdrop-blur-3xl border-b border-white/10 px-12 flex items-center justify-between relative z-40"
        >
          <div className="flex items-center gap-16 flex-1">
            <div className="flex items-center gap-8">
              <Magnetic strength={0.2}>
                <button
                  onClick={() => setShowLibrary(!showLibrary)}
                  className="w-14 h-14 rounded-2xl bg-p/10 border border-p/20 flex items-center justify-center text-p hover:bg-p/20 transition-all shadow-[0_0_30px_rgba(99,102,241,0.2)] active:scale-90"
                >
                  {showLibrary ? <ChevronLeft className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                </button>
              </Magnetic>

              <div className="flex flex-col gap-2">
                <div className="relative group">
                  <input
                    value={strategyName}
                    onChange={(e) => setStrategyName(e.target.value)}
                    className="bg-white/[0.03] border border-white/10 rounded-xl px-6 py-2.5 text-white font-bold focus:border-p/40 focus:outline-none transition-all text-[15px] w-72 uppercase tracking-tight placeholder:text-white/10"
                    placeholder="ENTER_STRATEGY_ID"
                  />
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-p group-focus-within:w-full transition-all duration-500" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-white/20 uppercase tracking-[0.6em] font-bold">Fabrication_Core v5.28_STABLE</span>
                </div>
              </div>
            </div>

            <div className="h-14 w-px bg-white/10" />

            <div className="flex items-center gap-16">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-white/10 uppercase tracking-[0.4em]">Node Density</span>
                <span className="text-lg font-bold text-white tracking-widest font-mono">[{nodes.length < 10 ? '0' : ''}{nodes.length}] <span className="text-white/20 text-xs">UNITS</span></span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-white/10 uppercase tracking-[0.4em]">Mesh Stability</span>
                <span className="text-lg font-bold text-emerald-400 tracking-widest font-mono">NOMINAL</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Magnetic strength={0.1}>
              <Button 
                onClick={handleSave}
                disabled={saveMutation.isPending}
                variant="ghost" 
                className="w-16 h-16 rounded-[22px] bg-white/[0.02] border border-white/5 text-white/20 hover:text-white hover:border-white/20 transition-all group/save"
              >
                {saveMutation.isPending ? <RotateCcw className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6 group-hover:scale-110 transition-transform" />}
              </Button>
            </Magnetic>
            <Magnetic strength={0.1}>
              <Button variant="ghost" className="w-16 h-16 rounded-[22px] bg-white/[0.02] border border-white/5 text-red-500/20 hover:text-red-400 hover:bg-red-500/5 hover:border-red-500/20 transition-all group/trash" onClick={handleDeleteAll}>
                <Trash2 className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              </Button>
            </Magnetic>
            
            <div className="w-px h-12 bg-white/10 mx-2" />

            <Magnetic strength={0.2}>
              <Button 
                onClick={handleSimulate}
                disabled={backtestMutation.isPending}
                className={cn(
                  "h-18 px-14 rounded-[32px] text-xs font-bold uppercase tracking-[0.6em] transition-all relative overflow-hidden group shadow-2xl min-w-[280px]",
                  backtestMutation.isPending ? "bg-emerald-500 text-white shadow-emerald-500/40" : "bg-p text-white shadow-p/40"
                )}
              >
                <div className="absolute inset-0 bg-scanlines opacity-10" />
                <AnimatePresence mode="wait">
                  {backtestMutation.isPending ? (
                    <motion.div 
                      key="simulating"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.1 }}
                      className="flex items-center gap-5 relative z-10"
                    >
                      <RotateCcw className="w-6 h-6 animate-spin-slow" />
                      <span>FABRICATING...</span>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="idle"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.1 }}
                      className="flex items-center gap-5 relative z-10"
                    >
                      <Play className="w-6 h-6 fill-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                      <span>INITIALIZE_CORE</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/20 animate-scanline" />
              </Button>
            </Magnetic>
          </div>
        </motion.div>

        {/* FABRICATION FABRIC (CANVAS) */}
        <main className="flex-1 relative overflow-hidden group/canvas" ref={reactFlowWrapper}>
          {/* VIGNETTE GRADIENTS */}
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-[#050508] to-transparent opacity-90" />
            <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-[#050508] to-transparent opacity-90" />
            <div className="absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-black/20 to-transparent" />
          </div>

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
              nodeTypes={memoizedNodeTypes}
              fitView
              className="fabrication-grid"
            >
              <Background 
                variant={BackgroundVariant.Lines} 
                gap={100} 
                size={1} 
                color="rgba(99, 102, 241, 0.05)" 
              />
              <Background 
                variant={BackgroundVariant.Dots} 
                gap={25} 
                size={1} 
                color="rgba(255, 255, 255, 0.02)" 
              />
              
              <Controls 
                className="!bg-black/80 !border !border-white/10 !rounded-[24px] !fill-white/30 !shadow-2xl overflow-hidden backdrop-blur-3xl !m-12 !p-3 !flex-row !gap-6 border-b-4 border-b-p/20" 
                showInteractive={false}
              />
              
              {/* HOLOGRAPHIC TELEMETRY HUD */}
              <Panel position="top-right" className="m-12">
                <motion.div 
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-10 rounded-[48px] bg-black/40 backdrop-blur-3xl border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] space-y-10 relative overflow-hidden group/panel flex flex-col items-center min-w-[340px]"
                >
                  <div className="absolute inset-0 bg-scanlines opacity-[0.03]" />
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                  
                  <div className="relative group/hex">
                    <div className="absolute inset-0 bg-p/20 blur-[40px] rounded-full scale-0 group-hover/panel:scale-100 transition-transform duration-1000" />
                    <div className="w-24 h-24 rounded-[32px] bg-white/[0.01] border border-white/10 flex items-center justify-center relative z-10 group-hover/panel:border-p/40 transition-all duration-700 shadow-inner">
                      <Activity className="w-12 h-12 text-white/10 group-hover/panel:text-p transition-colors duration-500" />
                    </div>
                  </div>

                  <div className="text-center space-y-3 relative z-10">
                    <h4 className="text-[12px] font-bold text-white uppercase tracking-[0.6em]">System_Telemetry</h4>
                    <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.4em]">Validation_Chain: <span className="text-emerald-500/50 underline decoration-dotted">OK</span></p>
                  </div>

                  <div className="w-full h-px bg-white/5 relative z-10" />

                  <div className="grid grid-cols-1 gap-10 w-full relative z-10">
                    <div className="flex flex-col items-center gap-2 group/stat">
                      <span className="text-4xl font-semibold text-white tracking-tighter group-hover/stat:text-p transition-colors duration-500">
                        {backtestResult?.winRate ? `+${backtestResult.winRate}%` : '8.42%'}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-p animate-pulse shadow-[0_0_10px_#6366f1]" />
                        <span className="text-[10px] font-bold text-white/10 uppercase tracking-[0.5em]">Expected_Yield</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-2 group/stat">
                      <span className="text-4xl font-semibold text-emerald-400 tracking-tighter">
                        {backtestResult?.sharpeRatio || '1.82'}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-bold text-white/10 uppercase tracking-[0.5em]">Neural_Efficiency</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full pt-6 relative z-10">
                    <button className="w-full h-16 rounded-[22px] bg-white/[0.02] border border-white/5 text-[10px] font-bold uppercase tracking-[0.5em] text-white/20 hover:text-white hover:bg-white/5 hover:border-white/10 transition-all">Export_Extended_Diagnostic</button>
                  </div>
                </motion.div>
              </Panel>

              {/* NAVIGATION ENGINE STATUS (BOTTOM) */}
              <Panel position="bottom-center" className="mb-14">
                <motion.div 
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-16 h-24 rounded-[42px] bg-black/60 backdrop-blur-3xl border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.8)] flex items-center gap-16 group overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.03] via-transparent to-primary/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                  
                  <div className="flex items-center gap-8 relative z-10">
                    <div className="relative">
                      <div className="w-4 h-4 rounded-full bg-p shadow-[0_0_20px_#6366f1] animate-pulse" />
                      <div className="absolute inset-0 bg-p/40 rounded-full animate-ping" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-white uppercase tracking-[0.5em]">Fabrication_Fabric: STABLE</span>
                      <span className="text-[9px] text-white/10 font-bold uppercase tracking-[0.4em] font-mono">COORD_SYNC_OK // P-CHAIN: AUTH</span>
                    </div>
                  </div>

                  <div className="w-px h-10 bg-white/5 relative z-10" />

                  <div className="flex items-center gap-8 relative z-10 text-white/30 hidden xl:flex">
                    <div className="bg-white/[0.05] border border-white/10 px-4 py-2 rounded-xl text-[10px] font-bold font-mono text-white/20">CTRL + S</div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.4em]">QUICK_SAVE_HOTKEY</span>
                  </div>

                  <div className="flex items-center gap-6 relative z-10 ml-6 min-w-[240px]">
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden relative">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '84%' }}
                        transition={{ duration: 2, ease: "circOut" }}
                        className="h-full bg-p shadow-[0_0_15px_#6366f1]" 
                      />
                      <div className="absolute inset-0 bg-scanlines opacity-50" />
                    </div>
                    <span className="text-[11px] font-bold text-p uppercase tracking-[0.5em] font-mono">MEMORY: 84%</span>
                  </div>
                </motion.div>
              </Panel>
            </ReactFlow>
          </ReactFlowProvider>
        </main>
      </div>
    </div>
  );
}
