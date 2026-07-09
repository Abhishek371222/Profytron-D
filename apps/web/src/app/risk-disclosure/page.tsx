'use client';

import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import { LegalDocumentLayout, MarketingSection } from '@/components/marketing/MarketingPage';
import { AlertTriangle, Shield } from 'lucide-react';

const sections = [
  {
    title: 'IMPORTANT — READ CAREFULLY BEFORE USING THE SERVICE',
    highlight: true,
    content: `Trading in financial markets — including equities, derivatives, currency pairs, and commodities — using algorithmic systems involves a substantial risk of financial loss. This risk is not reduced by the use of automated tools or AI-generated signals.

Past performance of any trading strategy, whether in backtesting or live trading, is not indicative of future results. You may lose all of the capital you deploy.

The Profytron platform is a technology service. It does not provide investment advice. You are solely responsible for all trading decisions made through or in connection with the Service.

If you do not fully understand these risks, you should not use the live trading features of the platform.`,
  },
  {
    title: '1. General Market Risk',
    content: `All trading in financial instruments involves risk. The price of any financial instrument — including stocks, indices, futures, options, currencies, and commodities — can move sharply against your position, resulting in partial or total loss of capital.

Factors that can cause rapid and adverse price movements include, but are not limited to:

- Macroeconomic announcements (interest rate decisions, inflation data, GDP releases)
- Geopolitical events, armed conflicts, or political instability
- Corporate earnings surprises or regulatory actions on specific securities
- Global liquidity crises, credit events, or contagion across asset classes
- Central bank interventions or changes in monetary policy

Leverage and margin trading amplify both gains and losses. A small adverse movement in price can result in a loss that exceeds your initial margin deposit, and you may be required to deposit additional funds at short notice.`,
  },
  {
    title: '2. Algorithmic & Automated Trading Risk',
    content: `Algorithmic trading introduces additional risks that are distinct from those of manual trading:

**Model Risk**
A trading strategy is built on statistical assumptions derived from historical market data. These assumptions may not hold in future market conditions. A strategy that produced strong results in a backtest may perform poorly or generate sustained losses in live trading due to regime changes, structural breaks in market relationships, or data that was not present during strategy development.

**Backtesting Limitations**
Backtest results are simulated and are not a reliable indicator of future performance. Common sources of distortion include:
- Survivorship bias: backtesting against only those securities that exist today, ignoring those that were delisted or became worthless
- Look-ahead bias: inadvertently using information in a simulation that would not have been available at the time of the hypothetical trade
- Overfitting: optimising parameters so specifically to historical data that the strategy captures noise rather than a persistent market edge
- Transaction cost underestimation: failing to account for realistic slippage, brokerage commissions, and market impact

**Execution Risk**
In live markets, especially during periods of high volatility or low liquidity, orders may be filled at prices materially different from the strategy's expected price. This slippage is not reflected in backtest results and can significantly reduce profitability or increase losses.

**Technology Risk**
Automated strategies depend on the continuous, correct operation of multiple systems — including the Profytron platform, your internet connection, third-party broker infrastructure, and exchange systems. Any component failure can result in delayed order execution, missed entries or exits, duplicate orders, or the inability to close a position that is moving against you.

Profytron does not guarantee continuous uptime and is not liable for losses resulting from platform downtime, connectivity failures, or third-party broker outages.`,
  },
  {
    title: '3. AI & Signal Risk',
    content: `Signal Core AI generates trading signals using machine learning models trained on historical and real-time data. These are probabilistic outputs — they represent statistical estimates, not certainties.

Specifically:
- AI signals are not guarantees of future price movements
- The models may generate incorrect, delayed, or misleading signals based on noisy, incomplete, or misclassified input data
- The performance of AI models can degrade if market conditions change in ways that are not represented in training data
- Signal outputs may be correlated with those of other users on the platform, potentially amplifying market impact if many strategies act on the same signal simultaneously

You are solely responsible for the decision to act upon, modify, or deploy any signal generated by the platform. Use of Signal Core AI does not reduce your trading risk.`,
  },
  {
    title: '4. Regulatory & Compliance Risk',
    content: `Profytron Technologies Pvt. Ltd. is a technology company registered in India. It is not a registered stock broker, investment advisor, portfolio manager, or research analyst under the Securities and Exchange Board of India (SEBI) Act, 1992, or any rules thereunder.

The platform is a technology tool. You are responsible for:
- Ensuring that your trading activity complies with all applicable laws and regulations in your jurisdiction, including SEBI regulations, exchange rules, and applicable tax laws
- Obtaining any licences, registrations, or consents required to engage in algorithmic trading in your jurisdiction
- Complying with position limits, margin requirements, and order-to-trade ratio rules imposed by your broker or exchange
- Reporting your trading income and gains for tax purposes in accordance with applicable law

Regulatory requirements for algorithmic trading vary by jurisdiction and may change. Profytron does not monitor your compliance and is not responsible for any regulatory breach arising from your use of the platform.`,
  },
  {
    title: '5. No Investment Advice',
    content: `Nothing on the Profytron platform — including strategy templates, AI signal outputs, market data, blog articles, documentation, community discussions, or any communication from Profytron employees — constitutes or should be construed as:
- Investment advice or a personal recommendation to buy or sell any financial instrument
- Financial planning or portfolio management advice
- A solicitation or offer to provide investment advisory services

All information provided through the platform is for general informational and educational purposes only. You should make all investment decisions based on your own independent analysis, financial objectives, risk tolerance, and, where appropriate, the advice of a qualified financial adviser regulated in your jurisdiction.`,
  },
  {
    title: '6. Responsibility & Acknowledgement',
    content: `By using the trading features of the Profytron platform, you expressly acknowledge and agree that:

- You have read and understood this Risk Disclosure Statement in full
- You are aware that algorithmic trading involves a substantial risk of financial loss
- You are trading with funds you can afford to lose
- You will not hold Profytron responsible for any financial loss arising from your use of the platform, including losses attributable to strategy failure, AI signal inaccuracy, execution slippage, or technology malfunction
- You will indemnify Profytron against any third-party claims arising from your trading activity

This acknowledgement does not limit any rights you may have under applicable consumer protection law.`,
  },
  {
    title: '7. Seek Professional Advice',
    content: `If you are uncertain about any aspect of algorithmic trading, the risks described in this document, or whether the Profytron platform is suitable for your circumstances, you should seek independent advice from a financial adviser who is appropriately regulated in your jurisdiction before using the live trading features of the platform.

This Risk Disclosure Statement does not constitute financial, legal, or tax advice. It is provided for information purposes only.`,
  },
];

export default function RiskDisclosurePage() {
  return (
    <PublicPageLayout>
      <LegalDocumentLayout
        eyebrow="Legal"
        eyebrowIcon={AlertTriangle}
        title="Risk Disclosure"
        intro="Material risks associated with algorithmic trading and live execution on Profytron."
        effectiveDate="April 12, 2026"
        lastUpdated="April 12, 2026"
        sections={sections}
      />
      <MarketingSection narrow className="pt-0 pb-20">
        <div className="landing-panel flex items-start gap-4 p-6">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            This Risk Disclosure Statement is published by Profytron Technologies Pvt. Ltd. for
            information purposes only. It is not financial, legal, or tax advice. Profytron is not a
            SEBI-registered investment adviser, broker, portfolio manager, or research analyst.
          </p>
        </div>
      </MarketingSection>
    </PublicPageLayout>
  );
}
