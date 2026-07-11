/** User-facing labels: never show "copy trading" or "strategy" in the product UI. */

export function formatBotName(name: string): string {
  if (!name) return name;
  return name
    .replace(/\bcopy trading\b/gi, 'Automated Bot')
    .replace(/\bcopy-trading\b/gi, 'automated-bot')
    .replace(/\bmaster copy\b/gi, 'Master Bot')
    .replace(/\bstrategies\b/gi, 'Bots')
    .replace(/\bstrategy\b/gi, 'Bot')
    .replace(/\bcopy\b/gi, 'Bot')
    .replace(/\s+/g, ' ')
    .trim();
}

export function formatBotDescription(text: string): string {
  if (!text) return text;
  return text
    .replace(/\bcopy trading\b/gi, 'automated bot trading')
    .replace(/\bcopy trades?\b/gi, 'bot executions')
    .replace(/\bcopying\b/gi, 'bot automation')
    .replace(/\bcopied\b/gi, 'automated')
    .replace(/\bmirror(?:ed|ing)?\b/gi, 'automated')
    .replace(/\bmaster (?:MT5 |MT4 )?account\b/gi, 'operator bot account')
    .replace(/\bstrategies\b/gi, 'bots')
    .replace(/\bstrategy\b/gi, 'bot')
    .replace(/\bcopy\b/gi, 'bot');
}

/** Sanitize API error messages for user-facing display. */
export function formatApiErrorMessage(message: string): string {
  return formatBotDescription(message);
}

/** Resolve marketplace strategy for a plan tier (matches Bot or legacy Copy names). */
export function findBotStrategy(
  items: Array<{ name?: string; strategy?: { name?: string; id?: string } }>,
  tier: string,
): { name?: string; id?: string } | null {
  const candidates = [
    `${tier} Bot`,
    `${tier} Copy`,
    'Profytron Master Bot',
    'Profytron Master Copy',
  ];
  for (const candidate of candidates) {
    for (const item of items) {
      const n = item.strategy?.name ?? item.name;
      if (n === candidate) {
        return item.strategy ?? item;
      }
    }
  }
  return null;
}
