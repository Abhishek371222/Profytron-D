/**
 * Node policy selftest for Experience Engine.
 * Run: cd apps/web && npx --yes tsx tests/experience/experience-policy.node.ts
 */
import assert from 'node:assert/strict';
import { computeQuality } from '../../src/platform/motion/motion-quality';
import { EXPERIENCE_BUDGETS } from '../../src/platform/experience/experience-budgets';
import { ASSET_MANIFEST } from '../../src/platform/experience/asset-manifest';
import { SHADER_CONTRACTS } from '../../src/platform/experience/shader-contracts';
import {
  createExperienceMachine,
  transitionExperience,
  getExperienceState,
} from '../../src/platform/experience/experience-state';
import { coachEmotionFromFlags } from '../../src/platform/experience/coach-visual';

assert.ok(EXPERIENCE_BUDGETS.hero.loadToInteractiveMs === 1000);
assert.ok(ASSET_MANIFEST.length >= 3);
assert.ok(SHADER_CONTRACTS['floating-lines'].fallback.includes('CSS'));

createExperienceMachine('test-hero');
transitionExperience('test-hero', 'loading');
transitionExperience('test-hero', 'streaming');
transitionExperience('test-hero', 'interactive');
assert.equal(getExperienceState('test-hero'), 'interactive');

assert.equal(coachEmotionFromFlags({ loading: true }), 'thinking');
assert.equal(coachEmotionFromFlags({ error: true }), 'error');
assert.equal(computeQuality({ reducedMotion: true }), 'minimal');

console.log('experience-policy.node.ts: ok');
