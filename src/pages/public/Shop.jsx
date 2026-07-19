import React, { useState, useEffect } from 'react';
import ProductCard from '../../components/ui/ProductCard';
import { Filter, Search, ChevronDown, SlidersHorizontal, Loader2, Grid, List as ListIcon, Star, Wifi, Bluetooth, Zap, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getProducts } from '../../services/api';
import { SkeletonGrid } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../hooks/useCart';
import { Link } from 'react-router-dom';
import SEO from '../../components/common/SEO';

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
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        const shuffled = [...data].sort(() => 0.5 - Math.random());
        setProducts(shuffled);
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
    <div className="pt-24 pb-24 min-h-screen bg-app-bg relative">
      <SEO title="Shop Components | IoTMart" description="Browse our extensive inventory of IoT hardware, microcontrollers, and sensors." />
      
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-accent/5 to-transparent pointer-events-none"></div>
      
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Premium Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-border-main pb-10"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-accent/20">
               <Zap className="w-3 h-3 fill-current"/> Hardware Catalog
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-text-primary tracking-tighter uppercase leading-[0.9]">
              Explore <br className="hidden md:block"/><span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary">Inventory.</span>
            </h1>
          </div>
          
          <div className="flex bg-card-bg/80 backdrop-blur-xl border border-border-main p-1.5 rounded-2xl shadow-sm">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-3 rounded-xl transition-all duration-300 ${viewMode === 'grid' ? 'bg-gradient-to-br from-accent to-secondary text-white shadow-lg shadow-accent/25' : 'text-text-muted hover:text-accent hover:bg-surface-hover'}`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-3 rounded-xl transition-all duration-300 ${viewMode === 'list' ? 'bg-gradient-to-br from-accent to-secondary text-white shadow-lg shadow-accent/25' : 'text-text-muted hover:text-accent hover:bg-surface-hover'}`}
            >
              <ListIcon className="h-5 w-5" />
            </button>
          </div>
        </motion.div>

        <div className="bg-card-bg/80 backdrop-blur-2xl border border-border-main rounded-3xl p-6 lg:p-10 shadow-2xl relative flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none rounded-3xl"></div>
          
          
          {/* Futuristic Sidebar Filters */}
          <motion.aside 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-3 lg:sticky lg:top-32 space-y-4 lg:space-y-8 self-start w-full relative z-10"
          >
            {/* Mobile Filter Toggle */}
            <button 
              onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
              className="lg:hidden w-full flex items-center justify-between bg-card-bg/80 backdrop-blur-xl p-5 rounded-2xl border border-border-main text-sm font-black uppercase tracking-[0.2em] text-text-primary shadow-sm hover:border-accent transition-all group"
            >
              <div className="flex items-center gap-3">
                 <Filter className="h-5 w-5 text-accent group-hover:scale-110 transition-transform" />
                 {isMobileFiltersOpen ? 'Hide Filters' : 'Show Filters'}
              </div>
              <ChevronDown className={`h-4 w-4 text-text-muted transition-transform duration-300 ${isMobileFiltersOpen ? 'rotate-180' : ''}`} />
            </button>

            <div className={`space-y-8 transition-all duration-300 origin-top ${isMobileFiltersOpen ? 'block animate-in fade-in slide-in-from-top-4' : 'hidden'} lg:block lg:animate-none`}>
              {/* Category Filter */}
            <div className="bg-card-bg/50 backdrop-blur-xl p-8 rounded-3xl border border-border-main shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>
              <h3 className="text-text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6 flex items-center justify-between">
                Categories <ChevronDown className="h-3 w-3 text-text-muted" />
              </h3>
              <div className="space-y-1 relative z-10">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`w-full text-left px-5 py-3 rounded-xl text-xs font-bold transition-all duration-300 ${
                      activeCategory === category 
                        ? 'bg-accent/10 border-accent/30 border text-accent shadow-[0_0_15px_rgba(2,132,199,0.1)]' 
                        : 'border border-transparent text-text-secondary hover:text-accent hover:bg-surface-hover hover:border-border-main'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Price & Specs */}
            <div className="bg-card-bg/50 backdrop-blur-xl p-8 rounded-3xl border border-border-main shadow-sm space-y-10 relative overflow-hidden">
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>
              
              {/* Price Range */}
              <div className="relative z-10">
                <h3 className="text-text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6">Price Limit</h3>
                <div className="relative pt-1">
                  <input 
                    type="range" 
                    min="0" 
                    max="1000" 
                    value={priceRange} 
                    onChange={(e) => setPriceRange(parseInt(e.target.value))}
                    className="w-full h-2 bg-border-main rounded-full appearance-none cursor-pointer accent-accent"
                  />
                  <div className="flex justify-between mt-4">
                    <span className="text-[10px] font-bold text-text-muted px-2 py-1 bg-surface-hover rounded-md border border-border-main">{formatPrice(0)}</span>
                    <span className="text-[10px] font-black text-accent px-2 py-1 bg-accent/10 rounded-md border border-accent/20">{formatPrice(priceRange)}</span>
                  </div>
                </div>
              </div>

              {/* Connectivity Filter */}
              <div className="relative z-10">
                <h3 className="text-text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6">Connectivity Protocols</h3>
                <div className="flex flex-wrap gap-2">
                  {connectivityOptions.map(tech => (
                    <button
                      key={tech}
                      onClick={() => toggleConnectivity(tech)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-bold border transition-all duration-300 ${
                        selectedConnectivity.includes(tech)
                          ? 'bg-accent text-white border-accent shadow-[0_5px_15px_rgba(2,132,199,0.3)]'
                          : 'bg-transparent text-text-secondary border-border-main hover:border-accent/50 hover:bg-accent/5'
                      }`}
                    >
                      {tech}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ratings Filter */}
              <div className="relative z-10">
                <h3 className="text-text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6">Minimum Rating</h3>
                <div className="space-y-2">
                  {[4, 3, 2].map(star => (
                    <button 
                      key={star}
                      onClick={() => setSelectedRating(selectedRating === star ? 0 : star)}
                      className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-300 border ${
                        selectedRating === star 
                          ? 'bg-accent/10 border-accent/30 shadow-inner' 
                          : 'bg-transparent border-transparent hover:bg-surface-hover hover:border-border-main'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selectedRating === star ? 'border-accent bg-accent' : 'border-border-main bg-card-bg'}`}>
                        {selectedRating === star && <div className="w-2 h-2 bg-white rounded-sm"></div>}
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`h-3.5 w-3.5 ${s <= star ? 'fill-status-warning text-status-warning drop-shadow-[0_0_5px_rgba(217,119,6,0.5)]' : 'text-border-main'}`} />
                        ))}
                      </div>
                      <span className="text-[10px] font-bold text-text-secondary ml-auto">& Up</span>
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
                className="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] text-status-danger hover:text-white hover:bg-status-danger rounded-xl transition-all border border-status-danger/20 hover:shadow-[0_5px_15px_rgba(220,38,38,0.3)] relative z-10"
              >
                Reset Parameters
              </button>
            </div>
            </div>
          </motion.aside>

          {/* Main Content Area */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-9 space-y-10 relative z-10"
          >
            {/* Search Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-4 md:p-2 bg-card-bg/50 backdrop-blur-xl rounded-2xl border border-border-main shadow-sm relative z-20">
              <div className="relative w-full md:w-[450px]">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
                <input 
                  type="text" 
                  placeholder="Search microcontrollers, sensors..." 
                  className="w-full pl-14 pr-5 py-4 md:py-3 bg-surface-hover/50 border-none rounded-xl text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all placeholder:text-text-muted/70"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-4 px-6 py-2">
                <SlidersHorizontal className="w-4 h-4 text-text-muted" />
                <select 
                  className="bg-transparent border-none text-text-primary text-[10px] font-black uppercase tracking-[0.1em] focus:outline-none cursor-pointer text-accent"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="default">Sort: Featured</option>
                  <option value="popularity">Sort: Most Popular</option>
                  <option value="newest">Sort: New Arrivals</option>
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
              <div className="space-y-16">
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
                        transition={{ duration: 0.3 }}
                      >
                        {viewMode === 'grid' ? (
                          <ProductCard product={product} onAddToCart={onAddToCart} />
                        ) : (
                          <Link to={`/product/${product.slug || product._id}`} className="bg-card-bg/80 backdrop-blur-md p-6 rounded-3xl border border-border-main flex flex-col md:flex-row items-center gap-8 group hover:border-accent/50 hover:shadow-[0_10px_30px_rgba(2,132,199,0.1)] transition-all block relative overflow-hidden">
                            
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/5 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform pointer-events-none"></div>

                            <div className="w-36 h-36 bg-surface-hover rounded-2xl p-4 flex-shrink-0 relative">
                              <img src={product.image} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform duration-500" alt={product.name} />
                              {(!product.inStock || product.stockQuantity <= 0) && (
                                <div className="absolute top-2 right-2 px-2 py-1 bg-status-danger/10 text-status-danger text-[9px] font-black uppercase rounded">Out</div>
                              )}
                            </div>
                            
                            <div className="flex-grow text-center md:text-left z-10">
                              <span className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">{product.category}</span>
                              <h3 className="text-2xl font-bold text-text-primary mt-2 mb-3 group-hover:text-accent transition-colors">{product.name}</h3>
                              <p className="text-text-secondary text-sm line-clamp-2 mb-5 font-medium max-w-2xl">{product.description}</p>
                              
                              <div className="flex items-center justify-center md:justify-start gap-6">
                                <div className="text-3xl font-black text-text-primary">{formatPrice(product.price)}</div>
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-hover rounded-full">
                                  <Star className="h-4 w-4 fill-status-warning text-status-warning drop-shadow-[0_0_5px_rgba(217,119,6,0.5)]" />
                                  <span className="text-xs font-bold text-text-primary">{product.rating}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="z-10">
                              {(!product.inStock || (product.stockQuantity !== undefined && product.stockQuantity <= 0)) ? (
                                <button 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    alert("We'll notify you when this product is back in stock!");
                                  }}
                                  className="px-8 py-4 bg-surface-hover hover:bg-border-main text-text-primary border border-border-main rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap shadow-sm"
                                >
                                  Notify Me
                                </button>
                              ) : (
                                <button 
                                  onClick={(e) => { e.preventDefault(); onAddToCart(product); }}
                                  className="btn-premium px-10 py-4 text-xs whitespace-nowrap shadow-lg shadow-accent/20"
                                >
                                  Add To Cart
                                </button>
                              )}
                            </div>
                          </Link>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>

                {/* Pagination (Load More) */}
                {visibleCount < filteredProducts.length && (
                  <div className="text-center pt-8 border-t border-border-main">
                    <button 
                      onClick={() => setVisibleCount(prev => prev + 6)}
                      className="px-12 py-5 bg-card-bg/50 backdrop-blur-md border border-accent/30 text-accent rounded-full font-black text-[10px] uppercase tracking-[0.2em] hover:bg-accent hover:text-white transition-all shadow-[0_0_20px_rgba(2,132,199,0.15)] hover:shadow-[0_0_30px_rgba(2,132,199,0.3)]"
                    >
                      Load More Modules
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-40 bg-card-bg/50 backdrop-blur-md rounded-3xl border border-dashed border-border-main shadow-inner relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-accent-light)_0%,_transparent_60%)] opacity-30"></div>
                <div className="relative z-10">
                  <div className="w-24 h-24 bg-surface-hover rounded-full flex items-center justify-center mx-auto mb-8 border border-border-main">
                    <X className="h-10 w-10 text-text-muted" />
                  </div>
                  <h3 className="text-4xl font-black text-text-primary mb-4 uppercase tracking-tighter">No hardware found</h3>
                  <p className="text-text-secondary text-lg font-medium max-w-md mx-auto">The requested components could not be located in our current inventory scan. Adjust your filters to resume search.</p>
                  <button 
                    onClick={() => {
                      setActiveCategory('All');
                      setSearchTerm('');
                      setPriceRange(1000);
                      setSelectedRating(0);
                      setSelectedConnectivity([]);
                    }}
                    className="mt-10 px-8 py-3 bg-text-primary text-card-bg rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-accent transition-colors shadow-lg"
                  >
                    Reset System Scan
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default Shop;
