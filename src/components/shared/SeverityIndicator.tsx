
import type { HealthStatus } from '../../types/health';

interface SeverityIndicatorProps {
  status: HealthStatus;
  size?: number; // diameter in px
  showPulse?: boolean;
  className?: string;
}

const statusColors: Record<HealthStatus, string> = {
  normal: '#10B981',
  attention: '#F59E0B',
  critical: '#F43F5E',
  no_data: '#64748B',
};

export const SeverityIndicator = ({
  status,
  size = 12,
  showPulse = false,
  className = '',
}: SeverityIndicatorProps) => {
  const color = statusColors[status];
  const shouldPulse = showPulse && (status === 'attention' || status === 'critical');

  return (
    <span
      className={`relative inline-flex ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Main dot */}
      <span
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: color }}
      />

      {/* Pulse animation for attention / critical */}
      {shouldPulse && (
        <span
          className="absolute inset-0 rounded-full animate-ping opacity-40"
          style={{ backgroundColor: color }}
        />
      )}
    </span>
  );
};