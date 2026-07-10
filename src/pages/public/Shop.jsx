import React, { useState, useEffect } from 'react';
import ProductCard from '../../components/ui/ProductCard';
import { Filter, Search, ChevronDown, SlidersHorizontal, Loader2, Grid, List as ListIcon, Star, Wifi, Bluetooth, Zap, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getProducts } from '../../services/api';
import { SkeletonGrid } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../hooks/useCart';

const Shop = () => {
  const { onAddToCart } = useCart();
  const { formatPrice } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [priceRange, setPriceRange] = useState(1000);
  const [sortBy, setSortBy] = useState('default');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedRating, setSelectedRating] = useState(0);
  const [selectedConnectivity, setSelectedConnectivity] = useState([]);
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        setProducts(data);
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const categories = ['All', ...new Set(products.map(p => p.category))];
  const connectivityOptions = ['Wi-Fi', 'Bluetooth', 'LoRa', 'Zigbee', '4G/LTE'];

  const toggleConnectivity = (tech) => {
    setSelectedConnectivity(prev => 
      prev.includes(tech) ? prev.filter(t => t !== tech) : [...prev, tech]
    );
  };

  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
      const matchesPrice = product.price <= priceRange;
      const matchesStock = inStockOnly ? product.inStock : true;
      const matchesRating = product.rating >= selectedRating;
      
      // Connectivity check (simulated as specs check)
      const matchesConnectivity = selectedConnectivity.length === 0 || 
        selectedConnectivity.some(tech => product.specs?.some(s => s.toLowerCase().includes(tech.toLowerCase())));

      return matchesSearch && matchesCategory && matchesPrice && matchesStock && matchesRating && matchesConnectivity;
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'popularity') return (b.reviews_count || 0) - (a.reviews_count || 0);
      if (sortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      return 0;
    });

  const displayedProducts = filteredProducts.slice(0, visibleCount);

  return (
    <div className="pt-32 pb-32 min-h-screen bg-app-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6 border-b border-border-main pb-8"
        >
          <div>
            <p className="text-xs font-bold text-accent uppercase tracking-[0.3em] mb-2">Technical Inventory</p>
            <h1 className="text-4xl font-black text-text-primary tracking-tight uppercase">
              Browse <span className="text-accent">Components</span>
            </h1>
          </div>
          <div className="flex bg-card-bg border border-border-main p-1 rounded-sm shadow-sm">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-sm transition-all ${viewMode === 'grid' ? 'bg-accent text-white shadow-md' : 'text-text-muted hover:text-accent'}`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-sm transition-all ${viewMode === 'list' ? 'bg-accent text-white shadow-md' : 'text-text-muted hover:text-accent'}`}
            >
              <ListIcon className="h-5 w-5" />
            </button>
          </div>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Enhanced Sidebar Filters */}
          <motion.aside 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full lg:w-72 flex-shrink-0 space-y-8"
          >
            {/* Category Filter */}
            <div className="bg-card-bg p-8 rounded-sm border border-border-main shadow-sm">
              <h3 className="text-text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6 flex items-center justify-between">
                Categories <ChevronDown className="h-3 w-3 text-text-muted" />
              </h3>
              <div className="space-y-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`w-full text-left px-4 py-2 rounded-sm text-xs font-bold transition-all ${
                      activeCategory === category 
                        ? 'bg-accent text-white shadow-lg' 
                        : 'text-text-secondary hover:text-accent hover:bg-surface-hover'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Price & Connectivity */}
            <div className="bg-card-bg p-8 rounded-sm border border-border-main shadow-sm space-y-10">
              {/* Price Range */}
              <div>
                <h3 className="text-text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6">Price Limit</h3>
                <input 
                  type="range" 
                  min="0" 
                  max="1000" 
                  value={priceRange} 
                  onChange={(e) => setPriceRange(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-border-main rounded-sm appearance-none cursor-pointer accent-accent"
                />
                <div className="flex justify-between mt-3">
                  <span className="text-[10px] font-bold text-text-muted">{formatPrice(0)}</span>
                  <span className="text-[10px] font-black text-accent">{formatPrice(priceRange)}</span>
                </div>
              </div>

              {/* Connectivity Filter */}
              <div>
                <h3 className="text-text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6">Connectivity</h3>
                <div className="flex flex-wrap gap-2">
                  {connectivityOptions.map(tech => (
                    <button
                      key={tech}
                      onClick={() => toggleConnectivity(tech)}
                      className={`px-3 py-1.5 rounded-sm text-[10px] font-bold border transition-all ${
                        selectedConnectivity.includes(tech)
                          ? 'bg-text-primary text-white border-text-primary shadow-md'
                          : 'bg-card-bg text-text-secondary border-border-main hover:border-accent'
                      }`}
                    >
                      {tech}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ratings Filter */}
              <div>
                <h3 className="text-text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6">Min. Rating</h3>
                <div className="space-y-3">
                  {[4, 3, 2].map(star => (
                    <button 
                      key={star}
                      onClick={() => setSelectedRating(selectedRating === star ? 0 : star)}
                      className={`flex items-center gap-2 w-full p-2 rounded-sm transition-all ${selectedRating === star ? 'bg-surface-hover' : ''}`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedRating === star ? 'bg-accent border-accent' : 'border-border-main'}`}>
                        {selectedRating === star && <div className="w-1.5 h-1.5 bg-card-bg rounded-full"></div>}
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`h-3 w-3 ${s <= star ? 'fill-status-star text-status-star' : 'text-border-main'}`} />
                        ))}
                      </div>
                      <span className="text-[10px] font-bold text-text-secondary">& Up</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset All */}
              <button 
                onClick={() => {
                  setActiveCategory('All');
                  setSearchTerm('');
                  setPriceRange(1000);
                  setSelectedRating(0);
                  setSelectedConnectivity([]);
                }}
                className="w-full py-3 text-[10px] font-black uppercase tracking-[0.2em] text-status-danger hover:bg-status-danger-bg rounded-sm transition-all border border-status-danger/20"
              >
                Clear All Filters
              </button>
            </div>
          </motion.aside>

          {/* Main Content Area */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex-grow space-y-8"
          >
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-4 bg-card-bg rounded-sm border border-border-main shadow-sm">
              <div className="relative w-full md:w-[400px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  className="w-full pl-12 pr-4 py-3 bg-surface-hover border border-border-main rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-4 px-4">
                <span className="text-text-muted text-[10px] font-black uppercase tracking-widest">Sort:</span>
                <select 
                  className="bg-transparent border-none text-text-primary text-[10px] font-black uppercase tracking-widest focus:outline-none cursor-pointer text-accent"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="default">Featured</option>
                  <option value="popularity">Most Popular</option>
                  <option value="newest">Newest Arrivals</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>
            </div>

            {/* Grid/List Display */}
            {loading ? (
              <div className="pt-4">
                <SkeletonGrid count={6} />
              </div>
            ) : displayedProducts.length > 0 ? (
              <div className="space-y-12">
                <AnimatePresence mode="popLayout">
                  <div className={viewMode === 'grid' 
                    ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8" 
                    : "space-y-6"
                  }>
                    {displayedProducts.map(product => (
                      <motion.div
                        key={product._id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                      >
                        {viewMode === 'grid' ? (
                          <ProductCard product={product} onAddToCart={onAddToCart} />
                        ) : (
                          <div className="bg-card-bg p-6 rounded-sm border border-border-main flex flex-col md:flex-row items-center gap-8 group hover:shadow-lg transition-all">
                            <div className="w-32 h-32 bg-surface-hover rounded-sm p-4 flex-shrink-0">
                              <img src={product.image} className="w-full h-full object-contain" />
                            </div>
                            <div className="flex-grow text-center md:text-left">
                              <span className="text-[9px] font-black text-accent uppercase tracking-widest">{product.category}</span>
                              <h3 className="text-xl font-bold text-text-primary mt-1 mb-2 group-hover:text-accent transition-colors">{product.name}</h3>
                              <p className="text-text-secondary text-sm line-clamp-2 mb-4 font-medium">{product.description}</p>
                              <div className="flex items-center justify-center md:justify-start gap-4">
                                <div className="text-2xl font-black text-text-primary">{formatPrice(product.price)}</div>
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-status-star text-status-star" />
                                  <span className="text-xs font-bold">{product.rating}</span>
                                </div>
                              </div>
                            </div>
                            <button 
                              onClick={() => onAddToCart(product)}
                              className="btn-premium px-8 py-3 text-xs whitespace-nowrap"
                            >
                              Add To Cart
                            </button>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>

                {/* Pagination (Load More) */}
                {visibleCount < filteredProducts.length && (
                  <div className="text-center pt-8">
                    <button 
                      onClick={() => setVisibleCount(prev => prev + 6)}
                      className="px-12 py-4 bg-card-bg border-2 border-border-main text-text-primary rounded-sm font-black text-[10px] uppercase tracking-[0.2em] hover:bg-surface-hover hover:border-accent transition-all shadow-sm"
                    >
                      Load More Products
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-32 bg-card-bg rounded-sm border border-dashed border-border-main">
                <X className="h-12 w-12 text-border-main mx-auto mb-6" />
                <h3 className="text-2xl font-black text-text-primary mb-2 uppercase tracking-tight">No products found</h3>
                <p className="text-text-secondary text-sm">Try adjusting your filters or search term.</p>
              </div>
            )}
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default Shop;
