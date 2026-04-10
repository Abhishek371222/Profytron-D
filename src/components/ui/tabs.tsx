'use client';

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

function Tabs({ defaultValue, children, className }: { defaultValue: string, children: React.ReactNode, className?: string }) {
  const [activeTab, setActiveTab] = React.useState(defaultValue);
  
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as any, { activeTab, setActiveTab });
        }
        return child;
      })}
    </div>
  )
}

function TabsList({ children, className, activeTab, setActiveTab }: any) {
  return (
    <div className={cn("inline-flex h-9 items-center justify-center rounded-full bg-white/5 p-1 text-white/50", className)}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as any, { activeTab, setActiveTab });
        }
        return child;
      })}
    </div>
  )
}

function TabsTrigger({ value, children, className, activeTab, setActiveTab }: any) {
  const isActive = activeTab === value;
  
  return (
    <button
      onClick={() => setActiveTab(value)}
      className={cn(
        "relative px-4 py-1.5 text-xs font-bold transition-all uppercase tracking-widest outline-none",
        isActive ? "text-white" : "hover:text-white/80",
        className
      )}
    >
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 rounded-full bg-p shadow-[0_0_10px_rgba(var(--p-rgb),0.5)]"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  )
}

function TabsContent({ value, children, activeTab }: any) {
  if (activeTab !== value) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
