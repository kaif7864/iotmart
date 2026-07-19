import React from 'react';
import { Send, Zap, Mail, Terminal, ArrowRight, CheckCircle2 } from 'lucide-react';

const Newsletter = () => {
  return (
    <section className="py-24 bg-card-bg relative overflow-hidden border-t border-border-main">
      {/* Background glow effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-app-bg)_0%,_transparent_100%)] opacity-50"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="relative bg-surface-dark rounded-[2.5rem] overflow-hidden shadow-2xl">
           
           {/* Decorative elements */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-[100px] pointer-events-none"></div>
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/20 rounded-full blur-[100px] pointer-events-none"></div>
           <div className="absolute inset-0 opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/circuit-board.png')] mix-blend-overlay pointer-events-none"></div>

           <div className="grid grid-cols-1 lg:grid-cols-2 p-10 md:p-16 lg:p-20 items-center gap-16 relative z-10">
              
              {/* Left Content */}
              <div>
                 <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-black uppercase tracking-[0.2em] mb-8 border border-accent/20">
                    <Zap className="w-3 h-3 fill-current"/> Early Access
                 </div>
                 
                 <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-text-inverse tracking-tighter mb-6 leading-tight uppercase">
                    Get The <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary">Ping.</span>
                 </h2>
                 
                 <p className="text-text-on-dark text-lg font-medium max-w-xl mb-10 leading-relaxed">
                    Join the elite network of hardware engineers. Receive cutting-edge component drops, technical deep-dives, and exclusive prototype pricing directly to your inbox.
                 </p>
                 
                 <div className="flex flex-wrap gap-4 text-sm font-bold text-text-muted">
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent"/> No Spam</div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent"/> Weekly Drops</div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent"/> Exclusive Prices</div>
                 </div>
              </div>

              {/* Right Form */}
              <div className="relative">
                 <div className="absolute inset-0 bg-gradient-to-tr from-accent to-secondary blur-xl opacity-20 rounded-3xl pointer-events-none"></div>
                 <div className="relative bg-surface-dark border border-card-bg/10 rounded-3xl p-8 shadow-inner">
                    <div className="flex items-center gap-3 mb-8">
                       <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center border border-accent/30">
                         <Terminal className="w-5 h-5 text-accent"/>
                       </div>
                       <div className="text-text-inverse font-bold uppercase tracking-widest text-sm">
                          Initialize Subscription
                       </div>
                    </div>
                    
                    <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
                      <div className="relative group">
                         <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-accent transition-colors" />
                         <input 
                           type="email" 
                           placeholder="engineer@domain.com" 
                           className="w-full pl-14 pr-5 py-5 bg-card-bg/5 border border-card-bg/10 rounded-xl text-base text-text-inverse font-medium placeholder:text-text-muted/50 focus:border-accent focus:bg-card-bg/10 outline-none transition-all"
                           required
                         />
                      </div>
                      
                      <button className="w-full py-5 bg-gradient-to-r from-accent to-secondary hover:from-accent-hover hover:to-secondary text-white rounded-xl font-black uppercase tracking-widest transition-all shadow-lg shadow-accent/25 flex items-center justify-center gap-3 group">
                        Subscribe System
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </form>
                    
                    <div className="mt-6 flex items-center justify-between text-xs text-text-muted font-bold uppercase tracking-widest">
                       <span>Secure Connection</span>
                       <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-status-success animate-pulse"></span> Online</span>
                    </div>
                 </div>
              </div>

           </div>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
