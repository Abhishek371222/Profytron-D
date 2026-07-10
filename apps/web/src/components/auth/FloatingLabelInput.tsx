'use client';

import React, { useEffect, useId, useState } from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/** Thin black I-beam — same proportions as the system text cursor, always black. */
const BLACK_TEXT_CURSOR =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='19' viewBox='0 0 11 19'%3E%3Crect x='0' y='0' width='11' height='1' fill='%23000'/%3E%3Crect x='5' y='0' width='1' height='19' fill='%23000'/%3E%3Crect x='0' y='18' width='11' height='1' fill='%23000'/%3E%3C/svg%3E\") 5 9, text";

function forceBlackCaret(el: HTMLInputElement) {
  el.style.setProperty('caret-color', '#000000', 'important');
  el.style.setProperty('cursor', BLACK_TEXT_CURSOR, 'important');
  el.style.setProperty('color-scheme', 'light', 'important');
}

interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon;
  error?: string;
}

export const FloatingLabelInput = React.forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  ({ label, icon: Icon, error, className, id, value, defaultValue, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const localRef = React.useRef<HTMLInputElement | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [localValue, setLocalValue] = useState(
      () => String(value ?? defaultValue ?? ''),
    );

    const isPassword = props.type === 'password';

    const setRefs = React.useCallback(
      (node: HTMLInputElement | null) => {
        localRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
        if (node) forceBlackCaret(node);
      },
      [ref],
    );

    useEffect(() => {
      setMounted(true);
    }, []);

    useEffect(() => {
      if (value !== undefined && value !== null) {
        setLocalValue(String(value));
      }
    }, [value]);

    // Re-apply after type toggles (password ↔ text) — browsers reset caret/cursor then
    useEffect(() => {
      if (localRef.current) forceBlackCaret(localRef.current);
    }, [showPassword]);

    const hasValue = localValue.length > 0;

    const keepCaretBlack = (e: React.SyntheticEvent<HTMLInputElement>) => {
      forceBlackCaret(e.currentTarget);
    };

    const inputProps: React.InputHTMLAttributes<HTMLInputElement> = {
      ...props,
      type: isPassword ? (showPassword ? 'text' : 'password') : props.type,
      id: inputId,
      defaultValue: value === undefined ? defaultValue : undefined,
      suppressHydrationWarning: true,
      onPointerDown: (e) => {
        forceBlackCaret(e.currentTarget);
        props.onPointerDown?.(e);
      },
      onMouseEnter: (e) => {
        forceBlackCaret(e.currentTarget);
        props.onMouseEnter?.(e);
      },
      onFocus: (e) => {
        setIsFocused(true);
        forceBlackCaret(e.currentTarget);
        // Password fields often flip caret color one frame later
        requestAnimationFrame(() => forceBlackCaret(e.currentTarget));
        props.onFocus?.(e);
      },
      onBlur: (e) => {
        setIsFocused(false);
        props.onBlur?.(e);
      },
      onChange: (e) => {
        setLocalValue(e.target.value);
        forceBlackCaret(e.currentTarget);
        props.onChange?.(e);
      },
      onSelect: (e) => {
        keepCaretBlack(e);
        props.onSelect?.(e);
      },
      onKeyUp: (e) => {
        forceBlackCaret(e.currentTarget);
        props.onKeyUp?.(e);
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
              'pointer-events-none absolute inset-0 rounded-input transition-opacity duration-500 blur-xl opacity-0',
              isFocused
                ? 'bg-primary/10 opacity-100'
                : 'group-hover/input:bg-foreground/5 group-hover/input:opacity-50',
            )}
          />

          <div className="relative flex items-center">
            <input
              {...inputProps}
              ref={setRefs}
              className={cn(
                'peer auth-field w-full h-12 bg-input backdrop-blur-md border border-input-border rounded-input px-5 pt-5 pb-1.5 outline-none transition-all duration-300 font-sans text-body text-foreground placeholder-transparent',
                'hover:bg-input/80 hover:border-primary/25',
                '[&:-webkit-autofill]:[box-shadow:0_0_0_1000px_#ffffff_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#0a0a0a] [&:-webkit-autofill]:[caret-color:#000000]',
                isPassword &&
                  'pr-12 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden [&::-webkit-credentials-auto-fill-button]:hidden [&::-webkit-strong-password-auto-fill-button]:hidden',
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

            {isPassword ? (
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className={cn(
                  'absolute right-5 top-1/2 -translate-y-1/2 transition-all duration-300',
                  isFocused ? 'text-primary' : 'text-text-muted hover:text-foreground',
                )}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            ) : (
              Icon && (
                <div
                  className={cn(
                    'absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300',
                    isFocused ? 'text-primary scale-110' : 'text-text-muted',
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
              )
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
