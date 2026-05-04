import React from 'react';
import { Link } from 'react-router-dom';
import { CircuitBoard } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-50 border-t border-border-main pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <CircuitBoard className="h-6 w-6 text-accent" />
              <span className="font-bold text-2xl text-text-primary tracking-tight">IoT<span className="text-accent">Mart</span></span>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed max-w-xs">
              Reliable components for engineers, hobbyists, and industrial innovators. Quality assured for every project.
            </p>
          </div>
          
          <div>
            <h3 className="text-text-primary font-bold text-xs uppercase tracking-widest mb-6">Products</h3>
            <ul className="space-y-3">
              <li><Link to="/shop" className="text-text-muted hover:text-accent text-sm font-medium transition-colors">Microcontrollers</Link></li>
              <li><Link to="/shop" className="text-text-muted hover:text-accent text-sm font-medium transition-colors">Sensors & Actuators</Link></li>
              <li><Link to="/shop" className="text-text-muted hover:text-accent text-sm font-medium transition-colors">Wireless Modules</Link></li>
              <li><Link to="/shop" className="text-text-muted hover:text-accent text-sm font-medium transition-colors">Development Boards</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-text-primary font-bold text-xs uppercase tracking-widest mb-6">Support</h3>
            <ul className="space-y-3">
              <li><Link to="/contact" className="text-text-muted hover:text-accent text-sm font-medium transition-colors">Documentation</Link></li>
              <li><Link to="/privacy" className="text-text-muted hover:text-accent text-sm font-medium transition-colors">Shipping & Returns</Link></li>
              <li><Link to="/profile" className="text-text-muted hover:text-accent text-sm font-medium transition-colors">Order Tracking</Link></li>
              <li><Link to="/contact" className="text-text-muted hover:text-accent text-sm font-medium transition-colors">Contact Support</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-text-primary font-bold text-xs uppercase tracking-widest mb-6">Company</h3>
            <ul className="space-y-3">
              <li><Link to="/about" className="text-text-muted hover:text-accent text-sm font-medium transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="text-text-muted hover:text-accent text-sm font-medium transition-colors">Bulk Orders</Link></li>
              <li><Link to="/terms" className="text-text-muted hover:text-accent text-sm font-medium transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="text-text-muted hover:text-accent text-sm font-medium transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-10 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-text-muted text-xs font-bold uppercase tracking-wider">
            &copy; {new Date().getFullYear()} IoTMart Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-xs text-text-muted font-bold uppercase tracking-widest">Follow us</span>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center text-text-muted hover:text-accent transition-all cursor-pointer">
                <span className="text-[10px] font-black">TW</span>
              </div>
              <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center text-text-muted hover:text-accent transition-all cursor-pointer">
                <span className="text-[10px] font-black">GH</span>
              </div>
              <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center text-text-muted hover:text-accent transition-all cursor-pointer">
                <span className="text-[10px] font-black">LI</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
