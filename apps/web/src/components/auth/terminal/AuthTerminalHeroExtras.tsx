'use client';

import { motion } from 'framer-motion';
import { Activity, Globe, Shield, TrendingUp, Zap } from 'lucide-react';
import { FEATURE_CARDS, TELEMETRY } from '@/components/auth/terminal/constants';

const ICONS = {
  shield: Shield,
  activity: Activity,
  globe: Globe,
  signal: TrendingUp,
  zap: Activity,
} as const;

export function AuthTerminalTelemetry() {
  return (
    <>
      <motion.div
        className="at-ticker"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="at-ticker__head">
          <span className="at-ticker__symbol">XAUUSD</span>
          <span className="at-ticker__change">+12.45%</span>
        </div>
        <div className="at-ticker__price">2,385.45</div>
        <svg className="at-ticker__spark" viewBox="0 0 80 24" aria-hidden>
          <motion.path
            d="M0,18 L12,14 L24,16 L36,8 L48,10 L60,4 L72,6 L80,2"
            fill="none"
            stroke="#348398"
            strokeWidth="1.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: 0.5 }}
          />
        </svg>
      </motion.div>

      <div className="at-telemetry">
        {TELEMETRY.map((item, i) => {
          const Icon = ICONS[item.icon];
          return (
            <motion.div
              key={item.label}
              className="at-telemetry__card"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
            >
              <Icon className="at-telemetry__icon" aria-hidden />
              <div>
                <p className="at-telemetry__label">{item.label}</p>
                <p className="at-telemetry__value">{item.value}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}

export function AuthTerminalFeatures() {
  return (
    <div className="at-features">
      {FEATURE_CARDS.map((card, i) => {
        const Icon = ICONS[card.icon];
        return (
          <motion.div
            key={card.title}
            className="at-features__card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.35 + i * 0.07 }}
          >
            <div className="at-features__icon-wrap">
              <Icon className="at-features__icon" aria-hidden />
            </div>
            <div>
              <p className="at-features__title">{card.title}</p>
              <p className="at-features__desc">{card.desc}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export function AuthTerminalTrust() {
  return (
    <div className="at-trust">
      <p className="at-trust__label">Trusted by professional traders worldwide</p>
      <div className="at-trust__logos">
        {['Citi', 'Barclays', 'Goldman Sachs', 'JP Morgan', 'Morgan Stanley'].map((name) => (
          <span key={name} className="at-trust__logo">
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
