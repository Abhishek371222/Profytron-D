import { AuthTrustLogos } from '@/components/auth/AuthTrustLogos';
import { cn } from '@/lib/utils';

export function AuthExperienceTrustBar({ className }: { className?: string }) {
  return (
    <div className={cn('ax-trust', className)}>
      <p className="ax-trust-label">Trusted by professional traders worldwide</p>
      <AuthTrustLogos />
    </div>
  );
}
