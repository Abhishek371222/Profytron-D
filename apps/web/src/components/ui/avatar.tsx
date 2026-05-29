'use client';

import * as React from"react";
import { cn } from"@/lib/utils";

const AvatarContext = React.createContext<{
 status:"idle" |"Loading" |"loaded" |"error";
 setStatus: (status:"idle" |"Loading" |"loaded" |"error") => void;
}>({
 status:"idle",
 setStatus: () => {},
});

function Avatar({
 className,
 size ="default",
 ...props
}: React.HTMLAttributes<HTMLDivElement> & {
 size?:"default" |"sm" |"lg";
}) {
 const [status, setStatus] = React.useState<"idle" |"Loading" |"loaded" |"error">("idle");

 return (
 <AvatarContext.Provider value={{ status, setStatus }}>
 <div
 data-slot="avatar"
 data-size={size}
 className={cn(
"relative flex shrink-0 rounded-full select-none overflow-hidden",
 size ==="default" &&"size-8",
 size ==="lg" &&"size-10",
 size ==="sm" &&"size-6",
 className
 )}
 {...props}
 />
 </AvatarContext.Provider>
 );
}

function AvatarImage({ 
 className, 
 src, 
 alt, 
 ...props 
}: React.ImgHTMLAttributes<HTMLImageElement>) {
 const { setStatus } = React.useContext(AvatarContext);

 return (
 <img
 data-slot="avatar-image"
 src={src}
 alt={alt}
 onLoad={() => setStatus("loaded")}
 onError={() => setStatus("error")}
 className={cn("aspect-square size-full object-cover", className)}
 {...props}
 />
 );
}

function AvatarFallback({
 className,
 children,
 ...props
}: React.HTMLAttributes<HTMLDivElement>) {
 const { status } = React.useContext(AvatarContext);

 if (status ==="loaded") return null;

 return (
 <div
 data-slot="avatar-fallback"
 className={cn(
"flex size-full items-center justify-center rounded-full bg-muted text-sm text-muted-foreground font-medium uppercase",
 className
 )}
 {...props}
 >
 {children}
 </div>
 );
}

function AvatarBadge({ className, ...props }: React.ComponentProps<"span">) {
 return (
 <span
 data-slot="avatar-badge"
 className={cn(
"absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-p text-white ring-2 ring-bg-base size-2.5",
 className
 )}
 {...props}
 />
 );
}

function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) {
 return (
 <div
 data-slot="avatar-group"
 className={cn(
"flex -space-x-2",
 className
 )}
 {...props}
 />
 );
}

function AvatarGroupCount({
 className,
 children,
 ...props
}: React.ComponentProps<"div">) {
 return (
 <div
 data-slot="avatar-group-count"
 className={cn(
"relative flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground ring-2 ring-background",
 className
 )}
 {...props}
 >
 {children}
 </div>
 );
}

export {
 Avatar,
 AvatarImage,
 AvatarFallback,
 AvatarGroup,
 AvatarGroupCount,
 AvatarBadge,
};
