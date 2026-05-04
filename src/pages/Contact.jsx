import { Mail, Phone, MapPin, Send, MessageSquare, Clock, HelpCircle, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const Contact = () => {
  return (
    <div className="pt-32 pb-32 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start mb-24">
          
          <div className="space-y-12">
            <div>
              <p className="text-xs font-black text-accent uppercase tracking-[0.3em] mb-4">Connect With Us</p>
              <h1 className="text-5xl md:text-6xl font-black text-text-primary tracking-tighter mb-8 uppercase">Get in <span className="text-accent">Touch</span></h1>
              <p className="text-text-secondary text-lg font-medium leading-relaxed max-w-lg">
                Have a technical question about a sensor? Need a bulk quote for your startup? Our team is ready to help.
              </p>
            </div>

            <div className="space-y-8">
              {[
                { icon: Mail, title: 'Email Support', detail: 'support@iotmart.com', sub: 'Response within 24 hours' },
                { icon: Phone, title: 'Phone Support', detail: '+1 (555) 123-4567', sub: 'Mon-Fri, 9am - 6pm EST' },
                { icon: MapPin, title: 'Headquarters', detail: '123 Innovation Drive, Silicon Valley, CA 94025', sub: 'United States' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-6 group">
                  <div className="w-14 h-14 bg-white border border-border-main rounded-xl flex items-center justify-center text-text-muted group-hover:text-accent group-hover:border-accent/20 transition-all shadow-sm">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">{item.title}</h4>
                    <p className="text-lg font-bold text-text-primary tracking-tight">{item.detail}</p>
                    <p className="text-xs text-text-secondary font-medium">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 md:p-12 rounded-3xl border border-border-main shadow-2xl">
            <h3 className="text-2xl font-bold text-text-primary mb-8 tracking-tight uppercase">Send a Message</h3>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">Full Name</label>
                  <input 
                    type="text" 
                    className="w-full px-5 py-4 bg-slate-50 border border-border-main rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent transition-all"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">Email Address</label>
                  <input 
                    type="email" 
                    className="w-full px-5 py-4 bg-slate-50 border border-border-main rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent transition-all"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">Subject</label>
                <select className="w-full px-5 py-4 bg-slate-50 border border-border-main rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent transition-all">
                  <option>Technical Inquiry</option>
                  <option>Order Support</option>
                  <option>Bulk/Wholesale Inquiry</option>
                  <option>Partnership</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">Message</label>
                <textarea 
                  rows="5"
                  className="w-full px-5 py-4 bg-slate-50 border border-border-main rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent transition-all resize-none"
                  placeholder="How can we help you?"
                ></textarea>
              </div>
              <button className="w-full btn-premium py-5 text-sm flex items-center justify-center gap-3">
                <Send className="h-4 w-4" />
                SEND MESSAGE
              </button>
            </form>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link to="/faq" className="group bg-white p-10 rounded-[32px] border border-border-main shadow-sm hover:shadow-xl transition-all flex items-center gap-8">
            <div className="w-20 h-20 bg-accent/10 rounded-2xl flex items-center justify-center text-accent group-hover:scale-110 transition-all shrink-0">
              <HelpCircle className="h-10 w-10" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-text-primary uppercase tracking-tighter mb-2">Visit FAQ</h3>
              <p className="text-text-muted text-sm font-medium">Instant answers for microcontrollers, shipping, and technical specifications.</p>
            </div>
          </Link>
          <Link to="/support" className="group bg-slate-900 p-10 rounded-[32px] border border-slate-800 shadow-sm hover:shadow-xl transition-all flex items-center gap-8">
            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center text-accent group-hover:scale-110 transition-all shrink-0">
              <FileText className="h-10 w-10" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Open Ticket</h3>
              <p className="text-slate-400 text-sm font-medium">Direct line to our engineering team for deep technical troubleshooting.</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Contact;
