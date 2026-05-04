import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, User, Zap, Sparkles, BrainCircuit, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAIChatReply } from '../services/api';

const ChatSupport = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hi! I am the IoT AI Assistant powered by Llama-3. How can I help you with your project today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const getAIResponse = (text) => {
    const input = text.toLowerCase();
    if (input.includes('esp32')) return "The ESP32 is a powerful dual-core microcontroller with integrated Wi-Fi and Bluetooth. Would you like to see our starter kits or standalone modules?";
    if (input.includes('arduino')) return "Arduino is great for beginners! We have the latest UNO R4 Minima and various shield options available in the 'Microcontrollers' category.";
    if (input.includes('delivery') || input.includes('shipping')) return "We offer Express Delivery (1-2 days) and Standard Shipping (3-5 days). You can track your order in the User Dashboard.";
    if (input.includes('hi') || input.includes('hello')) return "Hello! I am your technical co-pilot. I can help with product specs, order status, or basic IoT circuit advice.";
    if (input.includes('sensor')) return "We stock everything from DHT11 humidity sensors to ultrasonic rangefinders. Check out our 'Sensors' category for the full list!";
    return "That sounds interesting! While I'm an AI assistant, I can definitely help you find the right parts for that project. Have you checked our 'Shop' section for related modules?";
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const data = await getAIChatReply(userMessage.text);
      const botResponse = { 
        role: 'bot', 
        text: data.reply
      };
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Sorry, the AI system is currently recalibrating. Please try again in a moment.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[200]">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-20 right-0 w-80 md:w-[400px] bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-border-main overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-slate-900 p-6 text-white flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 blur-3xl rounded-full"></div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center shadow-lg shadow-accent/20">
                  <Bot className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h4 className="font-black text-sm tracking-tight uppercase">Engineering Assistant</h4>
                  <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    AI Model v2.4 Active
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all relative z-10">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-grow h-96 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-slate-900 text-white' : 'bg-white border border-border-main text-accent shadow-sm'}`}>
                      {m.role === 'user' ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                    </div>
                    <div className={`p-4 rounded-2xl text-[11px] font-medium leading-relaxed shadow-sm ${
                      m.role === 'user' 
                        ? 'bg-accent text-white rounded-tr-none' 
                        : 'bg-white text-text-primary border border-border-main rounded-tl-none'
                    }`}>
                      {m.text}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex gap-3 items-center">
                    <div className="w-8 h-8 rounded-lg bg-white border border-border-main text-accent flex items-center justify-center shadow-sm">
                      <Sparkles className="h-4 w-4 animate-spin" />
                    </div>
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-5 bg-white border-t border-border-main flex gap-3 items-center">
              <div className="flex-grow relative">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Tell me about your IoT project..."
                  className="w-full pl-5 pr-12 py-4 bg-slate-50 border border-border-main rounded-2xl text-xs font-bold outline-none focus:border-accent focus:bg-white transition-all shadow-inner"
                />
                <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-accent transition-colors">
                  <BrainCircuit className="h-5 w-5" />
                </button>
              </div>
              <button type="submit" className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-accent transition-all shadow-lg shadow-slate-900/10 active:scale-95">
                <Send className="h-5 w-5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-20 h-20 bg-accent text-white rounded-3xl shadow-2xl flex items-center justify-center hover:scale-105 transition-all group relative active:scale-95 shadow-accent/30"
      >
        <AnimatePresence mode="wait">
          {!isOpen ? (
            <motion.div key="chat" initial={{ opacity: 0, rotate: -20 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 20 }}>
              <MessageSquare className="h-8 w-8" />
            </motion.div>
          ) : (
            <motion.div key="close" initial={{ opacity: 0, rotate: 20 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -20 }}>
              <X className="h-8 w-8" />
            </motion.div>
          )}
        </AnimatePresence>
        {!isOpen && (
          <span className="absolute -top-2 -right-2 flex h-6 w-6">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-6 w-6 bg-emerald-500 border-4 border-white"></span>
          </span>
        )}
      </button>
    </div>
  );
};

export default ChatSupport;
