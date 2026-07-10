'use client';

import React from 'react';
import { Moon, Sun } from 'lucide-react';

function getInitialTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem('theme') as 'dark' | 'light' | null;
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function AuthTerminalThemeToggle() {
  const [mounted, setMounted] = React.useState(false);
  const [theme, setTheme] = React.useState<'dark' | 'light'>('dark');

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
    <div className="at-theme" role="group" aria-label="Theme">
      <button
        type="button"
        className={`at-theme__btn ${mounted && theme === 'light' ? 'at-theme__btn--active' : ''}`}
        onClick={() => setMode('light')}
        aria-pressed={theme === 'light'}
        aria-label="Light mode"
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={`at-theme__btn ${mounted && theme === 'dark' ? 'at-theme__btn--active' : ''}`}
        onClick={() => setMode('dark')}
        aria-pressed={theme === 'dark'}
        aria-label="Dark mode"
      >
        <Moon className="h-4 w-4" />
      </button>
      <span
        className="at-theme__thumb"
        style={{ transform: mounted && theme === 'dark' ? 'translateX(100%)' : 'translateX(0)' }}
        aria-hidden
      />
    </div>
  );
}
