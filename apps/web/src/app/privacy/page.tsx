import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import { Shield } from 'lucide-react';

const sections = [
  {
    title: '1. About This Policy',
    content: `Profytron Technologies Pvt. Ltd. ("Profytron", "we", "our", or "us") is a private limited company incorporated under the Companies Act, 2013, with its registered office in Bengaluru, Karnataka, India.

This Privacy Policy governs the collection, use, storage, and disclosure of personal data when you access or use the Profytron platform, including our website, web application, and API services (collectively, the "Service").

This Policy is published in accordance with the Information Technology Act, 2000 (as amended), the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 ("SPDI Rules"), and the Digital Personal Data Protection Act, 2023 ("DPDP Act"), to the extent applicable.

By using the Service, you consent to the practices described in this Policy.`,
  },
  {
    title: '2. Information We Collect',
    content: `We collect the following categories of information:

**Identity & Account Information**
Name, email address, and password (stored as a salted cryptographic hash). We do not store passwords in plaintext.

**Trading & Strategy Data**
Algorithmic trading strategies you create, backtest configurations, order history, and performance records. This data is processed to deliver the core functionality of the Service and is necessary for the contractual relationship between you and Profytron.

**Broker Credentials**
API keys you provide to connect third-party brokers are encrypted at rest using AES-256. They are never stored in plaintext and are not accessible to Profytron employees in decrypted form.

**Technical & Usage Data**
IP address, device type, browser type and version, operating system, session timestamps, referring URLs, and feature usage patterns. This data is collected automatically when you use the Service.

**Payment Data**
Billing information is processed directly by Stripe, Inc. Profytron does not receive or store full payment card numbers, CVV codes, or bank account details. We retain only the last four digits of a card, expiry date, and billing address for display and invoicing purposes.

**Communications**
If you contact support or interact with our team, we retain those communications to resolve your enquiry and improve service quality.`,
  },
  {
    title: '3. How We Use Your Information',
    content: `We process your personal data on the following legal bases:

**Contract Performance:** To provide, maintain, and operate the Profytron Service, including routing orders through connected brokers, running backtests, and managing your account and subscription.

**Legitimate Interests:** To monitor for unauthorized access, detect and prevent fraud, improve platform performance, and generate anonymized aggregate analytics to improve our AI models. In each case, our legitimate interests are not overridden by your rights.

**Legal Obligation:** To comply with applicable Indian laws, including requirements under the Prevention of Money Laundering Act, 2002 (PMLA), and any directions from competent authorities.

**Consent:** To send you marketing communications about new features or offers, where you have opted in. You may withdraw consent at any time.

We do not sell, rent, or trade your personal data to any third party for their own marketing or commercial purposes.`,
  },
  {
    title: '4. Data Sharing & Third Parties',
    content: `We share your data only in the following circumstances:

**Broker & Exchange Connectivity:** When you connect a broker, we transmit the minimum necessary order data to that broker to execute your strategy. This transfer is required to perform the Service.

**Cloud Infrastructure:** The Service is hosted on cloud infrastructure. Our hosting providers have access to server infrastructure but operate under confidentiality obligations and do not have access to decrypted application data.

**Payment Processing:** Stripe, Inc. processes all payment card transactions. Stripe's privacy practices are governed by their own Privacy Policy at stripe.com/privacy.

**Transactional Email:** Resend is used to send account verification, password reset, and service notification emails. Only your email address and the content of the message are shared.

**Error Monitoring:** We use Sentry for application error tracking. Error reports may include anonymized stack traces and session context. No financial or personally identifiable data is included in error reports.

**Legal Compliance:** We may disclose personal data to law enforcement, courts, or regulatory authorities where required by applicable Indian law, a valid court order, or a direction from a competent authority. We will notify you of such disclosure where legally permitted.`,
  },
  {
    title: '5. Data Retention',
    content: `We retain personal data for as long as your account is active and for a reasonable period thereafter to allow you to reactivate your account.

Upon written request to delete your account, personal data that is no longer required will be purged within 30 days, subject to the following exceptions:

- **Transaction and billing records** are retained for a period of 3 years from the date of the transaction, in compliance with Indian tax and accounting obligations.
- **Order and trading activity logs** are retained for 2 years from the date of the activity.
- Data that is subject to a legal hold, regulatory enquiry, or dispute resolution process will be retained until that matter is concluded.

Data held beyond the above periods is anonymized such that it can no longer be attributed to any individual.`,
  },
  {
    title: '6. Security',
    content: `We implement reasonable technical and organizational measures to protect your personal data against unauthorized access, loss, or disclosure. These measures include:

- AES-256 encryption for sensitive data at rest, including broker credentials
- TLS encryption for all data in transit between your browser and our servers
- Hashed storage of all user passwords using bcrypt
- Role-based access controls limiting employee access to personal data
- Automated session expiry and token rotation

No method of transmission over the Internet is completely secure. While we strive to protect your data, we cannot guarantee absolute security against all threats. You are responsible for keeping your account credentials confidential.`,
  },
  {
    title: '7. Your Rights',
    content: `Under the Digital Personal Data Protection Act, 2023 (DPDP Act) and applicable Indian law, you have the right to:

- **Access** a summary of the personal data we hold about you and the purposes for which it is processed
- **Correction** of personal data that is inaccurate or incomplete
- **Erasure** of personal data that is no longer necessary, subject to overriding legal retention obligations
- **Grievance Redressal** by contacting our Data Protection Officer (details in §9)
- **Nomination** of a person to exercise your rights in the event of your death or incapacity

To exercise any of these rights, submit a written request to privacy@profytron.com. We will respond within 30 days. Where we are unable to comply, we will provide reasons.

We do not discriminate against users who exercise their data protection rights.`,
  },
  {
    title: '8. Cookies',
    content: `We use cookies and similar browser-based technologies to maintain your session, authenticate requests, and collect anonymized usage data. Our Cookie Policy provides a full description of each cookie we set, its purpose, and instructions for opting out.

You may manage cookie preferences through your browser settings. Disabling strictly necessary cookies will prevent you from logging in.`,
  },
  {
    title: '9. Cross-Border Data Transfers',
    content: `Profytron is incorporated in India and your data is primarily stored on servers located in India. When we use third-party service providers (such as Stripe, Sentry, or Resend) that are incorporated outside India, your data may be transferred to and processed in countries other than India.

We take steps to ensure that any such transfer is subject to appropriate contractual safeguards, including Data Processing Agreements, consistent with applicable Indian data protection law.`,
  },
  {
    title: '10. Changes to This Policy',
    content: `We may update this Privacy Policy as our services evolve or as required by law. Material changes — those that significantly affect how we process your data or reduce your rights — will be communicated by email to the address on your account at least 14 days before they take effect.

The "Last Updated" date at the top of this Policy reflects the date of the most recent revision. Continued use of the Service after the effective date of a revised Policy constitutes your acceptance of the changes.`,
  },
  {
    title: '11. Grievance Officer & Contact',
    content: `In accordance with the Information Technology Act, 2000 and the SPDI Rules, 2011, the details of the Grievance Officer are:

Grievance Officer / Data Protection Officer
Profytron Technologies Pvt. Ltd.
Bengaluru, Karnataka, India
Email: privacy@profytron.com

We endeavour to acknowledge grievances within 48 hours and resolve them within 30 days of receipt.`,
  },
];

export default function PrivacyPage() {
  return (
    <PublicPageLayout>
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-1/3 w-[500px] h-62.5 bg-indigo-600/8 blur-[100px] rounded-full pointer-events-none" />
        <div className="container mx-auto px-6 max-w-4xl relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/3 border border-white/10 text-white/50 text-[10px] font-bold tracking-[0.4em] uppercase mb-8">
              <Shield className="w-3 h-3 text-indigo-400" /> Legal
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-[-0.03em] text-white leading-tight mb-6">Privacy Policy</h1>
            <div className="flex items-center gap-6 text-white/30 text-xs font-mono">
              <span>Effective Date: April 12, 2026</span>
              <span>Last Updated: April 12, 2026</span>
            </div>
            <p className="mt-6 text-white/50 leading-relaxed">
              This Privacy Policy describes how Profytron Technologies Pvt. Ltd. collects, uses, and protects your personal data. Please read it carefully before using the platform.
            </p>
          </div>
        </div>
      </section>

      {/* Navigation - Hidden on server-rendered version as it requires JS for scrollIntoView, 
          or can be implemented as simple <a> tags with IDs */}
      <section className="pb-8 sticky top-28 z-40">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="flex flex-wrap gap-2 py-3 px-4 rounded-xl bg-black/60 backdrop-blur-xl border border-white/6">
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
          <div className="flex flex-col gap-8">
            {sections.map((s, i) => (
              <div key={i} id={`section-${i}`} className="p-8 rounded-2xl bg-white/2 border border-white/6 scroll-mt-32">
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
