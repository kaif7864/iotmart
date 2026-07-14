import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  LogOut, 
  CircuitBoard,
  Bell,
  Cpu,
  Tag
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AdminSidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { name: 'Inventory', icon: Package, path: '/admin/products' },
    { name: 'Orders', icon: ShoppingCart, path: '/admin/orders' },
    { name: 'Promo Codes', icon: Tag, path: '/admin/promos' },
    { name: 'Customers', icon: Users, path: '/admin/users' },
    // { name: 'IoT Control', icon: Cpu, path: '/admin/iot' }, // Lab type work not needed
  ];

  return (
    <div className="w-64 min-h-screen bg-app-bg border-r border-border-main hidden md:flex flex-col sticky top-0">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-10">
          <CircuitBoard className="h-8 w-8 text-accent" />
          <span className="font-extrabold text-xl text-text-primary tracking-tight">Admin Console</span>
        </div>
       
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-sm text-sm font-bold transition-all ${
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

      <div className="mt-auto p-6 space-y-4">
        <button className="flex items-center gap-3 px-4 py-3 w-full text-sm font-bold text-text-muted hover:text-accent transition-colors">
          <Settings className="h-5 w-5" />
          System Settings
        </button>
        <button 
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full text-sm font-bold text-status-danger hover:bg-status-danger/10 rounded-sm transition-all"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
