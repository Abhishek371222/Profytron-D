import { getTierLimits, PLATFORM_PLANS } from './pricing.constants';

describe('Trial entitlement mapping (Stage 3 verification — no new entitlement code)', () => {
  it('Starter trial (tier PRO) grants exactly Starter plan limits', () => {
    const starter = PLATFORM_PLANS.find((p) => p.name === 'Starter')!;
    const limits = getTierLimits('PRO');
    expect(limits).toEqual({
      maxStrategies: starter.maxStrategies,
      maxCopyTrades: starter.maxCopyTrades,
      maxBrokerAccounts: starter.maxBrokerAccounts,
      maxTeamMembers: starter.maxTeamMembers,
    });
  });

  it('Pro trial (tier ELITE) grants exactly Pro plan limits', () => {
    const pro = PLATFORM_PLANS.find((p) => p.name === 'Pro')!;
    const limits = getTierLimits('ELITE');
    expect(limits).toEqual({
      maxStrategies: pro.maxStrategies,
      maxCopyTrades: pro.maxCopyTrades,
      maxBrokerAccounts: pro.maxBrokerAccounts,
      maxTeamMembers: pro.maxTeamMembers,
    });
  });

  it('only Starter and Pro are trial-eligible', () => {
    const eligible = PLATFORM_PLANS.filter((p) => p.trialEligible).map((p) => p.name);
    expect(eligible).toEqual(['Starter', 'Pro']);
  });
});
