'use client';

import React from 'react';
import { Bell, Mail, Smartphone, MessageSquare, Zap, Activity, Shield } from 'lucide-react';
import { toast } from 'sonner';
import {
  SettingsSection,
  SettingsToggle,
} from '@/components/settings/SettingsUi';
import { DashButton } from '@/components/dashboard/DashboardPrimitives';
import { cn } from '@/lib/utils';

const CHANNELS = [
  { id: 'app', icon: Smartphone, label: 'In-app notifications', desc: 'Alerts inside the dashboard' },
  { id: 'email', icon: Mail, label: 'Email', desc: 'Weekly summaries and important updates' },
  { id: 'telegram', icon: MessageSquare, label: 'Telegram', desc: 'Instant alerts via Telegram bot' },
];

const ALERT_TYPES = [
  { id: 'signals', icon: Zap, label: 'Signal alerts', desc: 'When strategies match entry criteria', severity: 'Critical' },
  { id: 'execution', icon: Activity, label: 'Execution status', desc: 'Trade open, close, and fill events', severity: 'High' },
  { id: 'security', icon: Shield, label: 'Security & auth', desc: 'Login attempts and credential changes', severity: 'Critical' },
];

export default function NotificationsPage() {
  const [channels, setChannels] = React.useState({ app: true, email: true, telegram: false });
  const [matrix, setMatrix] = React.useState<Record<string, { app: boolean; email: boolean; push: boolean }>>({
    signals: { app: true, email: true, push: true },
    execution: { app: true, email: false, push: true },
    security: { app: true, email: true, push: true },
  });
  const [isDirty, setIsDirty] = React.useState(false);

  const toggleChannel = (id: keyof typeof channels) => {
    setChannels((prev) => ({ ...prev, [id]: !prev[id] }));
    setIsDirty(true);
  };

  const toggleMatrix = (typeId: string, ch: 'app' | 'email' | 'push') => {
    setMatrix((prev) => ({
      ...prev,
      [typeId]: { ...prev[typeId], [ch]: !prev[typeId]?.[ch] },
    }));
    setIsDirty(true);
  };

  const handleSave = () => {
    setIsDirty(false);
    toast.success('Notification preferences saved');
  };

  return (
    <div className="space-y-8">
      <SettingsSection title="Notification channels" description="Choose how you receive alerts.">
        <div className="grid gap-3 sm:grid-cols-3">
          {CHANNELS.map((ch) => {
            const Icon = ch.icon;
            const active = channels[ch.id as keyof typeof channels];
            return (
              <div
                key={ch.id}
                className={cn(
                  'rounded-xl border p-4 transition-colors',
                  active ? 'border-primary/30 bg-primary/5' : 'border-[var(--card-border)] bg-muted/20',
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground')}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={active}
                    onClick={() => toggleChannel(ch.id as keyof typeof channels)}
                    className={cn('relative h-5 w-9 rounded-full transition-colors', active ? 'bg-primary' : 'bg-muted')}
                  >
                    <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', active ? 'translate-x-4' : 'translate-x-0.5')} />
                  </button>
                </div>
                <p className="text-sm font-semibold text-foreground">{ch.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{ch.desc}</p>
              </div>
            );
          })}
        </div>
      </SettingsSection>

      <SettingsSection title="Alert types" description="Fine-tune which alerts go to each channel.">
        <div className="space-y-3">
          {ALERT_TYPES.map((type) => {
            const Icon = type.icon;
            const row = matrix[type.id];
            return (
              <div key={type.id} className="rounded-xl border border-[var(--card-border)] p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">{type.label}</p>
                      <span className={cn(
                        'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                        type.severity === 'Critical' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-chart-4/10 text-chart-4 border-chart-4/20',
                      )}>
                        {type.severity}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{type.desc}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 pl-12">
                  {(['app', 'email', 'push'] as const).map((ch) => (
                    <label key={ch} className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer capitalize">
                      <input
                        type="checkbox"
                        checked={row?.[ch] ?? false}
                        onChange={() => toggleMatrix(type.id, ch)}
                        className="rounded border-[var(--card-border)] accent-primary"
                      />
                      {ch === 'push' ? 'Push' : ch}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </SettingsSection>

      <SettingsSection title="Quiet hours">
        <SettingsToggle
          label="Mute notifications overnight"
          description="Silence non-critical alerts between 10 PM and 7 AM."
          checked={false}
          onChange={() => setIsDirty(true)}
        />
      </SettingsSection>

      <div className="flex justify-end pt-2 border-t border-[var(--card-border)]">
        <DashButton onClick={handleSave} disabled={!isDirty} className="gap-2">
          <Bell className="h-4 w-4" />
          Save Preferences
        </DashButton>
      </div>
    </div>
  );
}
