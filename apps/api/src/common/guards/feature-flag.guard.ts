import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FeatureFlagsService } from '../../modules/feature-flags/feature-flags.service';

export const FEATURE_FLAG_KEY = 'feature_flag';
export const RequireFeatureFlag = (flagKey: string) =>
  SetMetadata(FEATURE_FLAG_KEY, flagKey);

/**
 * Optional guard — apply where product surfaces should gate on flags.
 * Does not change existing routes until `@UseGuards(FeatureFlagGuard)` is used.
 */
@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly flags: FeatureFlagsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const key = this.reflector.getAllAndOverride<string | undefined>(
      FEATURE_FLAG_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!key) return true;

    const req = context.switchToHttp().getRequest();
    const userId = req?.user?.userId ?? req?.user?.id;
    const enabled = await this.flags.isEnabled(key, userId);
    if (!enabled) {
      throw new ForbiddenException({
        message: `Feature disabled: ${key}`,
        code: 'FEATURE_DISABLED',
        error: 'FEATURE_DISABLED',
      });
    }
    return true;
  }
}
