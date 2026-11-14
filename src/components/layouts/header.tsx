
import { Bell, Wifi, WifiOff } from 'lucide-react';
import { useHealthStore } from '../../stores/useHealthStore';
import { useAstronautStore } from '../../stores/useAstronautStore';
import { StatusBadge } from '../shared/StatusBadge';

export const Header = () => {
  const overallStatus = useHealthStore((state) => state.getOverallStatus());
  const alerts = useHealthStore((state) => state.alerts);
  const { currentEnvironment, astronaut } = useAstronautStore();

  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged).length;
  const isOnline = true; // Replace with real connection status later

  const environmentLabel =
    currentEnvironment === 'spacecraft' ? 'Spacecraft' : 'Lunar Base';

  return (
    <header className="h-16 border-b border-[#334155] bg-[#0F172A]/80 backdrop-blur-sm px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-lg font-semibold text-[#F8FAFC]">
            Health Monitoring
          </h1>
          <p className="text-xs text-[#94A3B8]">
            {astronaut?.name ?? 'Astronaut'} · {environmentLabel}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Overall Status */}
        <StatusBadge status={overallStatus} size="md" />

        {/* Connection indicator */}
        <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
          {isOnline ? (
            <>
              <Wifi size={14} className="text-[#10B981]" />
              <span>Live</span>
            </>
          ) : (
            <>
              <WifiOff size={14} className="text-[#F43F5E]" />
              <span>Offline</span>
            </>
          )}
        </div>

        {/* Alerts bell */}
        <button className="relative p-2 rounded-lg hover:bg-[#1E293B] transition-colors">
          <Bell size={18} className="text-[#94A3B8]" />
          {unacknowledgedAlerts > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#F43F5E] text-[10px] font-bold rounded-full flex items-center justify-center">
              {unacknowledgedAlerts}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};