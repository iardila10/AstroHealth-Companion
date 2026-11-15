
import type { HealthStatus } from '../../types/health';

interface StatusBadgeProps {
  status: HealthStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const statusConfig: Record<
  HealthStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  normal: {
    label: 'Normal',
    bg: 'bg-[#10B981]/15',
    text: 'text-[#10B981]',
    dot: 'bg-[#10B981]',
  },
  attention: {
    label: 'Attention',
    bg: 'bg-[#F59E0B]/15',
    text: 'text-[#F59E0B]',
    dot: 'bg-[#F59E0B]',
  },
  critical: {
    label: 'Critical',
    bg: 'bg-[#F43F5E]/15',
    text: 'text-[#F43F5E]',
    dot: 'bg-[#F43F5E]',
  },
  no_data: {
    label: 'No Data',
    bg: 'bg-[#64748B]/15',
    text: 'text-[#64748B]',
    dot: 'bg-[#64748B]',
  },
};

const sizeStyles = {
  sm: 'text-[11px] px-2 py-0.5 gap-1.5',
  md: 'text-xs px-2.5 py-1 gap-1.5',
  lg: 'text-sm px-3 py-1.5 gap-2',
};

export const StatusBadge = ({
  status,
  size = 'md',
  showLabel = true,
  className = '',
}: StatusBadgeProps) => {
  const config = statusConfig[status];

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full
        ${config.bg} ${config.text} ${sizeStyles[size]} ${className}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
};