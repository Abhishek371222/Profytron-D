'use client';

import * as React from"react";
import { motion, AnimatePresence } from"framer-motion";
import { cn } from"@/lib/utils";
import { ChevronRightIcon, CheckIcon } from"lucide-react";

const DropdownMenuContext = React.createContext<{
 open: boolean;
 setOpen: (open: boolean) => void;
 triggerRef: React.RefObject<HTMLElement | null>;
}>({
 open: false,
 setOpen: () => {},
 triggerRef: { current: null },
});

function DropdownMenu({ children, ...props }: { children: React.ReactNode }) {
 const [open, setOpen] = React.useState(false);
 const triggerRef = React.useRef<HTMLElement | null>(null);
 return (
 <DropdownMenuContext.Provider value={{ open, setOpen, triggerRef }}>
 <div className="relative inline-block" {...props}>
 {children}
 </div>
 </DropdownMenuContext.Provider>
 );
}

function DropdownMenuTrigger({ asChild, children, ...props }: { asChild?: boolean; children: React.ReactNode }) {
 const { open, setOpen } = React.useContext(DropdownMenuContext);
 const child = children as React.ReactElement<any>;
 const isElement = React.isValidElement(child);
 const originalOnClick = isElement ? (child.props as any).onClick : undefined;
 const originalOnKeyDown = isElement ? (child.props as any).onKeyDown : undefined;

 const content = isElement
 ? React.cloneElement(child, {
 onClick: (e: React.MouseEvent) => {
 originalOnClick?.(e);
 setOpen(!open);
 },
 onKeyDown: (e: React.KeyboardEvent) => {
 originalOnKeyDown?.(e);
 if (e.key ==="ArrowDown" || e.key ==="ArrowUp") {
 e.preventDefault();
 setOpen(true);
 }
 },
"aria-haspopup":"menu",
"aria-expanded": open,
 } as any)
 : children;

 return (
 <DropdownMenuTriggerWrapper {...props}>{content}</DropdownMenuTriggerWrapper>
 );
}

function DropdownMenuTriggerWrapper({
 children,
 ...props
}: {
 children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
 const { triggerRef } = React.useContext(DropdownMenuContext);
 return (
 <div
 data-slot="dropdown-menu-trigger"
 ref={triggerRef as React.RefObject<HTMLDivElement>}
 className="cursor-pointer"
 {...props}
 >
 {children}
 </div>
 );
}

function DropdownMenuContent({
 align ="start",
 side: _side,
 role ="menu",
 className,
 children,
 ...props
}: {
 align?:"start" |"end" |"center";
 side?: "top" | "right" | "bottom" | "left";
 role?: string;
 className?: string;
 children: React.ReactNode;
}) {
 const { open, setOpen, triggerRef } = React.useContext(DropdownMenuContext);
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

 const getMenuItems = React.useCallback(
 (root: HTMLDivElement | null) =>
 root
 ? Array.from(root.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])'))
 : [],
 [],
 );

 const focusItemAt = React.useCallback((index: number, items: HTMLElement[]) => {
 if (!items.length) return;
 const clamped = ((index % items.length) + items.length) % items.length;
 items[clamped]?.focus();
 }, []);

 React.useEffect(() => {
 if (!open) return;
 const id = requestAnimationFrame(() => {
 const items = getMenuItems(containerRef.current);
 items[0]?.focus();
 });
 return () => cancelAnimationFrame(id);
 }, [open, getMenuItems]);

 const handleKeyDown = (e: React.KeyboardEvent) => {
 const items = getMenuItems(containerRef.current);
 const currentIndex = items.indexOf(document.activeElement as HTMLElement);
 switch (e.key) {
 case"ArrowDown":
 e.preventDefault();
 focusItemAt(currentIndex + 1, items);
 break;
 case"ArrowUp":
 e.preventDefault();
 focusItemAt(currentIndex - 1, items);
 break;
 case"Home":
 e.preventDefault();
 focusItemAt(0, items);
 break;
 case"End":
 e.preventDefault();
 focusItemAt(items.length - 1, items);
 break;
 case"Escape":
 e.preventDefault();
 setOpen(false);
 (triggerRef.current as HTMLElement | null)?.querySelector<HTMLElement>('button, a, [tabindex]')?.focus();
 break;
 case"Tab":
 setOpen(false);
 break;
 default:
 break;
 }
 };

 return (
 <AnimatePresence>
 {open && (
 <motion.div
 ref={containerRef}
 role={role}
 aria-orientation={role ==="menu" ?"vertical" : undefined}
 onKeyDown={handleKeyDown}
 initial={{ opacity: 0, y: 10, scale: 0.95 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: 10, scale: 0.95 }}
 transition={{ duration: 0.2, ease:"easeOut" }}
 className={cn(
"absolute z-50 min-w-[8rem] overflow-hidden rounded-card border border-card-border bg-popover/95 backdrop-blur-2xl p-1 text-foreground shadow-[var(--shadow-lg)] mt-2",
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
 disabled,
 ...props
}: {
 className?: string;
 children: React.ReactNode;
 onClick?: () => void;
 disabled?: boolean;
}) {
 const { setOpen } = React.useContext(DropdownMenuContext);

 const handleActivate = () => {
 if (disabled) return;
 if (onClick) onClick();
 setOpen(false);
 };

 return (
 <div
 data-slot="dropdown-menu-item"
 role="menuitem"
 tabIndex={-1}
 aria-disabled={disabled || undefined}
 onClick={handleActivate}
 onKeyDown={(e) => {
 if (e.key ==="Enter" || e.key ===" ") {
 e.preventDefault();
 handleActivate();
 }
 }}
 className={cn(
"relative flex cursor-pointer select-none items-center rounded-button px-3 py-2 text-sm text-foreground outline-none transition-colors hover:bg-muted active:bg-muted/70 focus-visible:bg-muted focus:bg-muted",
 disabled &&"pointer-events-none opacity-50",
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
 role="presentation"
 className={cn("px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-widest", className)}
 {...props}
 >
 {children}
 </div>
 );
}

function DropdownMenuSeparator({ className, ...props }: { className?: string }) {
 return (
 <div role="separator" className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />
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
