import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Star, ShoppingCart, CheckCircle, Package, PackageX,
  Truck, Shield, RotateCcw, Loader2, MessageSquare, Plus, Upload,
  Camera, Image as ImageIcon, Scale, Play, Activity, Cpu, Zap,
  Thermometer, Droplets, Info, ExternalLink, X, Wifi
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../../components/ui/ProductCard';
import { getProductById, getProducts, addProductReview } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useComparison } from '../../context/ComparisonContext';
import { useCart } from '../../hooks/useCart';
import { Skeleton, SkeletonText } from '../../components/common';
import SEO from '../../components/common/SEO';

const ProductDetail = () => {
  const { id } = useParams();
  const { cartItems, onAddToCart, onUpdateQuantity } = useCart();
  const { user, formatPrice } = useAuth();
  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeReviewTab, setActiveReviewTab] = useState('all');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviews, setReviews] = useState([]);
  const [showSim, setShowSim] = useState(false);
  const [simValue, setSimValue] = useState(25);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const trackRecentlyViewed = async (productData) => {
      // LocalStorage Tracking
      const recentlyViewed = JSON.parse(localStorage.getItem('recently_viewed') || '[]');
      const filtered = recentlyViewed.filter(p => p._id !== productData._id);
      const updated = [productData, ...filtered].slice(0, 10);
      localStorage.setItem('recently_viewed', JSON.stringify(updated));

      // Backend Tracking
      if (user) {
        try {
          const { addRecentlyViewed } = await import('../../services/api');
          await addRecentlyViewed(user._id, productData._id);
        } catch (err) {
          console.error("Failed to sync recently viewed:", err);
        }
      }
    };


    const fetchData = async () => {
      try {
        setLoading(true);
        const [productData, productsData] = await Promise.all([
          getProductById(id),
          getProducts()
        ]);
        setProduct(productData);
        setAllProducts(productsData);
        setReviews(productData.reviews || []);

        // Auto-update URL to pretty slug if user landed via an old ID link
        if (productData && productData.slug && id !== productData.slug) {
          window.history.replaceState(null, '', `/product/${productData.slug}`);
        }

        await trackRecentlyViewed(productData);
      } catch (err) {
        console.error("Error loading product detail:", err);
        setError("Failed to fetch product details.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Simulation Logic
  useEffect(() => {
    if (showSim) {
      const interval = setInterval(() => {
        setSimValue(prev => (parseFloat(prev) + (Math.random() * 2 - 1)).toFixed(1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showSim]);

  const handleReviewSubmit = async () => {
    if (!user) {
      alert("Please login to post a review");
      return;
    }
    const newReview = {
      user_id: user._id,
      user: user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.name || "User",
      rating: userRating,
      comment: reviewText,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      images: []
    };

    try {
      await addProductReview(id, newReview);
      setReviews([newReview, ...reviews]);
      setReviewText('');
      setShowReviewForm(false);
      const updatedProduct = await getProductById(id);
      setProduct(updatedProduct);
    } catch (error) {
      console.error("Error submitting review:", error);
    }
  };

  const relatedProducts = allProducts.filter(p => p.category === product?.category && p._id !== product?._id).slice(0, 4);

  if (loading) {
    return (
      <div className="pt-32 pb-32 min-h-screen bg-app-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card rounded-sm overflow-hidden flex flex-col lg:flex-row min-h-[600px]">
            <Skeleton className="w-full lg:w-1/2 min-h-[400px] lg:min-h-full rounded-none" />
            <div className="w-full lg:w-1/2 p-8 lg:p-12">
              <SkeletonText lines={1} className="w-24 mb-4" />
              <SkeletonText lines={1} className="w-3/4 h-10 mb-6" />
              <SkeletonText lines={3} className="w-full mb-10" />
              <SkeletonText lines={1} className="w-1/3 h-12 mb-8" />
              <SkeletonText lines={2} className="w-full mb-6" />
              <Skeleton className="w-full h-14" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-32 pb-32 min-h-screen bg-app-bg flex flex-col items-center justify-center">
        <h2 className="text-2xl font-black text-status-danger mb-4">Connection Failed</h2>
        <p className="text-text-secondary">{error}</p>
        <Link to="/shop" className="mt-8 text-accent hover:underline font-bold text-sm">Return to Shop</Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pt-48 pb-24 min-h-screen text-center flex flex-col items-center justify-center bg-app-bg">
        <h2 className="text-2xl font-bold text-text-primary mb-6 uppercase tracking-widest">Product Not Found</h2>
        <Link to="/shop" className="bg-accent/10 border border-accent/30 text-accent hover:bg-accent hover:text-white px-8 py-3 rounded-full transition-all font-bold text-sm uppercase">Back to Inventory</Link>
      </div>
    );
  }

  const cartItem = cartItems.find(item => item._id === product?._id);

  return (
    <div className="pt-24 pb-20 min-h-screen bg-app-bg relative">
      <SEO
        title={`${product.name} | IoTMart`}
        description={product.description?.substring(0, 150) || `Buy ${product.name} at IoTMart`}
      />

      {/* Dynamic Video Overlay */}
      <AnimatePresence>
        {showVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md"
          >
            <div className="w-full max-w-4xl bg-card-bg rounded-2xl shadow-2xl border border-border-main overflow-hidden flex flex-col max-h-[95vh]">
              {/* Header */}
              <div className="p-4 md:p-6 border-b border-border-main flex items-center justify-between bg-surface-hover/50">
                <div className="pr-4">
                  <h2 className="text-lg md:text-xl font-black uppercase tracking-tight text-text-primary line-clamp-1">{product.name}</h2>
                  <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-accent mt-1">Product Demonstration</p>
                </div>
                <button 
                  onClick={() => setShowVideo(false)} 
                  className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-surface hover:bg-status-danger hover:text-white border border-border-main rounded-xl text-text-secondary transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Video Container */}
              <div className="w-full aspect-video bg-black relative flex-shrink-0">
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${product.video_id || 'nL34zDTPkcs'}?autoplay=1&mute=1`}
                  title="Product Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Link to="/shop" className="inline-flex items-center gap-2 text-text-muted hover:text-accent transition-all duration-300 mb-6 group text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full hover:bg-surface-hover">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Inventory
        </Link>

        <div className="bg-card-bg/40 backdrop-blur-md rounded-2xl border border-border-main shadow-lg overflow-hidden relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">

            {/* Image Section */}
            <div className="bg-surface-hover/30 flex items-center justify-center p-8 md:p-12 relative overflow-hidden border-b lg:border-b-0 lg:border-r border-border-main/50 group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-accent-light)_0%,_transparent_50%)] opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none"></div>
              
              <div className="absolute top-4 left-4 z-20 flex flex-col gap-3">
                <button
                  onClick={() => setShowVideo(true)}
                  className="w-10 h-10 bg-card-bg/80 backdrop-blur-md border border-border-main rounded-xl flex items-center justify-center shadow-sm hover:bg-accent transition-all duration-300 text-text-primary hover:text-white group/btn"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span className="absolute left-12 bg-card-bg/90 backdrop-blur-md border border-border-main text-text-primary text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap shadow-sm pointer-events-none">Watch Related Video</span>
                </button>
              </div>

              <motion.img
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                src={product.image}
                alt={product.name}
                className="w-full max-w-[280px] h-auto object-contain relative z-10 mix-blend-multiply dark:mix-blend-normal transform transition-transform duration-500 group-hover:scale-105"
              />
            </div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="p-8 md:p-10 flex flex-col justify-center relative"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="text-[9px] font-bold text-accent uppercase tracking-wider px-2 py-0.5 bg-accent/10 rounded-full border border-accent/20">{product.category}</div>
                {product.inStock && (
                  <div className="flex items-center gap-1.5 text-status-success text-[9px] font-bold uppercase tracking-wider">
                    <div className="w-1.5 h-1.5 bg-status-success rounded-full animate-pulse" />
                    {product.stockQuantity !== undefined ? `${product.stockQuantity} Units In Stock` : 'In Stock'}
                  </div>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-secondary mb-5 tracking-tight leading-tight uppercase">{product.name}</h1>

              <div className="flex flex-wrap items-center gap-5 lg:gap-8 mb-6 p-4 bg-surface-hover/40 rounded-xl border border-border-main/50">
                <div className="text-3xl font-black text-text-primary tracking-tight">
                  {formatPrice(product.price)}
                </div>
                <div className="hidden sm:block h-8 w-[1px] bg-border-main" />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} className="h-3.5 w-3.5 fill-status-warning text-status-warning drop-shadow-[0_0_2px_rgba(217,119,6,0.3)]" />)}
                  </div>
                  <span className="text-[10px] font-bold text-text-muted mt-1">{reviews.length} Reviews</span>
                </div>
              </div>

              <p className="text-text-secondary text-sm mb-8 leading-relaxed max-w-xl">
                {product.description}
              </p>



              {/* Bulk Pricing */}
              <div className="mb-8 p-5 bg-surface-hover/30 rounded-xl border border-border-main/50">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="h-3 w-3 text-accent" />
                  <h4 className="text-[9px] font-bold text-text-primary uppercase tracking-wider">Volume Discount</h4>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 bg-card-bg/50 rounded-lg border border-border-main/30">
                    <p className="text-[9px] text-text-muted font-bold uppercase mb-1">Standard</p>
                    <p className="text-sm font-black text-text-primary">{formatPrice(product.price)}</p>
                  </div>
                  <div className="text-center p-2 bg-accent/5 rounded-lg border border-accent/20">
                    <p className="text-[9px] text-accent font-bold uppercase mb-1">10+ Units</p>
                    <p className="text-sm font-black text-accent">{formatPrice(product.price * 0.9)}</p>
                  </div>
                  <div className="text-center p-2 bg-status-success/5 rounded-lg border border-status-success/20">
                    <p className="text-[9px] text-status-success font-bold uppercase mb-1">50+ Units</p>
                    <p className="text-sm font-black text-status-success">{formatPrice(product.price * 0.8)}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 relative z-10 mt-auto">
                {(!product.inStock || (product.stockQuantity !== undefined && product.stockQuantity <= 0)) ? (
                  <>
                    <div className="flex-grow flex items-center gap-3 px-4 py-3 bg-status-danger/10 border border-status-danger/30 rounded-xl">
                      <PackageX className="h-5 w-5 text-status-danger flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-status-danger uppercase tracking-wider">Stock Exhausted</p>
                      </div>
                    </div>
                    <button
                      onClick={() => alert("You'll be notified as soon as this product is back in stock!")}
                      className="px-6 py-3 bg-card-bg/80 border border-border-main hover:border-accent text-text-secondary hover:text-accent rounded-xl transition-all flex items-center justify-center gap-2 font-bold text-xs uppercase shadow-sm"
                    >
                      🔔 Notify Me
                    </button>
                  </>
                ) : cartItem ? (
                  <div className="flex-grow flex items-center justify-between bg-card-bg/80 border border-border-main rounded-xl p-2 shadow-inner">
                    <button 
                      onClick={() => onUpdateQuantity(cartItem._id, cartItem.quantity - 1)}
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface hover:bg-surface-hover text-text-primary transition-colors border border-border-main/50"
                    >
                      -
                    </button>
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-sm font-black text-text-primary">{cartItem.quantity}</span>
                      <span className="text-[8px] font-bold text-text-muted uppercase tracking-wider">In Cart</span>
                    </div>
                    <button 
                      onClick={() => onUpdateQuantity(cartItem._id, cartItem.quantity + 1)}
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface hover:bg-surface-hover text-text-primary transition-colors border border-border-main/50"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    className="flex-grow bg-gradient-to-r from-accent to-secondary hover:from-accent-hover hover:to-secondary text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_5px_15px_rgba(2,132,199,0.2)] hover:shadow-[0_8px_20px_rgba(2,132,199,0.4)] transition-all hover:-translate-y-0.5"
                    onClick={() => onAddToCart(product)}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Add to Cart
                  </button>
                )}
              </div>
            </motion.div>

          </div>
        </div>

        {/* Live Simulation Overlay */}
        <AnimatePresence>
          {showSim && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-surface-dark/80 backdrop-blur-md"
            >
              <div className="card w-full max-w-2xl rounded-sm overflow-hidden shadow-2xl relative">
                <button onClick={() => setShowSim(false)} className="absolute top-6 right-6 p-2 card hover:bg-surface-hover rounded-full transition-all">
                  <X className="h-5 w-5" />
                </button>
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-accent/10 rounded-sm flex items-center justify-center mx-auto mb-6 text-accent">
                    <Activity className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-black text-text-primary uppercase tracking-tight mb-2">Live Sensor Simulation</h3>
                  <p className="text-text-muted text-sm mb-12">Virtualizing the technical capabilities of {product.name}</p>

                  <div className="flex items-center justify-center gap-16 mb-12">
                    <div className="text-center">
                      <div className="w-32 h-32 rounded-full border-8 border-border-subtle border-t-accent flex items-center justify-center animate-slow-spin mb-4">
                        <Thermometer className="h-10 w-10 text-accent animate-none" />
                      </div>
                      <p className="text-4xl font-black text-text-primary tracking-tighter">{simValue}°C</p>
                      <p className="label-caps mt-1">Temperature</p>
                    </div>
                    <div className="text-center">
                      <div className="w-32 h-32 rounded-full border-8 border-border-subtle border-t-accent flex items-center justify-center mb-4">
                        <Droplets className="h-10 w-10 text-accent" />
                      </div>
                      <p className="text-4xl font-black text-text-primary tracking-tighter">{(simValue * 1.5).toFixed(1)}%</p>
                      <p className="label-caps mt-1">Humidity</p>
                    </div>
                  </div>

                  <div className="p-6 bg-surface rounded-sm border border-border-subtle text-left">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-2 h-2 bg-status-success rounded-full animate-pulse" />
                      <span className="label-caps">Real-time Telemetry Active</span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      This module supports high-frequency sampling (up to 10Hz). The simulation above represents the logic integrated into the board's firmware for environmental monitoring.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>



        {/* Specifications & Technical Details */}
        <div className="mt-24 bg-card-bg/40 backdrop-blur-md rounded-2xl border border-border-main p-8 md:p-12 relative z-10">
          <div className="flex flex-col md:flex-row gap-12 lg:gap-24">
            
            {/* Left: Specs List */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-accent/10 rounded-lg border border-accent/20 text-accent">
                  <Info className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-black text-text-primary tracking-tight uppercase">Technical Specs</h2>
              </div>
              
              {product.specs && product.specs.length > 0 ? (
                <ul className="space-y-4">
                  {product.specs.map((spec, index) => (
                    <li key={index} className="flex items-start gap-3 group">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 group-hover:scale-150 transition-transform"></div>
                      <span className="text-text-primary font-medium text-sm leading-relaxed">{spec}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-text-muted text-sm italic">No specifications available for this product.</p>
              )}
            </div>

            {/* Right: Engineered Info */}
            <div className="flex-1 flex flex-col justify-center border-t md:border-t-0 md:border-l border-border-main/50 pt-10 md:pt-0 md:pl-12 lg:pl-24">
              <h2 className="text-2xl font-black text-text-primary tracking-tight uppercase mb-4">Engineered for <span className="text-accent">Precision</span></h2>
              <p className="text-text-secondary text-sm leading-relaxed max-w-lg mb-6">
                Every {product.name} undergoes a 24-hour stress test before it leaves our warehouse. Our engineering standard ensures that all electronic components are perfectly calibrated and reliable for your IoT projects.
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-status-success text-xs font-bold uppercase tracking-wider bg-status-success/10 px-3 py-1.5 rounded-full border border-status-success/20">
                   <CheckCircle className="w-4 h-4" /> Quality Assured
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-24">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 border-b border-border-main/50 pb-6 relative">
            <div className="absolute -bottom-[1px] left-0 w-24 h-[2px] bg-gradient-to-r from-accent to-transparent"></div>
            <div>
              <h2 className="text-2xl font-black text-text-primary uppercase">
                Customer <span className="text-accent">Reviews</span>
              </h2>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex gap-1 bg-surface py-1 px-2 rounded-full border border-border-main">
                  {[1, 2, 3, 4, 5].map(s => <Star key={s} className="h-3 w-3 fill-status-warning text-status-warning" />)}
                </div>
                <span className="text-sm font-bold text-text-primary">{product.rating}</span>
                <span className="text-[10px] font-bold text-text-muted uppercase px-2 py-0.5 bg-surface rounded-full">{reviews.length} Reviews</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {reviews.length === 0 ? (
                <div className="bg-card-bg/40 border border-border-main rounded-xl p-10 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
                  <Star className="w-8 h-8 text-border-subtle mb-4" />
                  <h3 className="text-lg font-bold text-text-primary mb-1">No reviews yet</h3>
                  <p className="text-sm text-text-secondary max-w-sm mx-auto">Be the first to review this product!</p>
                </div>
              ) : (
                reviews.map((rev, i) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: i * 0.1 }}
                    key={i}
                    className="group bg-card-bg/40 backdrop-blur-md border border-border-main/50 rounded-2xl p-6 hover:border-accent/30 transition-all duration-300 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/[0.02] to-accent/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-secondary p-[2px]">
                          <div className="w-full h-full rounded-full bg-card-bg flex items-center justify-center text-text-primary font-bold text-lg">
                            {rev.user.charAt(0)}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-text-primary text-sm">{rev.user}</h4>
                            {rev.verified_buyer && (
                              <span className="bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 rounded-full flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider border border-emerald-500/20">
                                <CheckCircle className="w-3 h-3" />
                                Verified
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-medium text-text-muted">{rev.date}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5 bg-surface px-2.5 py-1.5 rounded-full border border-border-main">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`h-3.5 w-3.5 ${s <= rev.rating ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_2px_rgba(251,191,36,0.4)]' : 'text-border-subtle'}`} />
                        ))}
                      </div>
                    </div>

                    <p className="text-text-secondary text-sm leading-relaxed mb-6 relative z-10">{rev.comment}</p>

                    <div className="flex gap-3 relative z-10">
                      {[1, 2].map(idx => (
                        <div key={idx} className="w-16 h-16 rounded-2xl bg-surface-hover/30 border border-border-main/50 flex items-center justify-center overflow-hidden hover:border-accent hover:bg-surface-hover/60 cursor-pointer transition-colors shadow-inner">
                          <ImageIcon className="h-5 w-5 text-text-muted/40" />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )))}
            </div>

            <div className="space-y-6">
              <div className="bg-card-bg/40 backdrop-blur-xl border border-border-main rounded-3xl p-8 sticky top-32 shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
                <h4 className="text-lg font-black text-text-primary mb-8 tracking-tight flex items-center gap-3 uppercase">
                  <div className="p-2 bg-status-warning/10 text-status-warning rounded-lg border border-status-warning/20">
                    <Star className="w-5 h-5" />
                  </div>
                  Rating Breakdown
                </h4>

                <div className="space-y-4">
                  {[5, 4, 3, 2, 1].map(s => {
                    const count = reviews.filter(r => Math.round(r.rating) === s).length;
                    const percentage = reviews.length > 0 ? `${Math.round((count / reviews.length) * 100)}%` : '0%';

                    return (
                      <div key={s} className="flex items-center gap-3 group">
                        <div className="flex items-center gap-1 w-8">
                          <span className="text-xs font-bold text-text-primary">{s}</span>
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        </div>

                        <div className="flex-grow h-2.5 bg-border-main/50 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: percentage }}
                            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                            className={`h-full rounded-full ${s >= 4 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : s === 3 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-rose-400 to-rose-500'}`}
                          />
                        </div>

                        <span className="text-xs font-bold text-text-muted w-10 text-right group-hover:text-text-primary transition-colors">
                          {percentage}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-10 p-6 bg-surface-hover/30 rounded-2xl border border-border-main shadow-inner relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-accent to-secondary"></div>
                  <p className="text-[10px] font-black text-text-primary mb-2 uppercase tracking-[0.2em]">Expert Verdict</p>
                  <p className="text-sm text-text-secondary leading-relaxed font-medium">98% of buyers recommend this product for professional IoT deployments.</p>
                </div>
              </div>
            </div>
          </div>
          {/* END PREMIUM REVIEWS SECTION */}
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-24">
            <div className="flex justify-between items-end mb-10 border-b border-border-main pb-4">
              <div>
                <p className="text-accent text-[9px] font-bold uppercase tracking-wider mb-2">You Might Need</p>
                <h2 className="text-2xl font-black text-text-primary uppercase">Compatible <span className="text-accent">Add-ons</span></h2>
              </div>
              <Link to="/shop" className="text-[10px] font-bold text-accent uppercase hover:underline">View All</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map(p => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
