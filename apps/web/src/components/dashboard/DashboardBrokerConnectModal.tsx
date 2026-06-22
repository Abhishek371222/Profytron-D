'use client';

import { BrokerConnectModal } from '@/components/copy-trading/BrokerConnectModal';

export type DashboardBrokerConnectModalProps = {
  open: boolean;
  onClose: () => void;
  /** Retained for backwards compatibility; no longer used. */
  initialBrokerId?: string;
  onConnected?: () => void;
};

/**
 * The broker "directory" experience was replaced with a single, simple MT5
 * connect form (login + password + server). This component now just renders
 * that form so every entry point shows the same lightweight flow.
 */
export default function DashboardBrokerConnectModal({
  open,
  onClose,
  onConnected,
}: DashboardBrokerConnectModalProps) {
  return (
    <BrokerConnectModal open={open} onClose={onClose} onConnected={onConnected} />
  );
}
