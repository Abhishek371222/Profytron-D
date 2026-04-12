import React from 'react';

export default function DashboardLoading() {
 return (
 <div className="p-8 space-y-10 animate-pulse">
 {/* Header Skeleton */}
 <div className="flex justify-between items-end">
 <div className="space-y-3">
 <div className="h-4 w-32 bg-white/5 rounded-full" />
 <div className="h-10 w-64 bg-white/5 rounded-2xl" />
 </div>
 <div className="flex gap-4">
 <div className="h-12 w-32 bg-white/5 rounded-xl" />
 <div className="h-12 w-32 bg-white/5 rounded-xl" />
 </div>
 </div>

 {/* Stats Grid Skeleton */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
 {[1, 2, 3, 4].map((i) => (
 <div key={i} className="h-40 rounded-4xl bg-white/5 border border-white/10 p-6 flex flex-col justify-between">
 <div className="h-3 w-20 bg-white/10 rounded-full" />
 <div className="h-8 w-32 bg-white/10 rounded-xl" />
 <div className="h-3 w-24 bg-white/10 rounded-full" />
 </div>
 ))}
 </div>

 {/* Main Content Area Skeleton */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="lg:col-span-2 h-[500px] rounded-4xl bg-white/5 border border-white/10 p-8">
 <div className="flex justify-between mb-10">
 <div className="h-6 w-48 bg-white/10 rounded-xl" />
 <div className="h-10 w-32 bg-white/10 rounded-xl" />
 </div>
 <div className="space-y-4">
 {[1, 2, 3, 4, 5].map(i => (
 <div key={i} className="h-14 w-full bg-white/3 rounded-2xl flex items-center px-4 gap-4">
 <div className="w-8 h-8 rounded-lg bg-white/5" />
 <div className="h-4 flex-1 bg-white/10 rounded-full" />
 <div className="h-4 w-32 bg-white/10 rounded-full" />
 </div>
 ))}
 </div>
 </div>
 
 <div className="lg:col-span-1 h-[500px] rounded-4xl bg-white/5 border border-white/10 p-8 flex flex-col justify-between">
 <div className="h-6 w-32 bg-white/10 rounded-xl" />
 <div className="flex-1 flex items-center justify-center">
 <div className="w-48 h-48 rounded-full border-8 border-white/5 flex flex-col items-center justify-center gap-3">
 <div className="h-8 w-16 bg-white/10 rounded-xl" />
 <div className="h-2 w-12 bg-white/10 rounded-full" />
 </div>
 </div>
 <div className="space-y-4">
 <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
 <div className="h-full w-2/3 bg-white/10" />
 </div>
 <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
 <div className="h-full w-1/3 bg-white/10" />
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
