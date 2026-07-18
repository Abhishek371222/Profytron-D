'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function SettingsSection({
  title,
  description,
  children,
  className,
  delay = 0,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, delay, ease: 'easeOut' }}
      className={cn('min-w-0 max-w-full space-y-4 overflow-hidden rounded-[var(--radius-card)] border border-[var(--card-border)] bg-card p-4 shadow-[var(--shadow-card)] transition-shadow duration-300 hover:shadow-[var(--shadow-card-hover)] sm:p-5', className)}
    >
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {children}
    </motion.section>
  );
}

export function SettingsField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const fieldId = React.useId();
  const hintId = hint ? `${fieldId}-hint` : undefined;

  let control = children;
  let controlId: string | undefined;
  if (React.isValidElement(children)) {
    const childProps = children.props as {
      id?: string;
      'aria-describedby'?: string;
    };
    controlId = childProps.id ?? fieldId;
    control = React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
      id: controlId,
      'aria-describedby':
        [childProps['aria-describedby'], hintId].filter(Boolean).join(' ') || undefined,
    });
  }

  return (
    <div className="min-w-0 space-y-2">
      <label htmlFor={controlId} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {control}
      {hint && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}

export function SettingsInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'dash-input box-border h-11 w-full min-w-0 max-w-full text-sm',
        props.className,
      )}
    />
  );
}

export function SettingsTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        'dash-input box-border min-h-[100px] w-full min-w-0 max-w-full resize-y py-3 text-sm',
        props.className,
      )}
    />
  );
}

export function SettingsToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--card-border)] bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'inline-flex h-6 w-11 shrink-0 items-center rounded-full border-0 p-0.5 transition-colors duration-200',
          checked ? 'bg-primary' : 'bg-foreground/20',
        )}
      >
        <motion.span
          aria-hidden
          initial={false}
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          className="pointer-events-none block h-5 w-5 rounded-full bg-white shadow-md"
        />
      </button>
    </div>
  );
}

export function SettingsRow({ children }: { children: React.ReactNode }) {
  return <div className="grid min-w-0 gap-4 sm:grid-cols-2">{children}</div>;
}
