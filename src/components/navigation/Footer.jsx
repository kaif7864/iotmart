import React from 'react';
import { Link } from 'react-router-dom';
import { FaTwitter, FaGithub, FaLinkedin, FaDiscord, FaMapMarkerAlt } from 'react-icons/fa';
import { CircuitBoard, ArrowUpRight, Zap, ShieldCheck } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-surface-dark border-t border-slate-800/50 pt-24 pb-10 relative overflow-hidden">
      {/* Background Glow Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-30" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[500px] bg-accent/10 blur-[150px] rounded-full pointer-events-none -z-10" />
      <div className="absolute inset-0 opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/microcarbon.png')] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Section - Large Brand & CTA */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-24 pb-16 border-b border-slate-800/50 gap-12">
           <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-accent/20">
                  <ShieldCheck className="w-3 h-3 fill-current"/> Secure Global Shipping
              </div>
              <h2 className="text-5xl lg:text-7xl font-black text-white tracking-tighter uppercase leading-[0.9]">
                 Build The <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary">Future.</span>
              </h2>
           </div>
           
           <div className="flex flex-col gap-6 w-full lg:w-auto">
              <p className="text-text-muted text-sm font-medium max-w-sm">
                Empowering engineers, hobbyists, and industrial innovators with premium, reliable IoT components and microcontrollers.
              </p>
              <div className="flex gap-4">
                {[
                  { icon: FaTwitter, link: "#" },
                  { icon: FaGithub, link: "#" },
                  { icon: FaLinkedin, link: "#" },
                  { icon: FaDiscord, link: "#" }
                ].map((social, idx) => (
                  <a key={idx} href={social.link} className="w-12 h-12 rounded-xl bg-card-bg/5 border border-card-bg/10 flex items-center justify-center text-text-muted hover:text-white hover:bg-accent hover:border-accent hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_10px_20px_rgba(2,132,199,0.3)]">
                    <social.icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
           </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 lg:gap-16 mb-24">
          
          {/* Column 1 */}
          <div>
            <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
              <span className="w-2 h-2 bg-accent rounded-sm"></span> Hardware
            </h3>
            <ul className="space-y-4">
              {['Microcontrollers', 'Sensors & Modules', 'Development Boards', 'Actuators & Motors'].map((link, i) => (
                <li key={i}>
                  <Link to="/shop" className="text-text-muted hover:text-white text-sm font-medium transition-colors group flex items-center gap-2">
                    {link} <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:text-accent transition-all group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Column 2 */}
          <div>
            <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
              <span className="w-2 h-2 bg-secondary rounded-sm"></span> Ecosystem
            </h3>
            <ul className="space-y-4">
              {['Smart Home Kits', 'Robotics Parts', 'Drone Components', 'Industrial IoT'].map((link, i) => (
                <li key={i}>
                  <Link to="/shop" className="text-text-muted hover:text-white text-sm font-medium transition-colors group flex items-center gap-2">
                    {link} <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:text-secondary transition-all group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Column 3 */}
          <div>
            <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
              <span className="w-2 h-2 bg-status-info rounded-sm"></span> Support
            </h3>
            <ul className="space-y-4">
              {['Documentation', 'Shipping & Returns', 'Order Tracking', 'Contact Us'].map((link, i) => (
                <li key={i}>
                  <Link to="/contact" className="text-text-muted hover:text-white text-sm font-medium transition-colors group flex items-center gap-2">
                    {link} <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:text-status-info transition-all group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Column 4 - HQ */}
          <div>
            <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
              <span className="w-2 h-2 bg-status-success rounded-sm"></span> Headquarters
            </h3>
            <div className="bg-card-bg/5 border border-card-bg/10 rounded-2xl p-6 relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-br from-status-success/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
               <FaMapMarkerAlt className="h-6 w-6 text-status-success mb-4" />
               <p className="text-text-inverse font-medium text-sm leading-relaxed mb-4">
                 128 Tech Boulevard<br/>Silicon Valley, CA 94025
               </p>
               <div className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse"></span> Open 24/7 For Orders
               </div>
            </div>
          </div>

        </div>
        
        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent/20 rounded-md flex items-center justify-center border border-accent/30">
              <CircuitBoard className="h-4 w-4 text-accent" />
            </div>
            <span className="font-black text-xl text-white tracking-tighter">IoT<span className="text-accent">Mart</span></span>
          </div>

          <p className="text-text-muted text-[10px] font-black uppercase tracking-widest">
            &copy; {new Date().getFullYear()} IoTMart Inc. All systems operational.
          </p>

          <div className="flex items-center gap-6">
            <Link to="/terms" className="text-text-muted hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors">Terms</Link>
            <span className="w-1 h-1 rounded-full bg-card-bg/20"></span>
            <Link to="/privacy" className="text-text-muted hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors">Privacy</Link>
            <span className="w-1 h-1 rounded-full bg-card-bg/20"></span>
            <Link to="/contact" className="text-text-muted hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors">Cookies</Link>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
