import { RedisThrottlerStorage } from './throttler-redis.storage';

describe('RedisThrottlerStorage', () => {
  it('increments hits and marks blocked when over limit', async () => {
    const store = new Map<string, { value: string; pttl: number }>();
    const redis = {
      pttl: jest.fn(async (key: string) => store.get(key)?.pttl ?? -2),
      incr: jest.fn(async (key: string) => {
        const cur = Number(store.get(key)?.value ?? '0') + 1;
        store.set(key, { value: String(cur), pttl: 60_000 });
        return cur;
      }),
      expire: jest.fn(async () => 1),
      set: jest.fn(async (key: string) => {
        store.set(key, { value: '1', pttl: 30_000 });
        return 'OK';
      }),
    } as any;

    const storage = new RedisThrottlerStorage(redis);
    const first = await storage.increment('ip:1', 60_000, 2, 30_000, 'default');
    expect(first.totalHits).toBe(1);
    expect(first.isBlocked).toBe(false);

    await storage.increment('ip:1', 60_000, 2, 30_000, 'default');
    const blocked = await storage.increment(
      'ip:1',
      60_000,
      2,
      30_000,
      'default',
    );
    expect(blocked.totalHits).toBe(3);
    expect(blocked.isBlocked).toBe(true);
    expect(redis.set).toHaveBeenCalled();
  });
});
