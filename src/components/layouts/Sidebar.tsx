
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { useAstronautStore } from '../../stores/useAstronautStore';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/measurements', label: 'Measurements', icon: Activity },
  { to: '/history', label: 'History', icon: History },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar = () => {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { astronaut, points } = useAstronautStore();

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-[#1E293B] border-r border-[#334155] z-40 transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo / Brand */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-[#334155]">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#22D3EE]/10 flex items-center justify-center">
              <span className="text-[#22D3EE] font-bold text-sm">AH</span>
            </div>
            <span className="font-semibold text-[#F8FAFC] tracking-tight">
              AstroHealth
            </span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md hover:bg-[#334155] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-4 px-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-[#22D3EE]/10 text-[#22D3EE]'
                  : 'text-[#94A3B8] hover:bg-[#334155] hover:text-[#F8FAFC]'
              }`
            }
          >
            <item.icon size={20} />
            {!sidebarCollapsed && (
              <span className="text-sm font-medium">{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section - Astronaut info */}
      {!sidebarCollapsed && astronaut && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#334155]">
          <div className="text-xs text-[#94A3B8] mb-1">Mission Crew</div>
          <div className="font-medium text-sm text-[#F8FAFC] truncate">
            {astronaut.name}
          </div>
          <div className="text-xs text-[#64748B] mt-0.5">{astronaut.missionRole}</div>
          <div className="mt-3 flex items-center gap-2">
            <div className="text-xs text-[#94A3B8]">Points</div>
            <div className="text-sm font-semibold text-[#22D3EE] tabular-nums">
              {points}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};