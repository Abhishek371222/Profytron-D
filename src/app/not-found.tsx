'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-p/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-s/5 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center max-w-2xl"
      >
        {/* Error Code */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-[180px] font-black text-white/5 leading-none font-syne select-none">
            404
          </h1>
          <div className="relative -mt-16">
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-p to-transparent mx-auto" />
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h2 className="text-4xl font-black text-white uppercase tracking-tight font-syne mb-4">
            Signal Lost
          </h2>
          <p className="text-white/40 text-lg font-medium mb-8 max-w-md mx-auto">
            The neural pathway you&apos;re searching for doesn&apos;t exist or has been decommissioned.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/">
              <Button className="h-14 px-8 rounded-[16px] bg-p text-white font-black uppercase tracking-widest gap-3 hover:bg-p/90 transition-all">
                <Home className="w-5 h-5" />
                Return Home
              </Button>
            </Link>
            <Button 
              variant="outline"
              className="h-14 px-8 rounded-[16px] border-white/10 bg-white/5 text-white font-black uppercase tracking-widest gap-3 hover:bg-white/10"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-5 h-5" />
              Go Back
            </Button>
          </div>

          {/* Decorative Elements */}
          <div className="mt-16 flex items-center justify-center gap-2 text-white/20">
            <Search className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-[0.3em]">Lost in the void</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}