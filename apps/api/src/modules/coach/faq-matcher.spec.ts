import { matchFaq, normalizeQuestion, type FaqCandidate } from './faq-matcher';

describe('faq-matcher', () => {
  const candidates: FaqCandidate[] = [
    {
      id: 'q1',
      answerId: 'a1',
      question: 'how do i manage risk per trade',
      normalized: normalizeQuestion('how do i manage risk per trade'),
      keywords: ['manage', 'risk', 'trade'],
      answerBody: 'Keep risk small.',
      category: 'risk',
    },
    {
      id: 'q2',
      answerId: 'a2',
      question: 'what is copy trading',
      normalized: normalizeQuestion('what is copy trading'),
      keywords: ['copy', 'trading'],
      answerBody: 'Copy mirrors a master.',
      category: 'copy',
    },
  ];

  it('matches exact FAQ phrasing', () => {
    const hit = matchFaq('how do i manage risk per trade', candidates, 0.55);
    expect(hit?.answerId).toBe('a1');
    expect(hit?.score).toBeGreaterThanOrEqual(0.55);
  });

  it('returns null for unrelated questions', () => {
    const hit = matchFaq(
      'what is the capital of france in 1812',
      candidates,
      0.55,
    );
    expect(hit).toBeNull();
  });
});
