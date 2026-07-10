'use client';

import * as React from 'react';
import Image from 'next/image';
import { Facebook, Instagram, Linkedin } from 'lucide-react';

interface AppInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  placeholder?: string;
  icon?: React.ReactNode;
}

function AppInput({ label, placeholder, icon, className, ...rest }: AppInputProps) {
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = React.useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLInputElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div className="relative w-full min-w-[200px]">
      {label ? <label className="mb-2 block text-sm text-[var(--color-heading)]">{label}</label> : null}
      <div className="relative w-full">
        <input
          type="text"
          className={`peer relative z-10 h-[3.25rem] w-full rounded-md border-2 border-[var(--color-border)] bg-[var(--color-surface)] px-4 font-thin outline-none drop-shadow-sm transition-all duration-200 ease-in-out placeholder:font-medium focus:bg-[var(--color-bg)] ${className ?? ''}`}
          placeholder={placeholder}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          {...rest}
        />
        {isHovering ? (
          <>
            <div
              className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[2px] overflow-hidden rounded-t-md"
              style={{
                background: `radial-gradient(30px circle at ${mousePosition.x}px 0px, var(--color-text-primary) 0%, transparent 70%)`,
              }}
            />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[2px] overflow-hidden rounded-b-md"
              style={{
                background: `radial-gradient(30px circle at ${mousePosition.x}px 2px, var(--color-text-primary) 0%, transparent 70%)`,
              }}
            />
          </>
        ) : null}
        {icon ? (
          <div className="absolute right-3 top-1/2 z-20 -translate-y-1/2">{icon}</div>
        ) : null}
      </div>
    </div>
  );
}

const SOCIAL_LINKS = [
  { icon: Instagram, href: '#', fillClass: 'bg-[var(--color-bg)]' },
  { icon: Linkedin, href: '#', fillClass: 'bg-[var(--color-bg)]' },
  { icon: Facebook, href: '#', fillClass: 'bg-[var(--color-bg)]' },
] as const;

/** Unsplash — finance / trading workspace (known stable asset) */
const HERO_IMAGE =
  'https://images.unsplash.com/photo-1611974789855-5c2a1a18540b?auto=format&fit=crop&w=1260&q=80';

export default function LoginOne() {
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = React.useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const leftSection = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - leftSection.left,
      y: e.clientY - leftSection.top,
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[var(--color-bg)] p-4">
      <div className="card flex h-[600px] w-[80%] justify-between md:w-[55%] lg:w-[70%]">
        <div
          className="left relative h-full w-full overflow-hidden px-4 lg:w-1/2 lg:px-16"
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div
            className={`pointer-events-none absolute h-[500px] w-[500px] rounded-full bg-gradient-to-r from-purple-300/30 via-blue-300/30 to-pink-300/30 blur-3xl transition-opacity duration-200 ${
              isHovering ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              transform: `translate(${mousePosition.x - 250}px, ${mousePosition.y - 250}px)`,
              transition: 'transform 0.1s ease-out',
            }}
          />
          <div className="form-container sign-in-container z-10 h-full">
            <form
              className="grid h-full gap-2 py-10 text-center md:py-20"
              onSubmit={handleSubmit}
            >
              <div className="mb-2 grid gap-4 md:gap-6">
                <h1 className="text-3xl font-extrabold text-[var(--color-heading)] md:text-4xl">
                  Sign in
                </h1>
                <div className="social-container">
                  <div className="flex items-center justify-center">
                    <ul className="flex gap-3 md:gap-4">
                      {SOCIAL_LINKS.map(({ icon: Icon, href, fillClass }, index) => (
                        <li key={index} className="list-none">
                          <a
                            href={href}
                            className="group relative z-[1] flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-[3px] border-[var(--color-text-primary)] bg-[var(--color-bg-2)] md:h-12 md:w-12"
                            aria-label={`Social sign in ${index + 1}`}
                          >
                            <div
                              className={`absolute inset-0 h-full w-full origin-bottom scale-y-0 transition-transform duration-500 ease-in-out group-hover:scale-y-100 ${fillClass}`}
                            />
                            <Icon
                              className="z-[2] h-5 w-5 text-[hsl(203,92%,8%)] transition-all duration-500 ease-in-out group-hover:text-[var(--color-text-primary)]"
                              aria-hidden
                            />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <span className="text-sm text-[var(--color-text-secondary)]">or use your account</span>
              </div>
              <div className="grid items-center gap-4">
                <AppInput placeholder="Email" type="email" autoComplete="email" />
                <AppInput placeholder="Password" type="password" autoComplete="current-password" />
              </div>
              <a
                href="#"
                className="text-sm font-light text-[var(--color-text-primary)] md:text-base"
              >
                Forgot your password?
              </a>
              <div className="flex items-center justify-center gap-4">
                <button
                  type="submit"
                  className="group/button relative inline-flex cursor-pointer items-center justify-center overflow-hidden rounded-md bg-[var(--color-border)] px-4 py-1.5 text-xs font-normal text-white transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg hover:shadow-[var(--color-text-primary)]"
                >
                  <span className="px-2 py-1 text-sm">Sign In</span>
                  <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-1000 group-hover/button:[transform:skew(-13deg)_translateX(100%)]">
                    <div className="relative h-full w-8 bg-white/20" />
                  </div>
                </button>
              </div>
            </form>
          </div>
        </div>
        <div className="right hidden h-full w-1/2 overflow-hidden lg:block">
          <Image
            src={HERO_IMAGE}
            width={1260}
            height={750}
            priority
            alt="Financial trading workspace"
            className="h-full w-full object-cover opacity-30 transition-transform duration-300"
          />
        </div>
      </div>
    </div>
  );
}
