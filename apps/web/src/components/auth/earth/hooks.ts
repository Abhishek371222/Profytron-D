'use client';

import { useEffect, useState } from 'react';

export function useThemeDark() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const read = () => setIsDark(document.documentElement.classList.contains('dark'));
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  return isDark;
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const read = () => setReduced(mq.matches);
    read();
    mq.addEventListener('change', read);
    return () => mq.removeEventListener('change', read);
  }, []);

  return reduced;
}

export function usePageVisibility() {
  const [visible, setVisible] = useState(() =>
    typeof document !== 'undefined' ? !document.hidden : true,
  );

  useEffect(() => {
    const onChange = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  return visible;
}
