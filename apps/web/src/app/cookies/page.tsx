'use client';

import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import {
  MarketingHero,
  MarketingSection,
  MarketingBand,
  MarketingCard,
} from '@/components/marketing/MarketingPage';
import { Cookie, Check, X } from 'lucide-react';

const cookieTypes = [
  {
    name: 'Strictly Necessary',
    tag: 'Always Active',
    tagColor: 'text-chart-3 bg-chart-3/10 border-chart-3/20',
    canDisable: false,
    desc: 'These cookies are essential for the Profytron platform to function. They manage your authenticated session, maintain CSRF security tokens, and enable core features such as login persistence and order submission. The platform cannot function correctly without these cookies.',
    examples: ['profytron_session', 'csrf_token', 'auth_refresh_token'],
  },
  {
    name: 'Performance & Analytics',
    tag: 'Optional',
    tagColor: 'text-primary bg-primary/10 border-primary/20',
    canDisable: true,
    desc: 'These cookies help us understand how users interact with the platform — which pages are visited, where errors occur, and which features are used most. The data collected is anonymized and is used solely to improve the reliability and usability of the Service. No personally identifiable information is shared with analytics providers.',
    examples: ['_profytron_aid', 'sentry_session'],
  },
  {
    name: 'Functional',
    tag: 'Optional',
    tagColor: 'text-primary bg-primary/10 border-primary/20',
    canDisable: true,
    desc: 'Functional cookies remember your preferences and interface settings — such as your selected dashboard layout, language preference, and notification configuration — so that they persist between sessions. Disabling these does not affect core trading functionality; your preferences will simply reset on each visit.',
    examples: ['ui_theme', 'dashboard_layout', 'notification_prefs'],
  },
];

const retention = [
  { name: 'profytron_session', purpose: 'Authenticated session state', duration: 'Session (expires on browser close or logout)' },
  { name: 'csrf_token', purpose: 'CSRF attack prevention', duration: '24 hours' },
  { name: 'auth_refresh_token', purpose: 'JWT refresh token (HttpOnly, Secure)', duration: '7 days' },
  { name: 'ui_theme', purpose: 'User interface preference', duration: '1 year' },
  { name: 'dashboard_layout', purpose: 'Dashboard panel configuration', duration: '1 year' },
  { name: '_profytron_aid', purpose: 'Anonymous analytics identifier', duration: '30 days' },
  { name: 'sentry_session', purpose: 'Error tracking session (anonymized)', duration: 'Session' },
];

export default function CookiePolicyPage() {
  return (
    <PublicPageLayout>
      <MarketingHero
        eyebrow="Legal"
        eyebrowIcon={Cookie}
        title="Cookie Policy"
        description="This Cookie Policy explains what cookies are, which cookies we use, why we use them, and how you can manage your preferences."
        meta={
          <div className="flex flex-wrap gap-4 text-xs font-medium text-muted-foreground">
            <span>Effective: April 12, 2026</span>
            <span>Last updated: April 12, 2026</span>
          </div>
        }
      />

      <MarketingSection narrow>
        <MarketingCard>
          <h2 className="dash-section-title mb-4">What Are Cookies?</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Cookies are small text files placed on your device by a website or web application when you visit it. They allow the service to remember information about your visit — such as your login state, interface preferences, and session identifier.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            In addition to cookies, we may use similar technologies such as local storage and session storage for the same functional purposes. This policy applies to all such technologies collectively.
          </p>
        </MarketingCard>
      </MarketingSection>

      <MarketingBand>
        <h2 className="dash-section-title mb-8">Cookie Categories</h2>
        <div className="flex flex-col gap-6">
          {cookieTypes.map((type) => (
            <MarketingCard key={type.name}>
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-foreground">{type.name}</h3>
                  <span className={`mt-1.5 inline-block rounded border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${type.tagColor}`}>
                    {type.tag}
                  </span>
                </div>
                <div className={`mt-1 flex shrink-0 items-center gap-1.5 text-xs font-medium ${type.canDisable ? 'text-muted-foreground' : 'text-chart-3'}`}>
                  {type.canDisable ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                  {type.canDisable ? 'Can be disabled' : 'Cannot be disabled'}
                </div>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{type.desc}</p>
              <div className="flex flex-wrap gap-2">
                {type.examples.map((ex) => (
                  <code key={ex} className="rounded border border-[var(--card-border)] bg-muted/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {ex}
                  </code>
                ))}
              </div>
            </MarketingCard>
          ))}

          <MarketingCard className="bg-muted/20">
            <p className="text-xs leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">Marketing & Targeting Cookies:</span> Profytron does not currently use third-party advertising or behavioural tracking cookies. If this changes in the future, this policy will be updated and you will be notified in advance.
            </p>
          </MarketingCard>
        </div>
      </MarketingBand>

      <MarketingSection narrow>
        <h2 className="dash-section-title mb-8">Cookie Retention Periods</h2>
        <div className="overflow-hidden rounded-2xl border border-[var(--card-border)]">
          <div className="grid grid-cols-3 border-b border-[var(--card-border)] bg-muted/30 px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <div>Cookie Name</div>
            <div>Purpose</div>
            <div>Duration</div>
          </div>
          {retention.map((r) => (
            <div
              key={r.name}
              className="grid grid-cols-3 border-b border-[var(--card-border)] px-5 py-4 text-sm transition-colors last:border-b-0 hover:bg-muted/20"
            >
              <code className="font-mono text-xs text-primary">{r.name}</code>
              <span className="text-xs text-muted-foreground">{r.purpose}</span>
              <span className="font-mono text-xs text-muted-foreground">{r.duration}</span>
            </div>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection narrow className="border-t border-[var(--card-border)] pb-20">
        <MarketingCard>
          <h2 className="dash-section-title mb-5">How to Control Cookies</h2>
          <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              <span className="font-semibold text-foreground">Browser Settings:</span> All major browsers allow you to view, block, or delete cookies through their privacy or security settings.
            </p>
            <p>
              <span className="font-semibold text-foreground">Important:</span> Disabling or deleting cookies classified as Strictly Necessary will prevent you from remaining logged in and will interrupt the core functionality of the platform, including order execution.
            </p>
            <p>
              <span className="font-semibold text-foreground">Queries:</span> If you have any questions about cookies or how we use them, contact us at{' '}
              <a href="mailto:support@profytron.com" className="text-primary transition-colors hover:text-primary-hover">
                support@profytron.com
              </a>
              .
            </p>
          </div>
        </MarketingCard>
      </MarketingSection>
    </PublicPageLayout>
  );
}
