import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import { Bell, Search, User, Menu, X, AlertTriangle, Info, ShieldCheck, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const AdminLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const { user, notifications, markAllRead } = useAuth();

  return (
    <div className="flex min-h-screen bg-app-bg text-text-primary">
      <AdminSidebar isOpen={isMobileOpen} setIsOpen={setIsMobileOpen} />
      
      <div className="flex-grow flex flex-col min-w-0">
        {/* Admin Top Header */}
        <header className="h-20 border-b border-border-main px-4 sm:px-8 flex justify-between items-center sticky top-0 bg-app-bg/80 backdrop-blur-md z-40">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 text-text-secondary hover:text-accent transition-colors"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <Link 
              to="/" 
              title="Go to Main Store"
              className="p-2 sm:p-3 bg-app-bg rounded-full border border-border-main hover:bg-card-bg hover:border-accent transition-all shadow-sm group flex items-center justify-center"
            >
              <Globe className="h-5 w-5 text-text-secondary group-hover:text-accent transition-colors" />
            </Link>

            <div className="relative">
              <button 
                onClick={() => { setIsNotifOpen(!isNotifOpen); markAllRead(); }}
                className="p-3 bg-app-bg rounded-full border border-border-main hover:bg-card-bg hover:border-accent transition-all shadow-sm relative group"
              >
                <Bell className={`h-5 w-5 ${notifications?.some(n => !n.read) ? 'text-accent' : 'text-text-secondary'} group-hover:text-accent transition-colors`} />
                {notifications?.some(n => !n.read) && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-accent rounded-full border-2 border-card-bg animate-pulse"></span>
                )}
              </button>
              
              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="fixed left-4 right-4 top-20 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-80 bg-card-bg border border-border-main rounded-[24px] shadow-2xl overflow-hidden z-[110]"
                  >
                    <div className="p-5 border-b border-border-subtle bg-app-bg/50 flex justify-between items-center">
                      <p className="text-[10px] font-black text-text-primary uppercase tracking-[0.2em]">Notifications</p>
                      <button onClick={() => setIsNotifOpen(false)} className="text-text-muted hover:text-accent"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications?.length > 0 ? notifications.map((n) => (
                        <div key={n.id} className="p-5 border-b border-border-subtle hover:bg-app-bg transition-all flex gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${n.type === 'warning' ? 'bg-status-warning-bg text-status-warning-text' : 'bg-status-info-bg text-accent'}`}>
                            {n.type === 'warning' ? <AlertTriangle className="h-5 w-5" /> : <Info className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="text-xs font-black text-text-primary uppercase tracking-tight leading-tight">{n.title}</p>
                            <p className="text-[10px] text-text-secondary mt-1 font-medium leading-relaxed">{n.message}</p>
                            <p className="text-[8px] text-text-muted font-bold uppercase mt-2">{n.time || 'Just now'}</p>
                          </div>
                        </div>
                      )) : (
                        <div className="p-8 text-center text-text-muted">
                          <Bell className="h-8 w-8 mx-auto mb-3 opacity-20" />
                          <p className="text-xs font-medium">No new notifications</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-3 pl-6 border-l border-border-main">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-text-primary leading-none">{user?.name || user?.first_name || 'Admin Panel'}</p>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">{user?.role === 'admin' ? 'Super User' : 'Engineer'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center border border-border-accent flex-shrink-0 font-black text-accent text-lg">
                {(user?.name || user?.first_name || 'A').charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-grow p-4 sm:p-8 lg:p-12">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
