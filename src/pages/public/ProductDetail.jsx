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
  const { onAddToCart } = useCart();
  const { user, formatPrice } = useAuth();
  const { addToCompare, comparisonList } = useComparison();
  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReviewTab, setActiveReviewTab] = useState('all');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviews, setReviews] = useState([]);
  const [showSim, setShowSim] = useState(false);
  const [simValue, setSimValue] = useState(25);
  const [showVideo, setShowVideo] = useState(false);

  const isInCompare = comparisonList.some(p => p._id === id);

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

        await trackRecentlyViewed(productData);
      } catch (error) {
        console.error("Error loading product detail:", error);
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

  if (!product) {
    return (
      <div className="pt-48 pb-24 min-h-screen text-center">
        <h2 className="text-2xl font-bold text-text-primary mb-6 uppercase">Product Not Found</h2>
        <Link to="/shop" className="btn-premium px-8">Back to Shop</Link>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-32 min-h-screen bg-app-bg">
      <SEO
        title={`${product.name} | IoTMart`}
        description={product.description?.substring(0, 150) || `Buy ${product.name} at IoTMart. High-quality IoT components.`}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/shop" className="inline-flex items-center gap-2 text-text-secondary hover:text-accent transition-all mb-8 group text-[10px] font-black uppercase tracking-widest">
          <ArrowLeft className="h-4 w-4" /> Back to Shop
        </Link>

        <div className="card rounded-sm overflow-hidden relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">

            {/* Image Section with Video/Sim Overlays */}
            <div className="bg-surface-hover flex items-center justify-center p-8 md:p-12 relative overflow-hidden border-b lg:border-b-0 lg:border-r border-border-main">
              <div className="absolute top-8 left-8 z-20 flex flex-col gap-3">
                <button
                  onClick={() => setShowVideo(true)}
                  className="w-12 h-12 bg-card-bg rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all text-accent group"
                >
                  <Play className="h-5 w-5 fill-current" />
                  <span className="absolute left-14 bg-text-primary text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Watch Demo</span>
                </button>
                {/* <button 
                  onClick={() => setShowSim(true)}
                  className="w-12 h-12 bg-accent rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all text-white group"
                >
                  <Activity className="h-5 w-5" />
                  <span className="absolute left-14 bg-text-primary text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Live Sim</span>
                </button> */}
              </div>

              <motion.img
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                src={product.image}
                alt={product.name}
                className="w-full max-w-sm h-auto object-contain relative z-10 drop-shadow-2xl"
              />

              {/* Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 to-transparent"></div>
            </div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-card-bg relative"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="text-[10px] font-black text-accent uppercase tracking-widest px-3 py-1 bg-accent/5 rounded-sm border border-accent/10">{product.category}</div>
                {product.inStock && (
                  <div className="flex items-center gap-1.5 text-status-success text-[10px] font-black uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 bg-status-success rounded-full animate-pulse" />
                    Ready to Ship {product.stockQuantity !== undefined ? `(${product.stockQuantity} Available)` : ''}
                  </div>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl font-black text-text-primary mb-6 tracking-tighter uppercase leading-[0.9]">{product.name}</h1>

              <div className="flex items-center gap-8 mb-10">
                <div className="text-5xl font-black text-text-primary tracking-tighter">
                  {formatPrice(product.price)}
                </div>
                <div className="h-10 w-[1px] bg-border-subtle" />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} className="h-3 w-3 fill-status-star text-status-star" />)}
                  </div>
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-1">{product.reviews_count} Reviews</span>
                </div>
              </div>

              <p className="text-text-secondary text-lg mb-12 leading-relaxed font-medium">
                {product.description}
              </p>

              {/* IoT Capabilities */}
              <div className="grid grid-cols-2 gap-4 mb-10">
                {[
                  { icon: Cpu, label: 'Dual Core', val: '240MHz' },
                  { icon: Zap, label: 'Energy', val: 'Ultra-Low' },
                  { icon: Wifi, label: 'Network', val: 'Wi-Fi/BT' },
                  { icon: Shield, label: 'Protocol', val: 'Secure MQTT' },
                ].map((cap, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-surface rounded-sm border border-border-subtle">
                    <div className="w-10 h-10 card rounded-sm flex items-center justify-center text-accent shadow-sm">
                      <cap.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-text-muted uppercase tracking-widest">{cap.label}</p>
                      <p className="text-xs font-bold text-text-primary">{cap.val}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bulk Pricing */}
              <div className="mb-12 p-6 bg-surface rounded-sm border border-border-main">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-4 w-4 text-accent" />
                  <h4 className="text-[10px] font-black text-text-primary uppercase tracking-[0.2em]">Bulk Discount Tiers</h4>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-[8px] text-text-muted font-bold uppercase mb-1">Standard</p>
                    <p className="text-sm font-black text-text-primary">{formatPrice(product.price)}</p>
                  </div>
                  <div className="text-center border-x border-border-subtle">
                    <p className="text-[8px] text-accent font-bold uppercase mb-1">10+ Units</p>
                    <p className="text-sm font-black text-accent">{formatPrice(product.price * 0.9)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[8px] text-status-success font-bold uppercase mb-1">50+ Units</p>
                    <p className="text-sm font-black text-status-success">{formatPrice(product.price * 0.8)}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                {(!product.inStock || (product.stockQuantity !== undefined && product.stockQuantity <= 0)) ? (
                  <>
                    {/* Out of Stock State */}
                    <div className="flex-grow flex items-center gap-4 px-6 py-5 bg-status-danger-bg border-2 border-status-danger/30 rounded-sm">
                      <PackageX className="h-5 w-5 text-status-danger flex-shrink-0" />
                      <div>
                        <p className="text-sm font-black text-status-danger uppercase tracking-widest">Stock Exhausted</p>
                        <p className="text-[10px] text-text-muted font-bold">This product is currently unavailable</p>
                      </div>
                    </div>
                    <button
                      onClick={() => alert("You'll be notified as soon as this product is back in stock!")}
                      className="px-8 py-5 border-2 border-border-subtle text-text-secondary hover:border-accent hover:text-accent rounded-sm transition-all flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest"
                    >
                      🔔 Notify Me
                    </button>
                  </>
                ) : (
                  <button
                    className="flex-grow btn-premium py-5 text-sm font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3"
                    onClick={() => onAddToCart(product)}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    Deploy to Cart
                  </button>
                )}
                <button
                  onClick={() => addToCompare(product)}
                  className={`px-8 py-5 border-2 rounded-sm transition-all flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest ${isInCompare
                      ? 'border-accent bg-accent text-text-inverse shadow-lg shadow-accent/20'
                      : 'border-border-subtle text-text-secondary hover:border-accent hover:text-accent'
                    }`}
                >
                  <Scale className="h-5 w-5" />
                  {isInCompare ? 'Comparing' : 'Compare Specs'}
                </button>
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

        {/* Video Overlay */}
        <AnimatePresence>
          {showVideo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-surface-dark/90 backdrop-blur-xl"
            >
              <button onClick={() => setShowVideo(false)} className="absolute top-10 right-10 text-white hover:text-accent transition-all">
                <X className="h-10 w-10" />
              </button>
              <div className="w-full max-w-5xl aspect-video bg-black rounded-sm overflow-hidden shadow-2xl border border-card-bg/10">
                {/* Simulated Video Placeholder */}
                <div className="w-full h-full flex flex-col items-center justify-center text-white relative">
                  <div className="absolute inset-0">
                    <img src={product.image} className="w-full h-full object-cover opacity-20 blur-2xl" />
                  </div>
                  <Play className="h-24 w-24 mb-8 text-accent animate-pulse relative z-10" />
                  <h2 className="text-3xl font-black uppercase tracking-tighter relative z-10">{product.name} Video Showcase</h2>
                  <p className="text-white/60 font-bold uppercase tracking-[0.3em] text-xs mt-4 relative z-10">4K Ultra HD Demonstration</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Specifications & Technical Details */}
        <div className="mt-32 grid grid-cols-1 lg:grid-cols-2 gap-20">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <Info className="h-6 w-6 text-accent" />
              <h2 className="text-3xl font-black text-text-primary tracking-tighter uppercase">Technical Specs</h2>
            </div>
            <div className="bg-card-bg rounded-sm border border-border-main overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <tbody>
                  {product.specs.map((spec, index) => (
                    <tr key={index} className={index !== product.specs.length - 1 ? "border-b border-border-subtle" : ""}>
                      <td className="py-5 px-8 text-text-muted text-[10px] font-black uppercase tracking-widest bg-surface-hover w-1/3">Data Point {index + 1}</td>
                      <td className="py-5 px-8 text-text-primary font-bold text-sm tracking-tight">{spec}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col justify-center space-y-8">
            <h2 className="text-4xl font-black text-text-primary tracking-tighter uppercase">Engineered for <span className="text-accent">Precision</span></h2>
            <p className="text-text-secondary text-lg leading-relaxed font-medium">
              Every {product.name} undergoes a 24-hour stress test before it leaves our warehouse. Our engineers ensure that the I/O pins, ADC converters, and wireless radios are perfectly calibrated.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { title: 'Datasheet PDF', sub: 'Technical Documentation', icon: ExternalLink },
                { title: 'GitHub Repo', sub: 'Driver & Sample Code', icon: ExternalLink },
              ].map((link, i) => (
                <div key={i} className="p-6 card rounded-sm hover:border-accent transition-all cursor-pointer group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-surface rounded-sm group-hover:bg-accent group-hover:text-text-inverse transition-all">
                      <link.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <h4 className="text-sm font-black text-text-primary uppercase tracking-tight">{link.title}</h4>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">{link.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-40">
          {/* PREMIUM REVIEWS SECTION */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16 border-b border-border-main/50 pb-8 relative">
            <div className="absolute -bottom-[1px] left-0 w-32 h-[2px] bg-gradient-to-r from-accent to-transparent"></div>
            <div>
              <h2 className="text-4xl font-black text-text-primary tracking-tighter">
                Customer <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-purple-500">Reviews</span>
              </h2>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex gap-1 bg-surface py-1.5 px-3 rounded-full border border-border-main shadow-sm">
                  {[1, 2, 3, 4, 5].map(s => <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                </div>
                <span className="text-sm font-bold text-text-primary">{product.rating} Average Rating</span>
                <span className="text-xs font-medium text-text-muted px-2 py-0.5 bg-surface rounded-full">{product.reviews_count} Reviews</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-6">
              {reviews.length === 0 ? (
                <div className="bg-card-bg border border-border-main border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                  <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mb-6">
                    <Star className="w-10 h-10 text-border-subtle" />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-2">No reviews yet</h3>
                  <p className="text-text-secondary max-w-md mx-auto mb-8">This product doesn't have any reviews yet. Buy this product to be the first one to review it!</p>
                </div>
              ) : (
                reviews.map((rev, i) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: i * 0.1 }}
                    key={i}
                    className="group bg-card-bg border border-border-main/50 hover:border-accent/30 rounded-2xl p-8 shadow-sm hover:shadow-xl hover:shadow-accent/5 transition-all duration-300 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/[0.02] to-accent/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-purple-500 p-[2px]">
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
                        <div key={idx} className="w-16 h-16 rounded-xl bg-surface border border-border-main flex items-center justify-center overflow-hidden hover:border-accent cursor-pointer transition-colors">
                          <ImageIcon className="h-5 w-5 text-text-muted/40" />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )))}
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-b from-surface to-card-bg border border-border-main rounded-2xl p-8 sticky top-32 shadow-sm">
                <h4 className="text-base font-bold text-text-primary mb-8 tracking-tight flex items-center gap-2">
                  <Star className="w-5 h-5 text-accent" />
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

                <div className="mt-10 p-5 bg-card-bg rounded-xl border border-border-main shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-accent"></div>
                  <p className="text-xs font-bold text-text-primary mb-1 uppercase tracking-wider">Expert Verdict</p>
                  <p className="text-sm text-text-secondary leading-relaxed">98% of buyers recommend this product for professional IoT deployments.</p>
                </div>
              </div>
            </div>
          </div>
          {/* END PREMIUM REVIEWS SECTION */}
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-40">
            <div className="flex justify-between items-end mb-16 border-b border-border-main pb-8">
              <div>
                <p className="text-accent text-[10px] font-black uppercase tracking-[0.3em] mb-4">You Might Need</p>
                <h2 className="text-3xl font-black text-text-primary tracking-tighter uppercase">Compatible <span className="text-accent">Add-ons</span></h2>
              </div>
              <Link to="/shop" className="text-[10px] font-black text-accent uppercase tracking-widest hover:underline">View All</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
              {relatedProducts.map(p => (
                <ProductCard key={p._id} product={p} onAddToCart={onAddToCart} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
