import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Sidebar } from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';

export function MainLayout() {
  return (
    <div className="min-h-svh flex flex-col bg-bg">
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />
        <main className="flex-1 min-w-0 pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
