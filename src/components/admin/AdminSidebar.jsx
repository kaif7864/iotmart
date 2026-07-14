import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import {
  Activity,
  Star, 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  LogOut, 
  CircuitBoard,
  Bell,
  Cpu,
  Tag,
  X,
  Download
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AdminSidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const { logout } = useAuth();
  const { isInstallable, triggerInstall } = usePWAInstall();

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { name: 'Inventory', icon: Package, path: '/admin/products' },
    { name: 'Orders', icon: ShoppingCart, path: '/admin/orders' },
    { name: 'Promo Codes', icon: Tag, path: '/admin/promos' },
    { name: 'Customers', icon: Users, path: '/admin/users' },
    { name: 'Support', icon: Bell, path: '/admin/support' },
    { name: 'Reviews', icon: Star, path: '/admin/reviews' },
    { name: 'System Logs', icon: Activity, path: '/admin/logs' },
    { name: 'Settings', icon: Settings, path: '/admin/settings' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-surface-dark/90 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 h-screen bg-app-bg border-r border-border-main flex flex-col transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:flex md:sticky md:top-0
      `}>
        <div className="p-6 shrink-0">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <CircuitBoard className="h-6 w-6 text-accent shrink-0" />
              <span className="font-black text-base text-text-primary uppercase tracking-widest whitespace-nowrap">Admin</span>
            </div>
            <button 
              className="md:hidden text-text-muted hover:text-accent"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
       
        <div className="flex-1 overflow-y-auto px-6 pb-4 no-scrollbar">
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  location.pathname === item.path
                    ? 'bg-accent text-white shadow-lg shadow-accent/20'
                    : 'text-text-muted hover:text-accent hover:bg-card-bg'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-6 shrink-0 border-t border-border-subtle bg-app-bg space-y-2">
          {isInstallable && (
            <button 
              onClick={triggerInstall}
              className="flex items-center gap-3 px-4 py-3 w-full text-sm font-bold text-accent hover:bg-accent/10 rounded-xl transition-all"
            >
              <Download className="h-5 w-5" />
              Install App
            </button>
          )}
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full text-sm font-bold text-status-danger hover:bg-status-danger/10 rounded-xl transition-all"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
