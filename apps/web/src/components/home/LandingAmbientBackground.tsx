export function LandingAmbientBackground() {
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none bg-background"
      aria-hidden
      style={{
        background:
          "linear-gradient(180deg, var(--background) 0%, var(--bg-secondary) 100%)",
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.4] dark:opacity-[0.25]"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, color-mix(in srgb, var(--primary) 12%, transparent), transparent 60%)",
        }}
      />
    </div>
  );
}
