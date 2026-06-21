declare module 'ioredis-mock' {
  import { Redis } from 'ioredis';

  /**
   * In-memory, ioredis-compatible client used for local dev and tests.
   * Typed loosely as the real ioredis client so it can be used as a drop-in.
   */
  export default class RedisMock extends Redis {
    constructor(...args: any[]);
  }
}
