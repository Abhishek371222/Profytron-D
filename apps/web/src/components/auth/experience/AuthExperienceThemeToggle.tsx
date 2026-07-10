'use client';

import React from 'react';
import { Moon, Sun } from 'lucide-react';

function getInitialTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem('theme') as 'dark' | 'light' | null;
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function AuthExperienceThemeToggle() {
  const [mounted, setMounted] = React.useState(false);
  const [theme, setTheme] = React.useState<'dark' | 'light'>('light');

  React.useEffect(() => {
    setMounted(true);
    setTheme(getInitialTheme());
  }, []);

  const setMode = (next: 'dark' | 'light') => {
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  return (
    <div className="ax-theme-toggle" role="group" aria-label="Theme">
      <button
        type="button"
        className={`ax-theme-btn ${mounted && theme === 'light' ? 'ax-theme-btn--active' : ''}`}
        onClick={() => setMode('light')}
        aria-pressed={theme === 'light'}
        aria-label="Light mode"
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={`ax-theme-btn ${mounted && theme === 'dark' ? 'ax-theme-btn--active' : ''}`}
        onClick={() => setMode('dark')}
        aria-pressed={theme === 'dark'}
        aria-label="Dark mode"
      >
        <Moon className="h-4 w-4" />
      </button>
      <span
        className="ax-theme-thumb"
        style={{ transform: mounted && theme === 'dark' ? 'translateX(100%)' : 'translateX(0)' }}
        aria-hidden
      />
    </div>
  );
}
