'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Brain, DollarSign, Layers, Users } from 'lucide-react';

const CARDS = [
  {
    icon: TrendingUp,
    label: 'EUR/USD Live',
    value: '1.0842',
    meta: '+0.34%',
    style: { top: '10%', left: '4%' },
    duration: 7,
    delay: 0,
  },
  {
    icon: Brain,
    label: 'AI Confidence',
    value: '94%',
    meta: 'High signal',
    style: { top: '18%', right: '2%' },
    duration: 8.5,
    delay: 0.6,
  },
  {
    icon: DollarSign,
    label: 'Capital Flow',
    value: '$15.4M',
    meta: '+12.8%',
    style: { bottom: '28%', left: '0%' },
    duration: 9,
    delay: 1.2,
  },
  {
    icon: Layers,
    label: 'Strategies',
    value: '12,845',
    meta: 'Active',
    style: { bottom: '18%', right: '6%' },
    duration: 6.5,
    delay: 0.3,
  },
  {
    icon: Users,
    label: 'Subscribers',
    value: '6.7K+',
    meta: 'Pro traders',
    style: { top: '42%', right: '-2%' },
    duration: 10,
    delay: 1.8,
  },
] as const;

export function SignInFloatingCards() {
  return (
    <div className="sign-in-floating-cards" aria-hidden>
      {CARDS.map(({ icon: Icon, label, value, meta, style, duration, delay }) => (
        <motion.div
          key={label}
          className="sign-in-float-card"
          style={style}
          initial={{ opacity: 0, y: 16 }}
          animate={{
            opacity: 1,
            y: [0, -10, 0],
          }}
          transition={{
            opacity: { duration: 0.5, delay, ease: [0, 0, 0.2, 1] },
            y: {
              duration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay,
            },
          }}
        >
          <div className="sign-in-float-card-head">
            <Icon className="h-3.5 w-3.5" aria-hidden />
            <span>{label}</span>
          </div>
          <p className="sign-in-float-card-value">{value}</p>
          <p className="sign-in-float-card-meta">{meta}</p>
        </motion.div>
      ))}
    </div>
  );
}
