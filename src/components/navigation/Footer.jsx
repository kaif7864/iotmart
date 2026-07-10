import React from 'react';
import { Link } from 'react-router-dom';
import { FaTwitter, FaGithub, FaLinkedin, FaEnvelope, FaMapMarkerAlt, FaPhone } from 'react-icons/fa';
import { CircuitBoard } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-surface-dark border-t border-slate-800 pt-24 pb-12 relative overflow-hidden">
      {/* Background Glow Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-50" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[500px] bg-accent/20 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16 mb-20">
          
          {/* Brand Column */}
          <div className="md:col-span-12 lg:col-span-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-accent/20 rounded-sm flex items-center justify-center border border-accent/30 shadow-[0_0_15px_rgba(2,132,199,0.3)]">
                <CircuitBoard className="h-6 w-6 text-accent" />
              </div>
              <span className="font-black text-3xl text-white tracking-tighter">IoT<span className="text-accent">Mart</span></span>
            </div>
            <p className="text-text-muted text-sm leading-relaxed max-w-sm mb-8 font-medium">
              Empowering engineers, hobbyists, and industrial innovators with premium, reliable IoT components and microcontrollers.
            </p>
            
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-surface-dark border border-slate-800 flex items-center justify-center text-text-muted hover:text-white hover:bg-accent hover:border-accent transition-all duration-300 hover:shadow-[0_0_15px_rgba(2,132,199,0.5)]">
                <FaTwitter className="h-4 w-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-surface-dark border border-slate-800 flex items-center justify-center text-text-muted hover:text-white hover:bg-accent hover:border-accent transition-all duration-300 hover:shadow-[0_0_15px_rgba(2,132,199,0.5)]">
                <FaGithub className="h-4 w-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-surface-dark border border-slate-800 flex items-center justify-center text-text-muted hover:text-white hover:bg-accent hover:border-accent transition-all duration-300 hover:shadow-[0_0_15px_rgba(2,132,199,0.5)]">
                <FaLinkedin className="h-4 w-4" />
              </a>
            </div>
          </div>
          
          {/* Links Columns */}
          <div className="md:col-span-4 lg:col-span-2">
            <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-8 relative inline-block">
              Products
              <span className="absolute -bottom-2 left-0 w-1/2 h-0.5 bg-accent"></span>
            </h3>
            <ul className="space-y-4">
              <li><Link to="/shop" className="text-text-muted hover:text-accent hover:translate-x-1 inline-block text-sm font-medium transition-all">Microcontrollers</Link></li>
              <li><Link to="/shop" className="text-text-muted hover:text-accent hover:translate-x-1 inline-block text-sm font-medium transition-all">Sensors & Actuators</Link></li>
              <li><Link to="/shop" className="text-text-muted hover:text-accent hover:translate-x-1 inline-block text-sm font-medium transition-all">Wireless Modules</Link></li>
              <li><Link to="/shop" className="text-text-muted hover:text-accent hover:translate-x-1 inline-block text-sm font-medium transition-all">Development Boards</Link></li>
            </ul>
          </div>
          
          <div className="md:col-span-4 lg:col-span-2">
            <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-8 relative inline-block">
              Support
              <span className="absolute -bottom-2 left-0 w-1/2 h-0.5 bg-accent"></span>
            </h3>
            <ul className="space-y-4">
              <li><Link to="/contact" className="text-text-muted hover:text-accent hover:translate-x-1 inline-block text-sm font-medium transition-all">Documentation</Link></li>
              <li><Link to="/privacy" className="text-text-muted hover:text-accent hover:translate-x-1 inline-block text-sm font-medium transition-all">Shipping & Returns</Link></li>
              <li><Link to="/profile" className="text-text-muted hover:text-accent hover:translate-x-1 inline-block text-sm font-medium transition-all">Order Tracking</Link></li>
              <li><Link to="/contact" className="text-text-muted hover:text-accent hover:translate-x-1 inline-block text-sm font-medium transition-all">Contact Support</Link></li>
            </ul>
          </div>
          
          <div className="md:col-span-4 lg:col-span-3 lg:col-start-10">
             <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-8 relative inline-block">
              Contact Us
              <span className="absolute -bottom-2 left-0 w-1/2 h-0.5 bg-accent"></span>
            </h3>
            <ul className="space-y-5">
              <li className="flex items-start gap-3 text-text-muted">
                <FaMapMarkerAlt className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <span className="text-sm font-medium leading-relaxed">128 Tech Boulevard, Silicon Valley, CA 94025</span>
              </li>
              <li className="flex items-center gap-3 text-text-muted">
                <FaPhone className="h-5 w-5 text-accent shrink-0" />
                <span className="text-sm font-medium">+1 (800) 555-0198</span>
              </li>
              <li className="flex items-center gap-3 text-text-muted">
                <FaEnvelope className="h-5 w-5 text-accent shrink-0" />
                <span className="text-sm font-medium">support@iotmart.com</span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-text-secondary text-[10px] font-black uppercase tracking-widest">
            &copy; {new Date().getFullYear()} IoTMart Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/terms" className="text-text-secondary hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors">Terms</Link>
            <span className="w-1 h-1 rounded-full bg-lab-surface"></span>
            <Link to="/privacy" className="text-text-secondary hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors">Privacy</Link>
            <span className="w-1 h-1 rounded-full bg-lab-surface"></span>
            <Link to="/contact" className="text-text-secondary hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
