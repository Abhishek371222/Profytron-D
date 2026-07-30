'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { subscriptionsApi } from '@/lib/api/subscriptions';
import { trackEvent, ACTIVATION_EVENTS } from '@/lib/analytics/track';
import { toast } from 'sonner';

interface Props {
  planId: string;
  planName: string;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  onSuccess?: () => void;
}

/**
 * Grants a 7-day trial directly — no Razorpay checkout, no payment method.
 * Sibling to RazorpaySubscriptionButton but hits /subscriptions/trial/start
 * instead of the paid checkout flow.
 */
export function StartTrialButton({
  planId,
  planName,
  disabled,
  className,
  children,
  onSuccess,
}: Props) {
  const [loading, setLoading] = React.useState(false);

  const handleStartTrial = async () => {
    setLoading(true);
    trackEvent(ACTIVATION_EVENTS.CHECKOUT_STARTED, {
      planId,
      planName,
      trial: true,
    });

    try {
      await subscriptionsApi.startTrial(planId);
      toast.success('Trial started', {
        description: `Your ${planName} trial is active for 7 days — no payment required.`,
      });
      onSuccess?.();
    } catch (err: unknown) {
      const message =
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response
          ?.data?.message === 'string'
          ? (err as { response: { data: { message: string } } }).response.data
              .message
          : 'Could not start your trial.';
      toast.error('Trial not started', { description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleStartTrial}
      disabled={disabled || loading}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Starting…
        </>
      ) : (
        (children ?? 'Start 7-Day Trial')
      )}
    </Button>
  );
}
