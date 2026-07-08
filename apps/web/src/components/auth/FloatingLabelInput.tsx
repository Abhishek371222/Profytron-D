'use client';

import React, { useEffect, useId, useState } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon;
  error?: string;
}

export const FloatingLabelInput = React.forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  ({ label, icon: Icon, error, className, id, value, defaultValue, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const [isFocused, setIsFocused] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [localValue, setLocalValue] = useState(
      () => String(value ?? defaultValue ?? ''),
    );

    useEffect(() => {
      setMounted(true);
    }, []);

    useEffect(() => {
      if (value !== undefined && value !== null) {
        setLocalValue(String(value));
      }
    }, [value]);

    const hasValue = localValue.length > 0;

    const inputProps: React.InputHTMLAttributes<HTMLInputElement> = {
      ...props,
      id: inputId,
      defaultValue: value === undefined ? defaultValue : undefined,
      suppressHydrationWarning: true,
      onFocus: (e) => {
        setIsFocused(true);
        props.onFocus?.(e);
      },
      onBlur: (e) => {
        setIsFocused(false);
        props.onBlur?.(e);
      },
      onChange: (e) => {
        setLocalValue(e.target.value);
        props.onChange?.(e);
      },
    };

    if (value !== undefined && value !== null) {
      inputProps.value = value;
    }

    return (
      <div className="w-full space-y-1.5 group/input">
        <div className="relative">
          <div
            className={cn(
              'absolute inset-0 rounded-input transition-opacity duration-500 blur-xl opacity-0',
              isFocused
                ? 'bg-primary/10 opacity-100'
                : 'group-hover/input:bg-foreground/5 group-hover/input:opacity-50',
            )}
          />

          <div className="relative flex items-center">
            <input
              {...inputProps}
              ref={ref}
              className={cn(
                'peer w-full h-12 bg-input backdrop-blur-md border border-input-border rounded-input px-5 pt-5 pb-1.5 outline-none transition-all duration-300 font-sans text-body text-foreground placeholder-transparent',
                'hover:bg-input/80 hover:border-primary/25',
                '[&:-webkit-autofill]:[box-shadow:0_0_0_1000px_var(--input)_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:var(--foreground)]',
                isFocused && 'bg-card border-primary/30 ring-1 ring-ring/30',
                error && 'border-destructive/50 focus:border-destructive ring-destructive/20',
                className,
              )}
              placeholder={label}
            />

            <label
              htmlFor={inputId}
              className={cn(
                'absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none transition-all duration-300 ease-out origin-left text-body-sm font-semibold tracking-wide',
                'peer-[:not(:placeholder-shown)]:translate-y-[-18px] peer-[:not(:placeholder-shown)]:scale-[0.72] peer-[:not(:placeholder-shown)]:text-primary',
                'peer-autofill:translate-y-[-18px] peer-autofill:scale-[0.72] peer-autofill:text-primary',
                (isFocused || hasValue) && 'translate-y-[-18px] scale-[0.72] text-primary',
              )}
            >
              {label}
            </label>

            {Icon && (
              <div
                className={cn(
                  'absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300',
                  isFocused ? 'text-primary scale-110' : 'text-text-muted',
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
            )}

            {mounted && (
              <div className="absolute bottom-0 left-5 right-5 h-px bg-linear-to-r from-transparent via-border to-transparent overflow-hidden">
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: isFocused ? '100%' : '-100%' }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  className="w-1/2 h-full bg-linear-to-r from-transparent via-primary/50 to-transparent"
                />
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-caption text-destructive font-semibold uppercase tracking-widest px-4"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  },
);

FloatingLabelInput.displayName = 'FloatingLabelInput';
