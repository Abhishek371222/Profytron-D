'use client';

import React, { useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { usersApi } from '@/lib/api/users';
import { UserAvatar } from '@/components/ui/UserAvatar';
import {
  SettingsSection,
  SettingsField,
  SettingsInput,
  SettingsTextarea,
  SettingsToggle,
  SettingsRow,
} from '@/components/settings/SettingsUi';
import { DashButton } from '@/components/dashboard/DashboardPrimitives';

export default function ProfileSettingsPage() {
  const { data: user, isLoading } = useCurrentUser();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [avatarPreview, setAvatarPreview] = React.useState('');
  const [demoMode, setDemoMode] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDirty, setIsDirty] = React.useState(false);

  React.useEffect(() => {
    if (user && !isDirty) {
      setFullName(user.fullName || '');
      setUsername(user.username || '');
      setBio(user.bio || '');
      setAvatarPreview(user.avatarUrl || '');
    }
  }, [user, isDirty]);

  const markDirty = () => setIsDirty(true);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await usersApi.updateProfile({ fullName, username, bio });
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setIsDirty(false);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(String(reader.result));
      markDirty();
    };
    reader.readAsDataURL(file);
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading profile…</div>;
  }

  return (
    <div className="space-y-8">
      <SettingsSection title="Profile" description="Your public identity on Profytron.">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="relative shrink-0">
            <UserAvatar name={fullName || user?.email || 'User'} src={avatarPreview || undefined} size="xl" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md"
              aria-label="Upload avatar"
            >
              <Upload className="h-3.5 w-3.5" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div className="flex-1 space-y-4 w-full">
            <SettingsRow>
              <SettingsField label="Full name">
                <SettingsInput value={fullName} onChange={(e) => { setFullName(e.target.value); markDirty(); }} placeholder="Your name" />
              </SettingsField>
              <SettingsField label="Username">
                <SettingsInput value={username} onChange={(e) => { setUsername(e.target.value); markDirty(); }} placeholder="@username" />
              </SettingsField>
            </SettingsRow>
            <SettingsField label="Bio" hint="Brief description shown on your public profile.">
              <SettingsTextarea value={bio} onChange={(e) => { setBio(e.target.value); markDirty(); }} placeholder="Tell others about your trading style…" rows={3} />
            </SettingsField>
            <SettingsField label="Email">
              <SettingsInput value={user?.email || ''} disabled className="opacity-60" />
            </SettingsField>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Trading preferences" description="Simulation and display options.">
        <SettingsToggle
          label="Paper trading mode"
          description="Use simulated funds instead of live broker execution."
          checked={demoMode}
          onChange={(v) => { setDemoMode(v); markDirty(); }}
        />
      </SettingsSection>

      <div className="flex justify-end pt-2 border-t border-[var(--card-border)]">
        <DashButton onClick={handleSave} disabled={!isDirty || isSaving} className="gap-2 min-w-[120px]">
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Changes
        </DashButton>
      </div>
    </div>
  );
}
