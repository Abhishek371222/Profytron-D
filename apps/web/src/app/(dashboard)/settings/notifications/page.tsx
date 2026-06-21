'use client';

import React from 'react';
import { Bell, Mail, Smartphone, Shield, Zap, Activity, Moon, TrendingUp, CreditCard, Info } from 'lucide-react';
import { toast } from 'sonner';
import { SettingsSection, SettingsToggle } from '@/components/settings/SettingsUi';
import { DashButton } from '@/components/dashboard/DashboardPrimitives';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { notificationsApi, type NotificationPreferences } from '@/lib/api/notifications';

const CHANNELS = [
  { id: 'inAppEnabled',  icon: Smartphone, label: 'In-App',   desc: 'Alerts inside the dashboard'        },
  { id: 'emailEnabled',  icon: Mail,        label: 'Email',    desc: 'Email notifications via Resend'     },
  { id: 'pushEnabled',   icon: Bell,        label: 'Push',     desc: 'Browser & mobile push via Firebase' },
];

const CATEGORIES = [
  { id: 'securityAlerts',  icon: Shield,     label: 'Security',         desc: 'Login alerts, password changes',    severity: 'Critical' },
  { id: 'tradingAlerts',   icon: TrendingUp, label: 'Trading',          desc: 'Trade open, close, TP/SL events',  severity: 'High'     },
  { id: 'paymentAlerts',   icon: CreditCard, label: 'Payments',         desc: 'Deposits, subscriptions, billing',  severity: 'High'     },
  { id: 'accountAlerts',   icon: Info,       label: 'Account',          desc: 'Profile, KYC, verification',        severity: 'Normal'   },
  { id: 'systemAlerts',    icon: Zap,        label: 'System',           desc: 'Platform updates and AI events',    severity: 'Normal'   },
  { id: 'marketingAlerts', icon: Activity,   label: 'Marketing',        desc: 'Tips, offers, and announcements',   severity: 'Low'      },
];

const SEVERITY_STYLES: Record<string, string> = {
  Critical: 'bg-destructive/10 text-destructive border-destructive/20',
  High:     'bg-chart-4/10 text-chart-4 border-chart-4/20',
  Normal:   'bg-primary/10 text-primary border-primary/20',
  Low:      'bg-muted/20 text-foreground/40 border-white/[0.08]',
};

const DEFAULT_PREFS: NotificationPreferences = {
  id: '',
  inAppEnabled: true, emailEnabled: true, pushEnabled: true,
  securityAlerts: true, tradingAlerts: true, paymentAlerts: true,
  systemAlerts: true, marketingAlerts: false, accountAlerts: true,
  quietHoursEnabled: false, quietHoursStart: '22:00', quietHoursEnd: '07:00',
};

export default function NotificationsPage() {
  const [prefs, setPrefs] = React.useState<NotificationPreferences>(DEFAULT_PREFS);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [isDirty, setIsDirty] = React.useState(false);

  React.useEffect(() => {
    notificationsApi.getPreferences()
      .then((p) => setPrefs(p))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const update = (key: keyof NotificationPreferences, value: any) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await notificationsApi.updatePreferences(prefs);
      setPrefs(saved);
      setIsDirty(false);
      toast.success('Notification preferences saved');
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-muted/10" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Channels */}
      <SettingsSection title="Notification channels" description="Choose how Profytron reaches you.">
        <div className="grid gap-3 sm:grid-cols-3">
          {CHANNELS.map((ch) => {
            const Icon = ch.icon;
            const active = prefs[ch.id as keyof NotificationPreferences] as boolean;
            return (
              <div key={ch.id} className={cn('rounded-xl border p-4 transition-colors', active ? 'border-primary/30 bg-primary/5' : 'border-[var(--card-border)] bg-muted/20')}>
                <div className="flex items-center justify-between mb-3">
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground')}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <Switch
                    checked={active}
                    onCheckedChange={() => update(ch.id as keyof NotificationPreferences, !active)}
                  />
                </div>
                <p className="text-sm font-semibold text-foreground">{ch.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{ch.desc}</p>
              </div>
            );
          })}
        </div>
      </SettingsSection>

      {/* Categories */}
      <SettingsSection title="Alert categories" description="Control which types of alerts you receive.">
        <div className="space-y-3">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = prefs[cat.id as keyof NotificationPreferences] as boolean;
            return (
              <div key={cat.id} className="flex items-center justify-between rounded-xl border border-[var(--card-border)] p-4">
                <div className="flex items-center gap-3">
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', active ? 'bg-primary/10 text-primary' : 'bg-muted/30 text-muted-foreground')}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">{cat.label}</p>
                      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', SEVERITY_STYLES[cat.severity])}>
                        {cat.severity}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{cat.desc}</p>
                  </div>
                </div>
                <Switch
                  checked={active}
                  onCheckedChange={() => update(cat.id as keyof NotificationPreferences, !active)}
                />
              </div>
            );
          })}
        </div>
      </SettingsSection>

      {/* Quiet hours */}
      <SettingsSection title="Quiet hours" description="Pause non-critical alerts during set hours.">
        <SettingsToggle
          label="Mute non-critical notifications overnight"
          description={`Silence between ${prefs.quietHoursStart} – ${prefs.quietHoursEnd}. Security alerts always get through.`}
          checked={prefs.quietHoursEnabled}
          onChange={() => update('quietHoursEnabled', !prefs.quietHoursEnabled)}
        />
        {prefs.quietHoursEnabled && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                <Moon className="w-3 h-3" /> Start time
              </label>
              <input
                type="time"
                value={prefs.quietHoursStart}
                onChange={(e) => update('quietHoursStart', e.target.value)}
                className="w-full rounded-lg border border-[var(--card-border)] bg-muted/20 px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                <Bell className="w-3 h-3" /> End time
              </label>
              <input
                type="time"
                value={prefs.quietHoursEnd}
                onChange={(e) => update('quietHoursEnd', e.target.value)}
                className="w-full rounded-lg border border-[var(--card-border)] bg-muted/20 px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
              />
            </div>
          </div>
        )}
      </SettingsSection>

      {/* Save */}
      <div className="flex justify-end pt-2 border-t border-[var(--card-border)]">
        <DashButton onClick={handleSave} disabled={!isDirty || saving} className="gap-2">
          <Bell className="h-4 w-4" />
          {saving ? 'Saving…' : 'Save Preferences'}
        </DashButton>
      </div>
    </div>
  );
}
