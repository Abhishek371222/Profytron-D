export type FaqCandidate = {
  id: string;
  answerId: string;
  question: string;
  normalized: string;
  keywords: string[];
  answerBody: string;
  category: string;
};

export type FaqMatchResult = {
  score: number;
  answerId: string;
  answerBody: string;
  category: string;
  questionId: string;
  matchedQuestion: string;
};

const STOP = new Set([
  'a',
  'an',
  'the',
  'is',
  'are',
  'do',
  'does',
  'how',
  'what',
  'can',
  'you',
  'me',
  'i',
  'to',
  'of',
  'in',
  'on',
  'for',
  'with',
  'my',
  'please',
  'tell',
  'about',
  'help',
  'need',
  'explain',
  'and',
  'or',
]);

export function normalizeQuestion(q: string): string {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(q: string): string[] {
  return normalizeQuestion(q)
    .split(' ')
    .filter((w) => w.length > 2 && !STOP.has(w));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter += 1;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

/**
 * Score FAQ candidates against a user message.
 * Threshold ~0.55 for a confident canned answer.
 */
export function matchFaq(
  message: string,
  candidates: FaqCandidate[],
  threshold = 0.55,
): FaqMatchResult | null {
  const ranked = rankFaq(message, candidates);
  const best = ranked[0];
  if (!best || best.score < threshold) return null;
  return best;
}

/** Rank FAQ candidates for RAG context (even when below canned threshold). */
export function rankFaq(
  message: string,
  candidates: FaqCandidate[],
  limit = 5,
): FaqMatchResult[] {
  const normalized = normalizeQuestion(message);
  if (!normalized || candidates.length === 0) return [];

  const msgTokens = new Set(tokenize(message));
  const scored: FaqMatchResult[] = [];

  for (const c of candidates) {
    let score = 0;

    if (c.normalized === normalized) {
      score = 1;
    } else if (
      c.normalized.includes(normalized) ||
      normalized.includes(c.normalized)
    ) {
      score = 0.85;
    } else {
      const qTokens = new Set([...tokenize(c.question), ...(c.keywords || [])]);
      const jac = jaccard(msgTokens, qTokens);
      const keywordHits = (c.keywords || []).filter((k) =>
        msgTokens.has(k.toLowerCase()),
      ).length;
      const keywordScore =
        (c.keywords?.length || 0) > 0
          ? keywordHits / Math.min(c.keywords.length, 6)
          : 0;
      score = Math.max(jac, keywordScore * 0.9);
    }

    scored.push({
      score,
      answerId: c.answerId,
      answerBody: c.answerBody,
      category: c.category,
      questionId: c.id,
      matchedQuestion: c.question,
    });
  }

  scored.sort((a, b) => b.score - a.score);

  // Deduplicate by answerId so RAG gets unique knowledge snippets
  const seen = new Set<string>();
  const unique: FaqMatchResult[] = [];
  for (const item of scored) {
    if (seen.has(item.answerId)) continue;
    seen.add(item.answerId);
    unique.push(item);
    if (unique.length >= limit) break;
  }
  return unique;
}
