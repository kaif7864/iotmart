import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import { Bell, Search, User } from 'lucide-react';

const AdminLayout = () => {
  return (
    <div className="flex min-h-screen bg-app-bg text-text-primary">
      <AdminSidebar />
      
      <div className="flex-grow flex flex-col">
        {/* Admin Top Header */}
        <header className="h-20 border-b border-border-main px-8 flex justify-between items-center sticky top-0 bg-app-bg/80 backdrop-blur-md z-40">
          <div className="relative w-full md:w-96 hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search data, users, orders..." 
              className="w-full pl-10 pr-4 py-2 bg-card-bg/50 border border-border-main rounded-sm text-sm focus:outline-none focus:border-accent transition-all"
            />
          </div>

          <div className="flex items-center gap-6">
            <button className="relative p-2 text-text-secondary hover:text-accent transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full border-2 border-app-bg"></span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-border-main">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-text-primary leading-none">Admin Panel</p>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">Super User</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center border border-border-accent">
                <User className="h-5 w-5 text-accent" />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-grow p-8 lg:p-12">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
