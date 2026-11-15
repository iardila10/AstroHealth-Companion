
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './header';
import { useUIStore } from '../../stores/useUIStore';

export const AppShell = () => {
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);

  return (
    <div className="flex h-screen bg-[#0F172A] text-[#F8FAFC] overflow-hidden">
      <Sidebar />
      <div
        className={`flex flex-col flex-1 transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};