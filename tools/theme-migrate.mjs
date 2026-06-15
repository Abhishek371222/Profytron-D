/**
 * One-shot theme migration: colors + typography tokens across apps/web/src
 * Run: node tools/theme-migrate.mjs
 */
import fs from "fs";
import path from "path";

const ROOT = path.join(process.cwd(), "apps", "web", "src");

const REPLACEMENTS = [
  // ── Backgrounds ──
  [/bg-\[#07070f\]/g, "bg-background"],
  [/bg-\[#0b0b0f\]/g, "bg-card"],
  [/bg-\[#0b0b22\]/g, "bg-card"],
  [/bg-\[#030b1f\]/g, "bg-card"],
  [/bg-\[#020617\]/g, "bg-background"],
  [/bg-\[#030303\]/g, "bg-background"],
  [/bg-\[#0c0c14\]/g, "bg-background"],
  [/bg-\[#0b0b0f\]/g, "bg-card"],

  // ── Color families → theme tokens ──
  [/indigo-600/g, "primary"],
  [/indigo-500/g, "primary"],
  [/indigo-400/g, "primary"],
  [/indigo-300/g, "primary"],
  [/violet-600/g, "chart-2"],
  [/violet-500/g, "chart-2"],
  [/violet-400/g, "chart-2"],
  [/violet-300/g, "chart-2"],
  [/emerald-600/g, "chart-3"],
  [/emerald-500/g, "chart-3"],
  [/emerald-400/g, "chart-3"],
  [/emerald-300/g, "chart-3"],
  [/cyan-600/g, "chart-5"],
  [/cyan-500/g, "chart-5"],
  [/cyan-400/g, "chart-5"],
  [/cyan-300/g, "chart-5"],
  [/rose-600/g, "destructive"],
  [/rose-500/g, "destructive"],
  [/rose-400/g, "destructive"],
  [/amber-500/g, "chart-4"],
  [/amber-400/g, "chart-4"],
  [/amber-300/g, "chart-4"],
  [/teal-600/g, "chart-3"],
  [/teal-500/g, "chart-3"],

  // ── Slate → muted ──
  [/text-slate-50/g, "text-foreground"],
  [/text-slate-100/g, "text-foreground"],
  [/text-slate-200/g, "text-foreground/80"],
  [/text-slate-300/g, "text-muted-foreground"],
  [/text-slate-400/g, "text-muted-foreground"],
  [/text-slate-500/g, "text-muted-foreground"],

  // ── White text → foreground ──
  [/text-white\/(\d+)/g, "text-foreground/$1"],
  [/text-white(?=[\s"'`}\])])/g, "text-foreground"],

  // ── White borders/backgrounds → theme ──
  [/border-white\/(\d+)/g, "border-border"],
  [/bg-white\/\[0\.0(\d+)\]/g, "bg-muted/$1"],
  [/bg-white\/(\d+)/g, "bg-foreground/$1"],
  [/hover:bg-white\//g, "hover:bg-foreground/"],
  [/ring-p\b/g, "ring-primary"],
  [/text-p\b/g, "text-primary"],
  [/bg-p\b/g, "bg-primary"],
  [/from-p\b/g, "from-primary"],
  [/to-p\b/g, "to-primary"],
  [/via-p\b/g, "via-primary"],
  [/border-p\b/g, "border-primary"],

  // ── Font sizes → type scale ──
  [/text-\[9px\]/g, "text-micro"],
  [/text-\[10px\]/g, "text-micro"],
  [/text-\[11px\]/g, "text-caption"],
  [/text-\[12px\]/g, "text-caption"],
  [/text-\[13px\]/g, "text-body-sm"],
  [/text-\[14px\]/g, "text-body"],
  [/text-\[15px\]/g, "text-body"],
  [/text-\[0\.8rem\]/g, "text-body-sm"],
  [/text-\[0\.9rem\]/g, "text-body"],
  [/text-\[0\.95rem\]/g, "text-body"],
  [/text-\[1\.1rem\]/g, "text-body-lg"],
  [/text-\[1\.8rem\]/g, "text-heading-3"],
  [/text-\[2rem\]/g, "text-heading-2"],
  [/text-\[clamp\(2\.8rem,6vw,5\.6rem\)\]/g, "text-display-1"],

  // ── Font family ──
  [/text-danger/g, "text-destructive"],
  [/border-danger/g, "border-destructive"],
  [/bg-danger/g, "bg-destructive"],
  [/ring-danger/g, "ring-destructive"],
  [/font-body/g, "font-sans"],
  [/text-black/g, "text-primary-foreground"],
  [/blue-600/g, "primary"],
  [/blue-500/g, "primary"],
  [/blue-400/g, "chart-5"],
  [/blue-300/g, "chart-5"],
  [/blue-100/g, "chart-5"],
  [/bg-\[#0b1430\]\/70/g, "bg-input/70"],
  [/bg-\[#0a1130\]/g, "bg-card"],
  [/bg-\[#101a3f\]/g, "bg-secondary"],
  [/bg-\[#071334\]\/80/g, "bg-card/80"],
  [/bg-\[#092238\]\/80/g, "bg-card/80"],
  [/font-display/g, "font-serif"],
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!["node_modules", ".next"].includes(entry.name)) walk(full, files);
    } else if (/\.(tsx|ts|css)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

const files = walk(ROOT);
let changed = 0;

for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  const original = content;
  for (const [pattern, replacement] of REPLACEMENTS) {
    content = content.replace(pattern, replacement);
  }
  if (content !== original) {
    fs.writeFileSync(file, content);
    changed++;
  }
}

console.log(`Theme migration complete: ${changed} files updated.`);
