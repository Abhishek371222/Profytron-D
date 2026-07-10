'use client';

import { useMemo } from 'react';

const PARTICLE_COUNT = 26;

function seededRandom(seed: number) {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

export function SignInParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: i,
        left: `${8 + seededRandom(i) * 84}%`,
        top: `${10 + seededRandom(i + 50) * 80}%`,
        size: 2 + seededRandom(i + 100) * 2,
        duration: 10 + seededRandom(i + 150) * 10,
        delay: seededRandom(i + 200) * 8,
      })),
    [],
  );

  return (
    <div className="sign-in-particles" aria-hidden>
      {particles.map((p) => (
        <span
          key={p.id}
          className="sign-in-particle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
