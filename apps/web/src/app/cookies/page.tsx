import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import { Cookie, Check, X } from 'lucide-react';

const cookieTypes = [
  {
    name: 'Strictly Necessary',
    tag: 'Always Active',
    tagColor: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    canDisable: false,
    desc: 'These cookies are essential for the Profytron platform to function. They manage your authenticated session, maintain CSRF security tokens, and enable core features such as login persistence and order submission. The platform cannot function correctly without these cookies.',
    examples: ['profytron_session', 'csrf_token', 'auth_refresh_token'],
  },
  {
    name: 'Performance & Analytics',
    tag: 'Optional',
    tagColor: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
    canDisable: true,
    desc: 'These cookies help us understand how users interact with the platform — which pages are visited, where errors occur, and which features are used most. The data collected is anonymized and is used solely to improve the reliability and usability of the Service. No personally identifiable information is shared with analytics providers.',
    examples: ['_profytron_aid', 'sentry_session'],
  },
  {
    name: 'Functional',
    tag: 'Optional',
    tagColor: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
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
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[500px] h-[250px] bg-indigo-600/8 blur-[100px] rounded-full pointer-events-none" />
        <div className="container mx-auto px-6 max-w-4xl relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-white/50 text-[10px] font-bold tracking-[0.4em] uppercase mb-8">
              <Cookie className="w-3 h-3 text-indigo-400" /> Legal
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-[-0.03em] text-white leading-tight mb-6">Cookie Policy</h1>
            <div className="flex items-center gap-6 text-white/30 text-xs font-mono">
              <span>Effective Date: April 12, 2026</span>
              <span>Last Updated: April 12, 2026</span>
            </div>
            <p className="mt-6 text-white/50 leading-relaxed">
              This Cookie Policy explains what cookies are, which cookies we use, why we use them, and how you can manage your preferences.
            </p>
          </div>
        </div>
      </section>

      {/* What are cookies */}
      <section className="pb-10">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <h2 className="text-lg font-bold text-white mb-4 tracking-tight">What Are Cookies?</h2>
            <p className="text-white/55 text-sm leading-relaxed">
              Cookies are small text files placed on your device by a website or web application when you visit it. They allow the service to remember information about your visit — such as your login state, interface preferences, and session identifier.
            </p>
            <p className="text-white/55 text-sm leading-relaxed mt-3">
              In addition to cookies, we may use similar technologies such as local storage and session storage for the same functional purposes. This policy applies to all such technologies collectively.
            </p>
          </div>
        </div>
      </section>

      {/* Cookie Types */}
      <section className="py-16 bg-black/20 border-y border-white/[0.05]">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="text-xl font-bold text-white mb-8 tracking-tight">Cookie Categories</h2>
          <div className="flex flex-col gap-6">
            {cookieTypes.map((type, i) => (
              <div 
                key={type.name}
                className="p-7 rounded-2xl bg-white/[0.02] border border-white/[0.06]"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-bold text-white text-base">{type.name}</h3>
                    <span className={`mt-1.5 inline-block px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-widest border ${type.tagColor}`}>{type.tag}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs font-medium shrink-0 mt-1 ${type.canDisable ? 'text-white/40' : 'text-emerald-400'}`}>
                    {type.canDisable ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                    {type.canDisable ? 'Can be disabled' : 'Cannot be disabled'}
                  </div>
                </div>
                <p className="text-white/50 text-sm leading-relaxed mb-4">{type.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {type.examples.map(ex => (
                    <code key={ex} className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-white/40 text-[10px] font-mono">{ex}</code>
                  ))}
                </div>
              </div>
            ))}

            <div className="p-6 rounded-xl bg-white/[0.01] border border-white/[0.04]">
              <p className="text-white/30 text-xs leading-relaxed">
                <span className="text-white/50 font-semibold">Marketing & Targeting Cookies:</span> Profytron does not currently use third-party advertising or behavioural tracking cookies. If this changes in the future, this policy will be updated and you will be notified in advance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Retention Table */}
      <section className="py-16">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="text-xl font-bold text-white mb-8 tracking-tight">Cookie Retention Periods</h2>
          <div className="rounded-2xl overflow-hidden border border-white/[0.06]">
            <div className="grid grid-cols-3 text-[10px] uppercase tracking-widest font-bold text-white/30 bg-white/[0.02] px-5 py-3 border-b border-white/[0.06]">
              <div>Cookie Name</div>
              <div>Purpose</div>
              <div>Duration</div>
            </div>
            {retention.map((r, i) => (
              <div 
                key={r.name}
                className="grid grid-cols-3 px-5 py-4 border-b border-white/[0.04] text-sm hover:bg-white/[0.02] transition-colors"
              >
                <code className="text-indigo-300 text-xs font-mono">{r.name}</code>
                <span className="text-white/50 text-xs">{r.purpose}</span>
                <span className="text-white/40 text-xs font-mono">{r.duration}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Control */}
      <section className="py-16 border-t border-white/[0.05]">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <h2 className="text-lg font-bold text-white mb-5 tracking-tight">How to Control Cookies</h2>
            <div className="text-white/55 text-sm leading-relaxed space-y-4">
              <p>
                <span className="text-white/70 font-semibold">Browser Settings:</span> All major browsers allow you to view, block, or delete cookies through their privacy or security settings.
              </p>
              <p>
                <span className="text-white/70 font-semibold">Important:</span> Disabling or deleting cookies classified as Strictly Necessary will prevent you from remaining logged in and will interrupt the core functionality of the platform, including order execution.
              </p>
              <p>
                <span className="text-white/70 font-semibold">Queries:</span> If you have any questions about cookies or how we use them, contact us at{' '}
                <a href="mailto:privacy@profytron.com" className="text-indigo-400 hover:text-indigo-300 transition-colors">privacy@profytron.com</a>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
}
