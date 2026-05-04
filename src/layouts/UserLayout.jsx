import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useComparison } from '../context/ComparisonContext';
import { Scale, X, ArrowRight } from 'lucide-react';

const UserLayout = ({ cartCount }) => {
  const { comparisonList, removeFromCompare } = useComparison();

  return (
    <div className="min-h-screen bg-app-bg flex flex-col font-sans relative">
      <Navbar cartCount={cartCount} />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />

      {/* Sticky Comparison Bar */}
      {comparisonList.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-2xl">
          <div className="bg-white border border-border-main rounded-2xl shadow-2xl p-4 flex items-center justify-between gap-6 overflow-hidden">
            <div className="flex items-center gap-4 overflow-x-auto pb-1 scrollbar-hide">
              <div className="flex -space-x-3">
                {comparisonList.map((product) => (
                  <div key={product._id} className="relative group">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border-2 border-white shadow-sm overflow-hidden p-1 group-hover:scale-110 transition-transform cursor-pointer">
                      <img src={product.image} alt="" className="w-full h-full object-contain" />
                    </div>
                    <button 
                      onClick={() => removeFromCompare(product._id)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <X className="h-2 w-2" />
                    </button>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-primary uppercase tracking-widest whitespace-nowrap">{comparisonList.length} Items Selected</p>
                <p className="text-[9px] text-text-muted font-medium uppercase tracking-tighter">Compare technical specs</p>
              </div>
            </div>

            <Link 
              to="/compare"
              className="btn-premium px-6 py-3 text-[10px] whitespace-nowrap flex items-center gap-2"
            >
              <Scale className="h-4 w-4" />
              Compare Now
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserLayout;
