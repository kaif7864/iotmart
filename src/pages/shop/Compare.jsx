import React from 'react';
import { Link } from 'react-router-dom';
import { useComparison } from '../../context/ComparisonContext';
import { useCart } from '../../hooks/useCart';
import { Trash2, ArrowRight, X, Cpu, Wifi, Zap, Activity, ShoppingCart, Info, Scale, Check, Minus } from 'lucide-react';

const Compare = () => {
  const { comparisonList, removeFromCompare, clearComparison } = useComparison();

  const allSpecs = Array.from(new Set(comparisonList.flatMap(p => p.specs || [])));

  if (comparisonList.length === 0) {
    return (
      <div className="pt-48 pb-32 min-h-screen text-center px-4">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 bg-surface-hover rounded-full flex items-center justify-center mx-auto mb-6">
            <Scale className="h-10 w-10 text-text-muted" />
          </div>
          <h2 className="text-3xl font-black text-text-primary uppercase tracking-tight mb-4">Comparison List Empty</h2>
          <p className="text-text-secondary mb-10 text-sm">Add some IoT components to compare their technical specifications side-by-side.</p>
          <Link to="/shop" className="btn-premium px-10 py-4 inline-block">GO TO SHOP</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-32 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <p className="text-xs font-bold text-accent uppercase tracking-widest mb-1">Technical Audit</p>
            <h1 className="text-4xl font-black text-text-primary tracking-tight">Product Comparison</h1>
          </div>
          <button 
            onClick={clearComparison}
            className="text-status-danger hover:text-status-danger hover:bg-status-danger-bg text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all p-2 rounded-sm"
          >
            <X className="h-4 w-4" /> Clear All
          </button>
        </div>

        <div className="overflow-x-auto rounded-sm border border-border-main bg-card-bg shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-app-bg border-b border-border-main">
                <th className="py-8 px-8 w-1/4 min-w-[250px]">
                  <div className="flex items-center gap-3 text-text-muted">
                    <Info className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Specifications</span>
                  </div>
                </th>
                {comparisonList.map((product) => (
                  <th key={product._id} className="py-8 px-8 border-l border-border-main min-w-[250px] group relative">
                    <button 
                      onClick={() => removeFromCompare(product._id)}
                      className="absolute top-4 right-4 p-1.5 bg-card-bg border border-border-main rounded-full text-text-muted hover:text-status-danger hover:border-status-danger/20 transition-all shadow-sm opacity-0 group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <div className="flex flex-col items-center text-center">
                      <div className="w-24 h-24 mb-6 bg-app-bg rounded-sm p-3 border border-border-main">
                        <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                      </div>
                      <h3 className="text-sm font-bold text-text-primary mb-2 line-clamp-2 min-h-[40px] px-4">{product.name}</h3>
                      <p className="text-accent font-black text-lg mb-6">${product.price.toFixed(2)}</p>
                      <Link 
                        to={`/product/${product._id}`}
                        className="w-full py-2.5 bg-text-primary text-white text-[10px] font-bold rounded-sm uppercase tracking-widest hover:bg-accent transition-all shadow-md"
                      >
                        View Details
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              <tr>
                <td className="py-5 px-8 text-xs font-bold text-text-muted uppercase tracking-wider bg-app-bg/50">Category</td>
                {comparisonList.map(p => (
                  <td key={p._id} className="py-5 px-8 text-sm font-semibold text-text-primary border-l border-border-main/50">{p.category}</td>
                ))}
              </tr>
              <tr>
                <td className="py-5 px-8 text-xs font-bold text-text-muted uppercase tracking-wider bg-app-bg/50">User Rating</td>
                {comparisonList.map(p => (
                  <td key={p._id} className="py-5 px-8 border-l border-border-main/50">
                    <span className="text-sm font-black text-text-primary">{p.rating}</span>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-5 px-8 text-xs font-bold text-text-muted uppercase tracking-wider bg-app-bg/50">Availability</td>
                {comparisonList.map(p => (
                  <td key={p._id} className="py-5 px-8 border-l border-border-main/50">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${p.inStock ? 'text-status-success bg-status-success/10' : 'text-status-danger bg-status-danger-bg'}`}>
                      {p.inStock ? 'In Stock' : 'Sold Out'}
                    </span>
                  </td>
                ))}
              </tr>
              {allSpecs.map(spec => (
                <tr key={spec}>
                  <td className="py-5 px-8 text-xs font-bold text-text-secondary bg-app-bg/50">{spec}</td>
                  {comparisonList.map(p => (
                    <td key={p._id} className="py-5 px-8 border-l border-border-main/50">
                      {p.specs?.includes(spec) ? (
                        <div className="w-6 h-6 bg-status-success/10 rounded-full flex items-center justify-center text-status-success">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      ) : (
                        <Minus className="h-4 w-4 text-lab-text" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Compare;
