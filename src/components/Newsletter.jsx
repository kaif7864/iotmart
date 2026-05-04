import React from 'react';
import { Send } from 'lucide-react';

const Newsletter = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50 rounded-xl p-10 md:p-16 border border-border-main flex flex-col items-center text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4 tracking-tight uppercase">
            Join Our <span className="text-accent">Newsletter</span>
          </h2>
          <p className="text-text-secondary text-base max-w-xl mb-8">
            Get early access to new arrivals, technical guides, and exclusive member-only discounts delivered to your inbox.
          </p>
          
          <form className="w-full max-w-md flex flex-col sm:flex-row gap-3" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="Your email address" 
              className="flex-grow px-5 py-3 bg-white border border-border-main rounded-lg text-sm text-text-primary focus:border-accent outline-none transition-all"
              required
            />
            <button className="px-8 py-3 bg-accent hover:bg-accent/90 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2 group whitespace-nowrap shadow-sm">
              Subscribe Now
              <Send className="h-4 w-4" />
            </button>
          </form>
          
          <p className="mt-6 text-text-muted text-xs font-medium uppercase tracking-wider">
            No spam. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
