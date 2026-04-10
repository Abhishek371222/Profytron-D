"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Download, UserPlus, Search, Filter, Eye, Shield, Ban, CreditCard, ChevronLeft, ChevronRight, X, UserX, Key, Activity, Wallet, FileText, ArrowRight, CheckCircle2
} from "lucide-react";

// Mock Data
type Plan = 'FREE' | 'PRO' | 'ELITE';
type KYC = 'VERIFIED' | 'PENDING' | 'NOT_STARTED' | 'REJECTED';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  plan: Plan;
  kyc: KYC;
  country: string;
  joinDate: string;
  lastActive: string;
  trades: number;
  revenue: string;
  avatar: string;
  volume: string;
  winRate: string;
}

const mockUsers: AdminUser[] = Array.from({ length: 25 }).map((_, i) => {
  const plans: Plan[] = ['FREE', 'PRO', 'ELITE', 'PRO', 'FREE'];
  const kycs: KYC[] = ['VERIFIED', 'PENDING', 'VERIFIED', 'NOT_STARTED', 'REJECTED'];
  const countries = ['🇺🇸', '🇬🇧', '🇮🇳', '🇩🇪', '🇦🇺'];
  
  return {
    id: `usr_00${i + 1}`,
    name: `User ${i + 1}`,
    email: `trader${i + 1}@profytron.com`,
    plan: plans[i % 5],
    kyc: kycs[i % 5],
    country: countries[i % 5],
    joinDate: new Date(Date.now() - Math.random() * 10000000000).toISOString().split('T')[0],
    lastActive: i === 0 ? "Just now" : `${i * 2}h ago`,
    trades: Math.floor(Math.random() * 5000),
    revenue: `₹${(Math.random() * 100000).toFixed(0)}`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=trader${i + 1}`,
    volume: `₹${(Math.random() * 5000000).toFixed(0)}`,
    winRate: `${(50 + Math.random() * 20).toFixed(1)}%`
  };
});

export default function UserManagement() {
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const PlanBadge = ({ plan }: { plan: Plan }) => {
    switch (plan) {
      case 'ELITE':
        return <span className="px-2 py-1 rounded text-[10px] font-bold tracking-wider bg-purple-500/10 text-purple-400 border border-amber-500/50">ELITE</span>;
      case 'PRO':
        return <span className="px-2 py-1 rounded text-[10px] font-bold tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">PRO</span>;
      case 'FREE':
      default:
        return <span className="px-2 py-1 rounded text-[10px] font-bold tracking-wider bg-slate-500/10 text-slate-400 border border-slate-500/20">FREE</span>;
    }
  };

  const KYCBadge = ({ kyc }: { kyc: KYC }) => {
    switch (kyc) {
      case 'VERIFIED':
        return <span className="px-2 py-1 rounded text-[10px] font-bold tracking-wider bg-green-500/10 text-green-500 border border-green-500/20">VERIFIED</span>;
      case 'PENDING':
        return <span className="px-2 py-1 rounded text-[10px] font-bold tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">PENDING</span>;
      case 'REJECTED':
        return <span className="px-2 py-1 rounded text-[10px] font-bold tracking-wider bg-red-500/10 text-red-500 border border-red-500/20">REJECTED</span>;
      case 'NOT_STARTED':
      default:
        return <span className="px-2 py-1 rounded text-[10px] font-bold tracking-wider bg-slate-500/10 text-slate-400 border border-slate-500/20">NOT STARTED</span>;
    }
  };

  return (
    <div className="flex h-full w-full relative">
      <div className="flex-1 p-6 md:p-8 flex flex-col h-full overflow-hidden">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-white">User Management</h1>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 transition-colors text-sm font-medium">
              <Download className="w-4 h-4" /> Export Users
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors text-sm font-medium">
              <UserPlus className="w-4 h-4" /> Invite User
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6 bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search by name, email, or ID..." 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-400 hover:text-white hover:border-slate-700">
              <Filter className="w-4 h-4" /> Filter By
            </button>
            <select className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-400 focus:outline-none focus:border-red-500 appearance-none">
              <option>Sort: Newest</option>
              <option>Sort: Oldest</option>
              <option>Sort: Most Active</option>
            </select>
          </div>
        </div>

        {/* User Table */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 bg-slate-950/50 sticky top-0 z-10 shadow-sm border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">KYC</th>
                  <th className="px-4 py-3 font-medium">Country</th>
                  <th className="px-4 py-3 font-medium">Join Date</th>
                  <th className="px-4 py-3 font-medium">Last Active</th>
                  <th className="px-4 py-3 font-medium text-right">Trades / Rev</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {mockUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/80 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full bg-slate-800" />
                        <div>
                          <div className="font-medium text-slate-200">{user.name}</div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><PlanBadge plan={user.plan} /></td>
                    <td className="px-4 py-3"><KYCBadge kyc={user.kyc} /></td>
                    <td className="px-4 py-3 text-lg">{user.country}</td>
                    <td className="px-4 py-3 text-slate-400">{user.joinDate}</td>
                    <td className="px-4 py-3 text-slate-400">{user.lastActive}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="text-slate-300 font-mono">{user.trades.toLocaleString()}</div>
                      <div className="text-xs text-slate-500 font-mono">{user.revenue}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                        <button title="View Detail" onClick={() => setSelectedUser(user)} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white"><Eye className="w-4 h-4" /></button>
                        <button title="KYC Review" className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-amber-400"><Shield className="w-4 h-4" /></button>
                        <button title="Suspend" className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-red-400"><Ban className="w-4 h-4" /></button>
                        <button title="Billing" className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-blue-400"><CreditCard className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="border-t border-slate-800 p-3 flex items-center justify-between text-sm text-slate-400 bg-slate-950/50">
            <div>Showing 1-25 of 12,847 users</div>
            <div className="flex items-center gap-2">
              <button disabled className="p-1 rounded hover:bg-slate-800 disabled:opacity-50"><ChevronLeft className="w-5 h-5" /></button>
              <input type="text" defaultValue="1" className="w-8 text-center bg-slate-900 border border-slate-800 rounded py-1 px-1 focus:outline-none focus:border-red-500" />
              <span>of 514</span>
              <button className="p-1 rounded hover:bg-slate-800"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>
        </div>

      </div>

      {/* USER DETAIL SLIDE-OVER */}
      <AnimatePresence>
        {selectedUser && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedUser(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-[420px] bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col"
            >
              {/* Slide-over Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-800">
                <h2 className="text-lg font-medium text-white">User Details</h2>
                <button 
                  onClick={() => setSelectedUser(null)} 
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Slide-over Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                
                {/* Profile Synopsis */}
                <div className="flex flex-col items-center text-center">
                  <img src={selectedUser.avatar} className="w-20 h-20 rounded-full bg-slate-800 mb-4 border-2 border-slate-700" alt="" />
                  <div className="text-xl font-bold text-white mb-1">{selectedUser.name} <span className="text-lg">{selectedUser.country}</span></div>
                  <div className="text-slate-400 text-sm mb-3">{selectedUser.email}</div>
                  <div className="flex gap-2 justify-center">
                    <PlanBadge plan={selectedUser.plan} />
                    <KYCBadge kyc={selectedUser.kyc} />
                  </div>
                  <div className="mt-4 text-xs text-slate-500 font-mono space-x-4">
                    <span>Joined: {selectedUser.joinDate}</span>
                    <span>ID: {selectedUser.id}</span>
                  </div>
                </div>

                {/* Activity & Wallet */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div className="text-slate-500 text-xs mb-1 flex items-center gap-1"><Activity className="w-3 h-3"/> Activity</div>
                    <div className="font-mono text-white text-lg">{selectedUser.trades.toLocaleString()} <span className="text-xs text-slate-500 ml-1">trades</span></div>
                    <div className="text-green-500 text-xs mt-1">Win Rate: {selectedUser.winRate}</div>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div className="text-slate-500 text-xs mb-1 flex items-center gap-1"><Wallet className="w-3 h-3"/> Wallet</div>
                    <div className="font-mono text-white text-lg">{selectedUser.revenue}</div>
                    <div className="text-slate-400 text-xs mt-1">Vol: {selectedUser.volume}</div>
                  </div>
                </div>

                {/* Login History */}
                <div>
                  <h3 className="text-sm font-medium text-slate-300 mb-3 uppercase tracking-wider">Recent Logins</h3>
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex justify-between items-center text-xs">
                        <div className="text-slate-400">MacBook Pro - Safari</div>
                        <div className="text-slate-500 font-mono">{i} days ago • 192.168.1.{i*10}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* KYC Documents */}
                <div>
                  <h3 className="text-sm font-medium text-slate-300 mb-3 uppercase tracking-wider flex items-center justify-between">
                    KYC Documents
                    <FileText className="w-4 h-4 text-slate-500" />
                  </h3>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center border border-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      </div>
                      <div>
                        <div className="text-slate-300">Passport / National ID</div>
                        <div className="text-slate-500 text-xs">Verified automatically (Onfido)</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Slide-over Actions Footer */}
              <div className="p-6 border-t border-slate-800 space-y-3 bg-slate-950/50">
                 <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium text-white transition-colors">
                    Upgrade Plan
                 </button>
                 <div className="grid grid-cols-2 gap-3">
                   <button className="flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-300 transition-colors">
                      <Key className="w-3.5 h-3.5" /> Reset Password
                   </button>
                   <button className="flex items-center justify-center gap-2 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-xs font-medium transition-colors border border-red-500/20">
                      <UserX className="w-3.5 h-3.5" /> Suspend
                   </button>
                 </div>
                 <button className="w-full flex justify-center items-center gap-1 pt-3 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                    View full audit log <ArrowRight className="w-3 h-3" />
                 </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
