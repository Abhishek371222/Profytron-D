'use client';

import { Shield, Activity, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

const FEATURES = [
  { icon: Shield, title: 'Bank-grade Security', desc: '256-bit encrypted' },
  { icon: Activity, title: '99.99% Uptime', desc: 'Enterprise reliability' },
  { icon: Globe, title: 'Global Infrastructure', desc: 'Low latency everywhere' },
] as const;

const fade = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, delay: i * 0.08, ease: [0, 0, 0.2, 1] },
  }),
};

export function AuthExperienceFeatureStrip() {
  return (
    <div className="ax-feature-strip">
      {FEATURES.map(({ icon: Icon, title, desc }, i) => (
        <motion.div
          key={title}
          className="ax-feature-strip-item"
          custom={i}
          initial="hidden"
          animate="visible"
          variants={fade}
          whileHover={{ y: -1 }}
          transition={{ duration: 0.26 }}
        >
          <div className="ax-feature-strip-icon">
            <Icon className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <p className="ax-feature-strip-title">{title}</p>
            <p className="ax-feature-strip-desc">{desc}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
