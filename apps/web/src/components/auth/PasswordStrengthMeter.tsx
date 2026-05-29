'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PasswordStrengthMeterProps {
 password?: string;
}

export const PasswordStrengthMeter = ({ password ="" }: PasswordStrengthMeterProps) => {
 const getScore = (pwd: string) => {
 let s = 0;
 if (pwd.length > 5) s++;
 if (pwd.length > 8) s++;
 if (/[A-Z]/.test(pwd)) s++;
 if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) s++;
 return s;
 };

 const score = getScore(password);
 const segments = [
 { label:"Very Weak", color:"bg-red-500" },
 { label:"Weak", color:"bg-orange-500" },
 { label:"Fair", color:"bg-amber-500" },
 { label:"Good", color:"bg-emerald-500" },
 { label:"Strong", color:"bg-success" },
 ];

 const current = segments[score] || segments[0];

 return (
 <div className="space-y-2 py-2">
 <div className="flex justify-between items-center px-1">
 <span className="text-xs uppercase tracking-widest font-semibold text-white/30">Security Strength</span>
 <span className={cn("text-xs uppercase tracking-widest font-semibold", current.color.replace('bg-', 'text-'))}>
 {current.label}
 </span>
 </div>

 <div className="flex gap-1.5 h-1">
 {[1, 2, 3, 4].map((i) => (
 <div 
 key={i}
 className={cn(
"flex-1 rounded-full transition-all duration-500 bg-white/5",
 i <= score && current.color
 )}
 />
 ))}
 </div>
 </div>
 );
};
