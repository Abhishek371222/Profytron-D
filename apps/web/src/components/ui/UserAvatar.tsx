'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

function hashName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return hash;
}

const AVATAR_PALETTES = [
  { bg: 'bg-primary/15', text: 'text-primary', ring: 'ring-primary/20' },
  { bg: 'bg-chart-3/15', text: 'text-chart-3', ring: 'ring-chart-3/20' },
  { bg: 'bg-blue-500/15', text: 'text-blue-600', ring: 'ring-blue-500/20' },
  { bg: 'bg-violet-500/15', text: 'text-violet-600', ring: 'ring-violet-500/20' },
  { bg: 'bg-orange-500/15', text: 'text-orange-600', ring: 'ring-orange-500/20' },
];

const SIZE_MAP = {
  xs: 'h-6 w-6 text-[9px]',
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-sm',
  xl: 'h-14 w-14 text-base',
} as const;

export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/** Instant local avatar — no external API. Uses real `src` when provided; falls back to initials. */
export function UserAvatar({
  name,
  src,
  size = 'md',
  className,
  rounded = 'full',
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof SIZE_MAP;
  className?: string;
  rounded?: 'full' | 'xl';
}) {
  const [failed, setFailed] = React.useState(false);
  const palette = AVATAR_PALETTES[hashName(name || 'user') % AVATAR_PALETTES.length];
  const initials = getInitials(name || 'User');
  const roundedClass = rounded === 'full' ? 'rounded-full' : 'rounded-xl';
  const sizeClass = SIZE_MAP[size];

  const showImage = Boolean(src && !failed && (src.startsWith('http') || src.startsWith('/')));

  if (showImage) {
    return (
      <div className={cn('relative shrink-0 overflow-hidden', roundedClass, sizeClass, className)}>
        <Image
          src={src!}
          alt=""
          fill
          unoptimized={src!.includes('dicebear') || src!.endsWith('.svg')}
          className="object-cover"
          onError={() => setFailed(true)}
          sizes={size === 'xl' ? '56px' : size === 'lg' ? '48px' : '36px'}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center font-bold ring-1',
        roundedClass,
        sizeClass,
        palette.bg,
        palette.text,
        palette.ring,
        className,
      )}
      aria-hidden
    >
      {initials}
    </div>
  );
}
