/**
 * Node-runnable pure tests for Motion Engine policy (no DOM).
 * Execute: cd apps/web && npx --yes tsx tests/motion/motion-number.node.ts
 */
import assert from 'node:assert/strict';
import { formatAnimatedNumber } from '../../src/platform/motion/motion-number';
import { computeQuality } from '../../src/platform/motion/motion-quality';
import {
  MOTION_DURATION,
  resolveTransition,
} from '../../src/platform/motion/motion-tokens';
import {
  claimMotionTarget,
  clearMotionConflicts,
} from '../../src/platform/motion/motion-conflicts';

const money = formatAnimatedNumber(1234.5, 'currency', { currency: 'USD' });
assert.ok(money.includes('1,234') || money.includes('1234'), money);

const neg = formatAnimatedNumber(-10.25, 'currency', { currency: 'USD' });
assert.ok(neg.includes('10'), neg);

assert.equal(computeQuality({ reducedMotion: true }), 'minimal');
assert.equal(
  computeQuality({ fps: 60, hardwareConcurrency: 8, deviceMemoryGb: 8 }),
  'ultra',
);
assert.equal(computeQuality({ fps: 30, longTaskMs: 90 }), 'minimal');

assert.equal(resolveTransition('Hover').durationMs, MOTION_DURATION.Fast);
assert.ok(MOTION_DURATION.Standard <= 250);

clearMotionConflicts();
const a = claimMotionTarget('a', 'btn', 'transform', 'hover');
assert.equal(a.action, 'proceed');
const b = claimMotionTarget('b', 'btn', 'transform', 'loading');
assert.equal(b.action, 'proceed');
assert.equal(b.interruptedId, 'a');
const c = claimMotionTarget('c', 'btn', 'transform', 'hover');
assert.equal(c.action, 'drop');

console.log('motion-number.node.ts: ok');
