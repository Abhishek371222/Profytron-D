'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  coachVisualApi,
  type CoachEmotion,
  isExperienceEngineEnabled,
} from '@/platform/experience';

const EMOTION_LABEL: Record<CoachEmotion, string> = {
  idle: 'Ready',
  thinking: 'Thinking',
  tool: 'Working',
  streaming: 'Responding',
  speaking: 'Speaking',
  success: 'Done',
  error: 'Error',
};

/**
 * Professional AI Coach orb — CSS only (no gameplay).
 * Emotions: Idle | Thinking | Tool | Streaming | Speaking | Success | Error
 */
export function CoachOrb({
  emotion: emotionProp,
  size = 'md',
  className,
  showLabel = false,
}: {
  emotion?: CoachEmotion;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}) {
  const [emotion, setEmotion] = React.useState<CoachEmotion>(
    () => emotionProp ?? coachVisualApi.get(),
  );

  React.useEffect(() => {
    if (emotionProp) {
      setEmotion(emotionProp);
      if (isExperienceEngineEnabled()) coachVisualApi.set(emotionProp);
      return;
    }
    return coachVisualApi.subscribe(setEmotion);
  }, [emotionProp]);

  const dim =
    size === 'sm' ? 'h-7 w-7' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10';

  return (
    <div className={cn('relative inline-flex items-center gap-2', className)}>
      <div
        className={cn(
          'coach-orb relative shrink-0 rounded-full',
          dim,
          `coach-orb--${emotion}`,
        )}
        role="img"
        aria-label={`AI Coach ${EMOTION_LABEL[emotion]}`}
      >
        <span className="coach-orb__core" />
        <span className="coach-orb__ring" aria-hidden />
        {(emotion === 'thinking' ||
          emotion === 'streaming' ||
          emotion === 'speaking' ||
          emotion === 'tool') && (
          <span className="coach-orb__pulse" aria-hidden />
        )}
      </div>
      {showLabel && (
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {EMOTION_LABEL[emotion]}
        </span>
      )}
    </div>
  );
}
