export function AuthExperienceLogo() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden className="h-full w-full">
      <defs>
        <linearGradient id="ax-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#348398" />
          <stop offset="50%" stopColor="#9fe1f3" />
          <stop offset="100%" stopColor="#2d7284" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#ax-logo-grad)" opacity="0.15" />
      <path
        d="M12 10h10c6.5 0 10.5 3.5 10.5 9.2 0 4.2-2.4 7.2-6.2 8.4L28 30h-5.5l-5.8-9.5H17V30H12V10zm5 5v5.5h4.2c2.4 0 3.8-1.2 3.8-2.8S23.6 15 21.2 15H17z"
        fill="url(#ax-logo-grad)"
      />
    </svg>
  );
}
