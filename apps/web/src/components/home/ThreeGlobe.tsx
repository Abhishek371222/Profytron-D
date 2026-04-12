'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { useWebGLSupport } from '@/hooks/use-webgl';

// Dynamically import the heavy WebGL component with no SSR
const GlobeCanvas = dynamic(() => import('./GlobeCanvas'), { 
  ssr: false,
  loading: () => null 
});

// Fallback component for environments without WebGL
const GlobeFallback = () => {
  return (
    <div className="relative w-[500px] h-[500px] flex items-center justify-center">
      {/* Outer Glow */}
      <motion.div 
        animate={{ scale: [1, 1.05, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 bg-p/20 rounded-full blur-[100px]"
      />
      
      {/* Main Core */}
      <div className="relative w-80 h-80 rounded-full bg-slate-950 border border-white/5 shadow-[0_0_50px_rgba(99,102,241,0.1)] overflow-hidden">
        {/* Internal Gradient Layers */}
        <div className="absolute inset-0 bg-linear-to-tr from-p/20 via-transparent to-transparent opacity-40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.1)_0%,transparent_70%)]" />
        
        {/* Static Grid Effect */}
        <div className="absolute inset-0 opacity-10" 
          style={{ backgroundImage: 'radial-gradient(#fff 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} 
        />

        {/* Floating Data Nodes (SVG) */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-40">
          <motion.circle 
            animate={{ r: [1, 1.5, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 3, repeat: Infinity }}
            cx="70" cy="30" r="1.5" fill="#818cf8" 
          />
          <motion.circle 
            animate={{ r: [1, 1.5, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 4, repeat: Infinity, delay: 1 }}
            cx="30" cy="60" r="1.5" fill="#818cf8" 
          />
          <motion.circle 
            animate={{ r: [1, 1.5, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 5, repeat: Infinity, delay: 2 }}
            cx="50" cy="80" r="1.5" fill="#818cf8" 
          />
          <line x1="30" y1="60" x2="70" y2="30" stroke="#818cf8" strokeWidth="0.1" strokeDasharray="2 2" />
          <line x1="30" y1="60" x2="50" y2="80" stroke="#818cf8" strokeWidth="0.1" strokeDasharray="2 2" />
        </svg>
      </div>

      {/* Halo Effect */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-linear-to-r from-transparent via-p/20 to-transparent w-full" />
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-gradient-to-b from-transparent via-p/20 to-transparent h-full" />
    </div>
  );
};

export function ThreeGlobe() {
  const isWebGLSupported = useWebGLSupport();

  return (
    <div className="w-full h-full relative min-h-150 flex items-center justify-center cursor-crosshair overflow-hidden">
      {isWebGLSupported === false ? (
        <GlobeFallback />
      ) : isWebGLSupported === true ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="w-full h-full"
        >
          <GlobeCanvas />
        </motion.div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-2 border-p/20 border-t-p rounded-full"
          />
          <p className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-medium">Initializing Engine</p>
        </div>
      )}
    </div>
  );
}
