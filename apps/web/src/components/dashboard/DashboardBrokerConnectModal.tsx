'use client';

import { BrokerConnectModal } from '@/components/copy-trading/BrokerConnectModal';

export type DashboardBrokerConnectModalProps = {
  open: boolean;
  onClose: () => void;
  initialBrokerId?: string;
  onConnected?: () => void;
};

export default function DashboardBrokerConnectModal({
  open,
  onClose,
  onConnected,
}: DashboardBrokerConnectModalProps) {
  return (
    <BrokerConnectModal open={open} onClose={onClose} onConnected={onConnected} />
  );
}
