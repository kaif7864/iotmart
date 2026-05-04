import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search, MessageCircle, Mail, HelpCircle, Cpu, Zap, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FAQ = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    {
      category: 'General',
      icon: HelpCircle,
      questions: [
        { q: "What is IoTMart?", a: "IoTMart is a premium e-commerce platform dedicated to industrial IoT hardware, microcontrollers, and sensor modules for engineers and innovators." },
        { q: "Do you ship internationally?", a: "Yes, we ship our hardware modules globally via our orbital logistics network. Tracking IDs are provided for every deployment." }
      ]
    },
    {
      category: 'Technical',
      icon: Cpu,
      questions: [
        { q: "Are your ESP32 modules genuine?", a: "Absolutely. All our microcontrollers (ESP32, Arduino, Raspberry Pi) are sourced directly from authorized manufacturers and quality-tested." },
        { q: "Do you provide firmware libraries?", a: "Most of our sensors come with a GitHub link to verified libraries and sample code in the product description." }
      ]
    },
    {
      category: 'Orders & Payments',
      icon: ShieldCheck,
      questions: [
        { q: "Is COD available?", a: "Yes, we offer Cash on Delivery for select regions. For international orders, we support all major credit cards and Razorpay." },
        { q: "How do I track my shipment?", a: "Visit the 'Track Order' page and enter your Neural Tracking ID provided in the confirmation email." }
      ]
    }
  ];

  const filteredFaqs = faqs.map(cat => ({
    ...cat,
    questions: cat.questions.filter(f => 
      f.q.toLowerCase().includes(searchTerm.toLowerCase()) || 
      f.a.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(cat => cat.questions.length > 0);

  return (
    <div className="pt-32 pb-24 bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-accent text-[10px] font-black uppercase tracking-[0.4em] mb-4">Knowledge Base</p>
          <h1 className="text-4xl md:text-5xl font-black text-text-primary tracking-tighter uppercase mb-6">Frequently Asked <span className="text-accent">Questions</span></h1>
          <div className="w-24 h-1.5 bg-accent mx-auto rounded-full mb-10"></div>
          
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search for answers..." 
              className="w-full pl-16 pr-8 py-5 bg-slate-50 border border-border-main rounded-[24px] text-sm font-medium focus:bg-white focus:border-accent transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-12">
          {filteredFaqs.map((cat, catIdx) => (
            <div key={catIdx}>
              <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-4">
                <cat.icon className="h-5 w-5 text-accent" />
                <h2 className="text-sm font-black text-text-primary uppercase tracking-[0.2em]">{cat.category}</h2>
              </div>
              <div className="space-y-4">
                {cat.questions.map((faq, faqIdx) => {
                  const globalIdx = `${catIdx}-${faqIdx}`;
                  const isOpen = activeIndex === globalIdx;
                  return (
                    <div 
                      key={faqIdx} 
                      className={`border rounded-[24px] transition-all duration-300 ${isOpen ? 'bg-slate-50 border-accent/20' : 'bg-white border-border-main hover:border-accent/30'}`}
                    >
                      <button 
                        onClick={() => setActiveIndex(isOpen ? null : globalIdx)}
                        className="w-full px-8 py-6 flex justify-between items-center text-left"
                      >
                        <span className="text-sm font-bold text-text-primary uppercase tracking-tight">{faq.q}</span>
                        {isOpen ? <ChevronUp className="h-5 w-5 text-accent" /> : <ChevronDown className="h-5 w-5 text-text-muted" />}
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-8 pb-8 text-sm text-text-secondary leading-relaxed font-medium">
                              {faq.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Support CTA */}
        <div className="mt-24 p-12 bg-slate-950 rounded-[40px] text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 relative z-10">Still Have <span className="text-accent">Questions?</span></h3>
          <p className="text-slate-400 text-sm font-medium mb-10 relative z-10">Our AI assistant and human support team are standing by to assist with your technical needs.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-6 relative z-10">
            <button className="btn-premium px-10 py-4 text-[10px]">
              <MessageCircle className="h-4 w-4" /> Start Live Chat
            </button>
            <button className="px-10 py-4 bg-white/10 border border-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">
              <Mail className="h-4 w-4 inline mr-2" /> Open Support Ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
