import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import { FileText } from 'lucide-react';

const sections = [
  {
    title: '1. Acceptance of Terms',
    content: `By accessing or using the Profytron platform ("Service"), you confirm that you have read, understood, and agreed to be bound by these Terms of Service ("Terms"). If you do not agree, you must not access or use the Service.

These Terms constitute a legally binding agreement between you and Profytron Technologies Pvt. Ltd., a private limited company incorporated under the Companies Act, 2013 ("Profytron", "we", or "us"). Your use of the Service is also governed by our Privacy Policy, Risk Disclosure Statement, and Cookie Policy, each of which is incorporated into these Terms by reference.`,
  },
  {
    title: '2. Eligibility',
    content: `You must be at least 18 years of age and have full legal capacity under the laws of your jurisdiction to enter into a binding agreement. By using the Service, you represent and warrant that you meet these requirements.

The Service is not available to, and may not be used by:
- Persons under 18 years of age
- Persons in breach of any applicable financial regulation in their jurisdiction
- Persons in countries or territories subject to sanctions imposed by the United Nations Security Council, the Government of India, or other applicable governmental authority
- Persons previously suspended or terminated from the Service for a violation of these Terms

If you use the Service on behalf of a company or legal entity, you represent that you have authority to bind that entity to these Terms.`,
  },
  {
    title: '3. Account Registration & Security',
    content: `You must register an account to access the Service. When registering, you agree to provide accurate, current, and complete information. You are responsible for keeping your account information up to date.

You are solely responsible for:
- Maintaining the confidentiality of your login credentials, API keys, and authentication tokens
- All activities that occur under your account
- Notifying us immediately at security@profytron.com upon becoming aware of any unauthorized access or suspected breach of your account

Profytron will not be liable for any loss or damage arising from unauthorized access to your account that results from your failure to take reasonable precautions.

You may not create more than one personal account without our prior written consent. Accounts created for the purpose of circumventing pricing, limits, or termination actions are prohibited.`,
  },
  {
    title: '4. Permitted Use & Prohibited Conduct',
    content: `You may use the Service solely for lawful trading, strategy development, and related analytical purposes. You agree that you will not:

- Use the Service to engage in market manipulation, wash trading, spoofing, layering, or any other practice prohibited under applicable securities law or exchange rules
- Access or attempt to access another user's account or data
- Reverse-engineer, decompile, disassemble, or attempt to extract the source code, AI models, or proprietary algorithms of the platform
- Resell, sublicense, rent, or otherwise make the Service available to any third party
- Use automated tools, scripts, or bots to scrape, crawl, or extract data from the Service beyond what is explicitly permitted by the API documentation
- Interfere with the Service's infrastructure, including by transmitting malware, exploiting vulnerabilities, or circumventing rate limits or authentication controls
- Violate any applicable Indian or foreign law, including the Securities and Exchange Board of India Act, 1992 (SEBI Act), the Prevention of Money Laundering Act, 2002, or any rules thereunder

We reserve the right to suspend or permanently terminate accounts that violate these restrictions, without prior notice and without liability. Where required by law, we will report violations to relevant authorities.`,
  },
  {
    title: '5. Subscription, Billing & Refunds',
    content: `Access to certain features of the Service requires a paid subscription ("Plan"). By subscribing to a Plan, you authorize Profytron to charge the payment method you have provided, in advance, for each subscription period.

**Automatic Renewal:** Subscriptions automatically renew at the end of each billing period (monthly or annually) unless you cancel at least 24 hours before the renewal date through your account dashboard.

**Cancellation:** You may cancel your subscription at any time. Upon cancellation, your access to paid features will continue until the end of the current billing period. No partial refunds are issued for unused time within a billing period.

**Refunds:** In accordance with the Consumer Protection (E-Commerce) Rules, 2020, you may request a refund within 7 days of your initial subscription payment if you have not accessed any paid features. Refund requests submitted after 7 days, or where paid features have been used, are evaluated at our sole discretion.

**Price Changes:** We reserve the right to change subscription pricing. We will provide at least 30 days' notice of any price change via email. Continued use of the Service after the effective date of a price change constitutes acceptance of the new pricing.

**Taxes:** Prices displayed exclude Goods and Services Tax (GST) or other applicable taxes, which will be applied at checkout based on your billing address.`,
  },
  {
    title: '6. Intellectual Property',
    content: `The Profytron platform — including its software, source code, algorithms, AI models, user interface, documentation, brand assets, and all related intellectual property — is owned by or licensed to Profytron Technologies Pvt. Ltd. and is protected under applicable Indian intellectual property law, including the Copyright Act, 1957 and the Trade Marks Act, 1999.

**Your Content:** Trading strategies, custom configurations, and other content you create using the Service remain your intellectual property.

**Marketplace Licence:** If you choose to publish a strategy to the Profytron Marketplace, you grant us a non-exclusive, royalty-free, worldwide licence to display, distribute, and facilitate the sale of that strategy through our platform for as long as it remains listed. This licence does not transfer ownership.

**Restrictions:** You may not use the Profytron name, logo, or "Signal Core AI" mark in any way without our prior written consent.

**Feedback:** Any feedback, suggestions, or ideas you submit to us may be used by Profytron without restriction or obligation to you.`,
  },
  {
    title: '7. Disclaimers',
    content: `THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.

TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, PROFYTRON EXPRESSLY DISCLAIMS ALL WARRANTIES, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, ACCURACY, AND NON-INFRINGEMENT.

WE DO NOT WARRANT THAT:
- THE SERVICE WILL BE UNINTERRUPTED, TIMELY, SECURE, OR FREE FROM ERRORS
- RESULTS OBTAINED FROM THE SERVICE WILL BE ACCURATE OR RELIABLE
- ANY DEFECTS IN THE SERVICE WILL BE CORRECTED
- THE SERVICE OR THE INFRASTRUCTURE THROUGH WHICH IT IS DELIVERED IS FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS

Trading involves significant risk of financial loss. Nothing in the Service constitutes financial advice, investment advice, or a recommendation to buy or sell any financial instrument. See our Risk Disclosure Statement for full details.`,
  },
  {
    title: '8. Limitation of Liability',
    content: `TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, PROFYTRON TECHNOLOGIES PVT. LTD., ITS DIRECTORS, OFFICERS, EMPLOYEES, AFFILIATES, AGENTS, AND LICENSORS SHALL NOT BE LIABLE FOR:

- ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES
- LOSS OF PROFITS, REVENUE, BUSINESS, DATA, TRADING CAPITAL, OR GOODWILL
- LOSSES ARISING FROM EXECUTION ERRORS, SLIPPAGE, STRATEGY FAILURE, OR AI SIGNAL INACCURACY
- LOSSES ARISING FROM MARKET VOLATILITY, EXCHANGE OUTAGES, OR CONNECTIVITY FAILURES

WHETHER BASED ON CONTRACT, TORT, NEGLIGENCE, STRICT LIABILITY, OR OTHERWISE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

Our total cumulative liability to you for any claim under or related to these Terms shall not exceed the total subscription fees paid by you to Profytron in the three (3) months immediately preceding the event giving rise to the claim.

Some jurisdictions do not permit the exclusion or limitation of certain warranties or liabilities. In such cases, our liability will be limited to the fullest extent permitted by applicable law.`,
  },
  {
    title: '9. Indemnification',
    content: `You agree to indemnify, defend, and hold harmless Profytron Technologies Pvt. Ltd. and its directors, officers, employees, agents, and licensors from and against any claim, liability, loss, damage, cost, or expense (including reasonable legal fees) arising out of or related to:

- Your use of the Service
- Your trading activities conducted through or in connection with the Service
- Your breach of these Terms
- Your violation of any applicable law or the rights of any third party`,
  },
  {
    title: '10. Termination',
    content: `**By You:** You may terminate your account at any time by contacting support@profytron.com or using the account deletion option in your dashboard. Termination does not entitle you to a refund except as provided under Section 5.

**By Profytron:** We may suspend or terminate your access to the Service immediately, without notice, if:
- You breach these Terms
- We are required to do so by applicable law or order of a competent authority
- We determine in our reasonable judgment that your use poses a security, legal, or regulatory risk

Upon termination, your right to access the Service ceases immediately. Sections 6, 7, 8, 9, 11, and 12 survive termination.`,
  },
  {
    title: '11. Governing Law & Dispute Resolution',
    content: `These Terms are governed by, and construed in accordance with, the laws of India, without regard to conflict of law principles.

**Informal Resolution:** Before initiating formal proceedings, you agree to first contact legal@profytron.com and give us 30 days to resolve the dispute informally.

**Arbitration:** If informal resolution fails, any dispute, controversy, or claim arising out of or relating to these Terms, or the breach, termination, or validity thereof, shall be referred to and finally resolved by binding arbitration under the Arbitration and Conciliation Act, 1996 (as amended), by a sole arbitrator mutually agreed upon by the parties, seated in Bengaluru, Karnataka, India. The language of arbitration shall be English. The arbitral award shall be final and binding.

**Courts:** Nothing in this clause prevents either party from seeking injunctive or other urgent equitable relief from a court of competent jurisdiction to prevent irreparable harm, including for protection of intellectual property rights.`,
  },
  {
    title: '12. Modifications',
    content: `We may modify these Terms at any time. We will notify you of material changes — those that materially affect your rights or obligations — by email to your registered address at least 14 days before they take effect. Non-material clarifications or corrections take effect immediately.

Continued use of the Service after the effective date of a modification constitutes your acceptance of the revised Terms. If you do not accept the modified Terms, you must stop using the Service and may terminate your account.`,
  },
  {
    title: '13. Miscellaneous',
    content: `**Entire Agreement:** These Terms, together with the Privacy Policy, Risk Disclosure, and Cookie Policy, constitute the entire agreement between you and Profytron with respect to the Service and supersede all prior agreements.

**Severability:** If any provision of these Terms is held to be invalid, illegal, or unenforceable, the remaining provisions will continue in full force and effect.

**No Waiver:** Our failure to enforce any right or provision of these Terms will not constitute a waiver of that right or provision.

**Assignment:** You may not assign your rights or obligations under these Terms without our prior written consent. We may assign our rights freely.

**Language:** These Terms are drafted in the English language. In the event of any inconsistency between an English version and any translated version, the English version shall prevail.`,
  },
  {
    title: '14. Contact',
    content: `Legal Department\nProfytron Technologies Pvt. Ltd.\nBengaluru, Karnataka, India\nEmail: legal@profytron.com`,
  },
];

export default function TermsPage() {
  return (
    <PublicPageLayout>
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[500px] h-[250px] bg-indigo-600/8 blur-[100px] rounded-full pointer-events-none" />
        <div className="container mx-auto px-6 max-w-4xl relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-white/50 text-[10px] font-bold tracking-[0.4em] uppercase mb-8">
              <FileText className="w-3 h-3 text-indigo-400" /> Legal
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-[-0.03em] text-white leading-tight mb-6">Terms of Service</h1>
            <div className="flex items-center gap-6 text-white/30 text-xs font-mono">
              <span>Effective Date: April 12, 2026</span>
              <span>Last Updated: April 12, 2026</span>
            </div>
            <p className="mt-6 text-white/50 leading-relaxed">
              Please read these Terms of Service carefully. They govern your use of the Profytron platform and form a binding legal agreement between you and Profytron Technologies Pvt. Ltd.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-8 sticky top-28 z-40">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="flex flex-wrap gap-2 py-3 px-4 rounded-xl bg-black/60 backdrop-blur-xl border border-white/[0.06]">
            {sections.map((s, i) => (
              <a 
                key={i} 
                href={`#section-${i}`}
                className="text-[10px] text-white/30 hover:text-indigo-400 font-mono transition-colors px-2 py-1"
              >
                §{i + 1}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="flex flex-col gap-10">
            {sections.map((s, i) => (
              <div key={i} id={`section-${i}`} className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] scroll-mt-32">
                <h2 className="text-lg font-bold text-white mb-4 tracking-tight">{s.title}</h2>
                <div className="text-white/55 text-sm leading-[1.85] whitespace-pre-line">{s.content}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
}
