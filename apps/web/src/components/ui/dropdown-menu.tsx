'use client';

import * as React from"react";
import { motion, AnimatePresence } from"framer-motion";
import { cn } from"@/lib/utils";
import { ChevronRightIcon, CheckIcon } from"lucide-react";

const DropdownMenuContext = React.createContext<{
 open: boolean;
 setOpen: (open: boolean) => void;
}>({
 open: false,
 setOpen: () => {},
});

function DropdownMenu({ children, ...props }: { children: React.ReactNode }) {
 const [open, setOpen] = React.useState(false);
 return (
 <DropdownMenuContext.Provider value={{ open, setOpen }}>
 <div className="relative inline-block" {...props}>
 {children}
 </div>
 </DropdownMenuContext.Provider>
 );
}

function DropdownMenuTrigger({ asChild, children, ...props }: { asChild?: boolean; children: React.ReactNode }) {
 const { open, setOpen } = React.useContext(DropdownMenuContext);
 
 const content = React.isValidElement(children) ? React.cloneElement(children as any, {
 onClick: () => setOpen(!open),
 }) : children;

 return (
 <div data-slot="dropdown-menu-trigger" className="cursor-pointer" {...props}>
 {content}
 </div>
 );
}

function DropdownMenuContent({
 align ="start",
 className,
 children,
 ...props
}: {
 align?:"start" |"end" |"center";
 className?: string;
 children: React.ReactNode;
}) {
 const { open, setOpen } = React.useContext(DropdownMenuContext);
 const containerRef = React.useRef<HTMLDivElement>(null);

 React.useEffect(() => {
 const handleClickOutside = (event: MouseEvent) => {
 if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
 setOpen(false);
 }
 };
 if (open) {
 document.addEventListener("mousedown", handleClickOutside);
 }
 return () => document.removeEventListener("mousedown", handleClickOutside);
 }, [open, setOpen]);

 return (
 <AnimatePresence>
 {open && (
 <motion.div
 ref={containerRef}
 initial={{ opacity: 0, y: 10, scale: 0.95 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: 10, scale: 0.95 }}
 transition={{ duration: 0.2, ease:"easeOut" }}
 className={cn(
"absolute z-50 min-w-[8rem] overflow-hidden rounded-xl border border-white/10 bg-bg-card/90 backdrop-blur-2xl p-1 text-white shadow-2xl mt-2",
 align ==="end" &&"right-0 origin-top-right",
 align ==="start" &&"left-0 origin-top-left",
 align ==="center" &&"left-1/2 -translate-x-1/2 origin-top",
 className
 )}
 {...props}
 >
 {children}
 </motion.div>
 )}
 </AnimatePresence>
 );
}

function DropdownMenuItem({
 className,
 children,
 onClick,
 ...props
}: {
 className?: string;
 children: React.ReactNode;
 onClick?: () => void;
}) {
 const { setOpen } = React.useContext(DropdownMenuContext);

 const handleClick = () => {
 if (onClick) onClick();
 setOpen(false);
 };

 return (
 <div
 data-slot="dropdown-menu-item"
 onClick={handleClick}
 className={cn(
"relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm outline-none transition-colors hover:bg-white/5 active:bg-white/10",
 className
 )}
 {...props}
 >
 {children}
 </div>
 );
}

function DropdownMenuLabel({
 className,
 children,
 ...props
}: {
 className?: string;
 children: React.ReactNode;
}) {
 return (
 <div
 className={cn("px-3 py-1.5 text-xs font-semibold text-white/40 uppercase tracking-widest", className)}
 {...props}
 >
 {children}
 </div>
 );
}

function DropdownMenuSeparator({ className, ...props }: { className?: string }) {
 return (
 <div className={cn("-mx-1 my-1 h-px bg-white/10", className)} {...props} />
 );
}

function DropdownMenuPortal({ children }: { children: React.ReactNode }) {
 return <>{children}</>;
}

export {
 DropdownMenu,
 DropdownMenuTrigger,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuLabel,
 DropdownMenuSeparator,
 DropdownMenuPortal,
};
