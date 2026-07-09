import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import IoTLabCanvas from '../../components/lab/IoTLabCanvas';
import { FlaskConical, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '../../hooks/useCart';

const IoTLab = () => {
  const { onAddToCart: handleAddToCart } = useCart();
  return (
    <div className="h-screen w-screen flex flex-col bg-surface-dark overflow-hidden">
      {/* Lab Top Bar */}
      <header className="h-14 sm:h-12 bg-surface-dark border-b border-lab-border flex items-center px-4 sm:px-6 gap-4 sm:gap-6 shrink-0 z-10 overflow-x-auto scrollbar-hide whitespace-nowrap">
        {/* Logo / Switch */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-text-muted hover:text-white transition-all group text-[10px] font-black uppercase tracking-widest">
            <ArrowLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" />
            IoTMart
          </Link>
          <div className="w-px h-5 bg-lab-surface" />
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-violet-400" />
            <span className="font-black text-white text-sm tracking-tighter">IoT<span className="text-violet-400">Lab</span></span>
            <span className="px-2 py-0.5 bg-violet-900/50 border border-violet-700 rounded-full text-[8px] font-black text-violet-300 uppercase tracking-widest">BETA</span>
          </div>
        </div>

        <div className="flex-grow" />

        {/* Mode toggle pills */}
        <div className="flex items-center gap-1 bg-surface-dark rounded-sm p-1 border border-lab-border">
          <Link to="/" className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-widest text-text-muted hover:text-white transition-all">
            <ShoppingBag className="h-3 w-3" /> Marketplace
          </Link>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-widest bg-violet-600 text-white shadow-lg shadow-violet-900/40">
            <FlaskConical className="h-3 w-3" /> Lab
          </div>
        </div>

        <Link to="/shop" className="flex items-center gap-2 px-4 py-1.5 bg-lab-surface hover:bg-lab-surface-hover text-lab-text rounded-sm text-[9px] font-black uppercase tracking-widest transition-all">
          <ShoppingBag className="h-3 w-3" /> Shop Components
        </Link>
      </header>

      {/* Main Lab Canvas - full height */}
      <div className="flex-grow overflow-hidden">
        <IoTLabCanvas onAddToCart={handleAddToCart} />
      </div>
    </div>
  );
};

export default IoTLab;
