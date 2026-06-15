"use client";

/** Enterprise backdrop — clean gradient */
export function AmbientBackground({
  variant = "landing",
  position = "fixed",
}: {
  variant?: "landing" | "dashboard" | "auth";
  position?: "fixed" | "absolute";
}) {
  return (
    <div
      aria-hidden
      className="inset-0 overflow-hidden pointer-events-none"
      style={{ position, zIndex: 0 }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            variant === "dashboard"
              ? "linear-gradient(180deg, var(--background) 0%, var(--bg-secondary) 100%)"
              : "var(--background)",
        }}
      />
      <div
        className="absolute inset-0 opacity-30 dark:opacity-20"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% 0%, color-mix(in srgb, var(--primary) 8%, transparent), transparent 65%)",
        }}
      />
    </div>
  );
}
