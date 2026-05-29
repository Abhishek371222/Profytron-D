'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings2, Trash2, Info } from 'lucide-react';
import { useBuilderStore } from '@/lib/stores/useBuilderStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ConfigPanel() {
 const { nodes, selectedNodeId, selectNode, updateNodeParams, setNodes, setEdges, edges } = useBuilderStore();
 
 const selectedNode = React.useMemo(() => 
 nodes.find(n => n.id === selectedNodeId), 
 [nodes, selectedNodeId]);

 if (!selectedNodeId) return null;

 const handleDelete = () => {
 setNodes(nodes.filter(n => n.id !== selectedNodeId));
 setEdges(edges.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId));
 selectNode(null);
 };

 return (
 <motion.div
 initial={{ x: 300, opacity: 0 }}
 animate={{ x: 0, opacity: 1 }}
 exit={{ x: 300, opacity: 0 }}
 className="w-[320px] h-full bg-bg-card border-l border-white/5 flex flex-col z-50 shadow-2xl shadow-black/50"
 >
 <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/2">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-xl bg-indigo-500/10">
 <Settings2 className="w-5 h-5 text-indigo-400" />
 </div>
 <div>
 <h3 className="text-sm font-bold text-white uppercase tracking-widest">{selectedNode?.data.label}</h3>
 <p className="text-xs text-white/40 font-medium">Node ID: {selectedNodeId.split('_')[0]}</p>
 </div>
 </div>
 <button 
 onClick={() => selectNode(null)}
 className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/40 hover:text-white"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="flex-1 overflow-y-auto p-6 space-y-8">
 {selectedNode && Object.keys(selectedNode.data.params).length > 0 ? (
 <div className="space-y-6">
 {Object.entries(selectedNode.data.params).map(([key, value]) => (
 <div key={key} className="space-y-2">
 <label className="text-xs font-semibold text-white/30 uppercase tracking-[0.2em] flex items-center justify-between">
 {key}
 <Info className="w-3 h-3 cursor-help text-white/20" />
 </label>
 {typeof value === 'number' ? (
 <Input 
 type="number"
 value={value}
 onChange={(e) => updateNodeParams(selectedNodeId, { [key]: parseFloat(e.target.value) })}
 className="h-11 bg-white/3 border-white/10 rounded-xl font-mono text-sm"
 />
 ) : typeof value === 'string' && ['SMA', 'EMA', 'WMA'].includes(value) ? (
 <select 
 value={value}
 onChange={(e) => updateNodeParams(selectedNodeId, { [key]: e.target.value })}
 className="w-full h-11 bg-white/3 border border-white/10 rounded-xl px-4 text-xs text-white appearance-none outline-none focus:border-p transition-all cursor-pointer"
 >
 <option value="SMA">Simple MA</option>
 <option value="EMA">Exponential MA</option>
 <option value="WMA">Weighted MA</option>
 </select>
 ) : (
 <Input 
  value={value as any}
  onChange={(e) => updateNodeParams(selectedNodeId, { [key]: e.target.value })}
 className="h-11 bg-white/3 border-white/10 rounded-xl text-sm"
 />
 )}
 </div>
 ))}
 </div>
 ) : (
 <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-30">
 <Settings2 className="w-12 h-12" />
 <p className="text-xs font-medium max-w-[160px]">No configurable parameters for this logic node.</p>
 </div>
 )}
 </div>

 <div className="p-6 border-t border-white/5 space-y-4 bg-white/2">
 <Button 
 onClick={() => selectNode(null)}
 className="w-full bg-linear-to-r from-indigo-600 to-indigo-500 h-12 rounded-xl text-xs font-semibold uppercase tracking-widest shadow-lg shadow-indigo-600/20"
 >
 Update Logic
 </Button>
 <Button 
 variant="ghost"
 onClick={handleDelete}
 className="w-full text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 h-10 text-xs items-center gap-2 translate-y-2"
 >
 <Trash2 className="w-3.5 h-3.5" />
 Delete Node
 </Button>
 </div>
 </motion.div>
 );
}
