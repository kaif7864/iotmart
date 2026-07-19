import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Cpu, Zap, ShieldCheck, Loader2, Star, CheckCircle, Smartphone, Home as HomeIcon, Shield, Layers, Globe, BrainCircuit, Sparkles, Truck, Headset, ShoppingCart, ChevronRight, ChevronLeft, Heart, CheckCircle2, Quote } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from '../../components/ui/ProductCard';
import Newsletter from '../../components/feedback/Newsletter';
import { getProducts, getAiCuratedProducts, postAiChatProducts, getGlobalReviews } from '../../services/api';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../context/AuthContext';
import { SkeletonGrid } from '../../components/common';
import SEO from '../../components/common/SEO';

const Home = () => {
  const { onAddToCart } = useCart();
  const { formatPrice } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [aiProducts, setAiProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const [realReviews, setRealReviews] = useState([]);

  // AI Chat States
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { 
      type: 'ai', 
      text: "Hello! I'm your hardware engineering assistant. Are you building a smart home hub, a drone, or an industrial sensor network? Describe your project to me!", 
      products: [] 
    }
  ]);
  const chatEndRef = useRef(null);

  // Scroll to bottom of chat only when new messages are added
  useEffect(() => {
    if (chatEndRef.current && chatHistory.length > 1) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  // Force top scroll on mount to override browser scroll restoration
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  const hasAutoTyped = useRef(false);
  const chatSectionRef = useRef(null);
  const isChatInView = useInView(chatSectionRef, { once: true, amount: 0.3 });

  useEffect(() => {
    if (hasAutoTyped.current || !isChatInView) return;
    hasAutoTyped.current = true;
    
    const randomPrompts = [
      "I want to build a smart weather station",
      "I need parts for an autonomous drone",
      "I want to build an automated plant watering system",
      "I want to build a voice-controlled home hub",
      "Recommend components for a smart fingerprint door lock",
      "What do I need for a motion-activated security camera?",
      "I'm building a self-balancing robot with Arduino",
      "Components for an RFID attendance system?",
      "I want to create an industrial temperature monitor",
      "Suggest parts for a smart hydroponics setup"
    ];
    
    // Ensure we don't get the same prompt twice in a row on refresh
    const lastPrompt = sessionStorage.getItem('lastAiPrompt');
    let availablePrompts = randomPrompts;
    if (lastPrompt && randomPrompts.length > 1) {
      availablePrompts = randomPrompts.filter(p => p !== lastPrompt);
    }
    const selectedPrompt = availablePrompts[Math.floor(Math.random() * availablePrompts.length)];
    sessionStorage.setItem('lastAiPrompt', selectedPrompt);
    
    let i = 0;
    // Wait 1 second before starting to type
    setTimeout(() => {
      const typingInterval = setInterval(() => {
        setChatInput(selectedPrompt.substring(0, i + 1));
        i++;
        if (i === selectedPrompt.length) {
          clearInterval(typingInterval);
          setTimeout(() => {
             handleChatSubmit(null, selectedPrompt);
          }, 800);
        }
      }, 50);
    }, 1000);
  }, [isChatInView]);

  const handleChatSubmit = async (e, forceText = null) => {
    e?.preventDefault();
    const userMessage = forceText || chatInput.trim();
    if (!userMessage || isChatLoading) return;

    setChatInput("");
    setChatHistory(prev => [...prev, { type: 'user', text: userMessage }]);
    setIsChatLoading(true);

    try {
      const response = await postAiChatProducts(userMessage);
      setChatHistory(prev => [...prev, {
        type: 'ai',
        text: response.response,
        products: response.products
      }]);
    } catch (error) {
      setChatHistory(prev => [...prev, {
        type: 'ai',
        text: "I encountered an error analyzing your request. Please try again.",
        products: []
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const heroSlides = [
    {
      title: "The Future of <span class='text-accent'>IoT Development</span>",
      subtitle: "High-performance microcontrollers, sensors, and hardware modules for industrial innovators.",
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200",
      cta: "Shop Now",
      link: "/shop",
      badge: "Summer Sale: 20% Off"
    },
    {
      title: "Build Your <span class='text-accent'>Smart Home</span> Today",
      subtitle: "Everything you need to automate your world. From ESP32 to relay modules.",
      image: "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&q=80&w=1200",
      cta: "Explore Kits",
      link: "/shop?category=Starter Kits",
      badge: "New Arrival: Starter Kits"
    },
    {
      title: "Genuine <span class='text-accent'>Sensors</span> & Modules",
      subtitle: "Industrial grade accuracy for your mission-critical monitoring projects.",
      image: "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&q=80&w=1200",
      cta: "View Sensors",
      link: "/shop?category=Sensors",
      badge: "Premium Quality"
    }
  ];

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const data = await getProducts();
        
        // 1. Look for admin explicitly selected editor's choice
        let heroProduct = data.find(p => p.isEditorChoice || p.isFeatured);
        let heroBadge = "Editors' Choice";
        
        // 2. If no admin choice, pick the highest rated product
        if (!heroProduct && data.length > 0) {
          heroProduct = [...data].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
          heroBadge = "Highest Rated";
        }
        
        if (heroProduct) {
          // Remove hero product from the rest and shuffle the remaining
          const remaining = data.filter(p => p._id !== heroProduct._id);
          const shuffled = [...remaining].sort(() => 0.5 - Math.random());
          
          // Set final array with hero product at index 0
          setFeaturedProducts([{ ...heroProduct, heroBadge }, ...shuffled.slice(0, 3)]);
        } else {
          setFeaturedProducts([]);
        }
        
        // Fetch AI Curated Products
        try {
            const aiData = await getAiCuratedProducts();
            setAiProducts(aiData);
        } catch (e) {
            console.error("Failed to load AI products", e);
        }

        // Fetch Real Reviews
        try {
            const reviewsData = await getGlobalReviews();
            if (reviewsData && reviewsData.length > 0) {
              setRealReviews(reviewsData);
            } else {
              // Fallback reviews if DB is empty
              setRealReviews([
                { name: "Rahul Sharma", role: "Verified Buyer", text: "IoTMart has the most reliable DHT22 sensors. Fast delivery and genuine parts every time.", avatar: "R", rating: 5, product_name: "DHT22 Temp Sensor" },
                { name: "Sarah Chen", role: "IoT Enthusiast", text: "The Smart Home Starter Kit is perfect for beginners. The documentation link was very helpful.", avatar: "S", rating: 5, product_name: "Smart Home Kit" },
                { name: "John Doe", role: "Verified Buyer", text: "Best place for bulk orders of ESP32 modules. Competitive pricing and great support.", avatar: "J", rating: 4, product_name: "ESP32 Dev Board" },
              ]);
            }
        } catch (e) {
            console.error("Failed to load reviews", e);
        }
        
      } catch (error) {
        console.error("Error loading featured products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();

    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const categories = [
    { name: 'Microcontrollers', icon: Cpu, count: '120+ Products', color: 'bg-surface-hover text-accent' },
    { name: 'Sensors', icon: Zap, count: '85+ Products', color: 'bg-surface-hover text-accent' },
    { name: 'Smart Home', icon: HomeIcon, count: '40+ Products', color: 'bg-surface-hover text-accent' },
    { name: 'SBCs', icon: Layers, count: '15+ Products', color: 'bg-surface-hover text-accent' },
  ];

  return (
    <div className="pt-28 md:pt-32 overflow-x-hidden">
      <SEO
        title="IoTMart | Next-Gen Electronic Components & IoT Hardware"
        description="Discover premium microcontrollers, sensors, and smart home modules. High-performance hardware for industrial innovators and hobbyists."
      />
      {/* Premium Box Carousel Hero Section */}
      <section className="bg-app-bg pt-10 pb-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-card-bg/80 backdrop-blur-2xl rounded-[32px] shadow-[0_0_80px_rgba(2,132,199,0.15)] border border-border-main overflow-hidden flex flex-col lg:flex-row items-stretch relative min-h-[600px] lg:min-h-[550px] group/hero">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent pointer-events-none rounded-[32px]"></div>
            
            {/* Carousel Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`hero-text-${heroIndex}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5 }}
                className="p-8 md:p-16 lg:p-20 flex-1 z-20 flex flex-col justify-center relative bg-transparent"
              >
                <div>
                  <span className="inline-block px-4 py-1.5 bg-accent/10 text-accent text-xs font-black uppercase tracking-[0.2em] rounded-sm mb-6 border border-accent/20">
                    {heroSlides[heroIndex].badge}
                  </span>
                  <h1 
                    className="text-4xl md:text-5xl lg:text-6xl font-black text-text-primary tracking-tighter mb-6 leading-[1.1] uppercase"
                    dangerouslySetInnerHTML={{ __html: heroSlides[heroIndex].title }}
                  />
                  <p className="text-text-secondary text-lg font-medium mb-10 max-w-xl leading-relaxed">
                    {heroSlides[heroIndex].subtitle}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link to={heroSlides[heroIndex].link} className="w-fit px-10 py-5 bg-accent text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-accent-hover transition-all shadow-[0_0_20px_rgba(2,132,199,0.4)] hover:shadow-[0_0_40px_rgba(2,132,199,0.6)] hover:-translate-y-1 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-white/20 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      <span className="relative z-10 flex items-center gap-3">{heroSlides[heroIndex].cta} <ArrowRight className="h-5 w-5" /></span>
                    </Link>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Right Side: Showcase Image Carousel */}
            <div className="flex-1 w-full relative min-h-[350px] lg:min-h-full bg-surface-dark/50 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/20 rounded-full blur-[100px] group-hover/hero:bg-accent/30 transition-all duration-700"></div>
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`hero-img-${heroIndex}`}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7 }}
                    className="absolute inset-0"
                  >
                    {/* We no longer need an overlay since it's stacked natively on mobile */}
                    <img 
                      src={heroSlides[heroIndex].image} 
                      alt="Hardware showcase" 
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                </AnimatePresence>
            </div>
            
            {/* Custom Carousel Controls inside the box */}
            <div className="absolute bottom-6 left-10 lg:left-20 z-30 flex gap-2">
              {heroSlides.map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => setHeroIndex(i)}
                  className={`h-2 transition-all duration-300 rounded-full ${heroIndex === i ? 'w-8 bg-accent' : 'w-2 bg-text-muted hover:bg-text-secondary'}`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
            
          </div>
        </div>
      </section>

      {/* Categories Quick Access Grid */}
      <section className="py-16 bg-app-bg relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Link to={`/shop?category=${cat.name}`} className="block h-full">
                  <div className="bg-card-bg p-8 rounded-xl border border-border-main shadow-sm hover:border-accent hover:shadow-lg transition-all group h-full flex flex-col cursor-pointer relative overflow-hidden">
                    {/* Hover subtle background accent */}
                    <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="relative z-10 flex justify-between items-start mb-6">
                      <div className={`w-14 h-14 ${cat.color} bg-opacity-10 rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:bg-opacity-20 transition-all`}>
                        <cat.icon className="h-7 w-7" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-text-muted group-hover:text-accent transition-colors transform group-hover:translate-x-1" />
                    </div>
                    
                    <div className="relative z-10 mt-auto">
                      <h3 className="text-xl font-black text-text-primary mb-1 tracking-tight uppercase group-hover:text-accent transition-colors">{cat.name}</h3>
                      <p className="text-text-secondary text-xs font-bold uppercase tracking-widest">{cat.count}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-app-bg relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-card-bg rounded-2xl shadow-xl border border-border-main p-12 lg:p-20 relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16 relative z-10"
            >
              <p className="text-accent text-[10px] font-black uppercase tracking-[0.3em] mb-4">Our Guarantees</p>
              <h2 className="text-4xl md:text-5xl font-black text-text-primary tracking-tighter uppercase">Why Choose <span className="text-accent">Us</span></h2>
              <div className="w-16 h-1.5 bg-accent mx-auto mt-6 rounded-full"></div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
              {[
                { step: '01', icon: ShieldCheck, title: 'Genuine Parts', desc: '100% authentic microcontrollers and sensors sourced directly from trusted manufacturers.' },
                { step: '02', icon: Truck, title: 'Fast Shipping', desc: 'Same-day dispatch on orders placed before 2 PM. Express delivery nationwide.' },
                { step: '03', icon: Headset, title: 'Expert Support', desc: 'Our team of embedded engineers is here to help you troubleshoot your hardware issues.' },
                { step: '04', icon: Layers, title: 'Bulk Discounts', desc: 'Special B2B pricing and wholesale discounts for educational institutions and startups.' },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="bg-app-bg border border-border-main rounded-2xl p-8 hover:border-accent hover:shadow-xl transition-all duration-300 group flex flex-col relative overflow-hidden"
                >
                  {/* Subtle Background Number */}
                  <div className="absolute top-4 right-4 text-6xl font-black text-border-main/50 group-hover:text-accent/10 transition-colors pointer-events-none select-none z-0">
                    {s.step}
                  </div>
                  
                  {/* Icon */}
                  <div className="w-14 h-14 bg-card-bg border border-border-main rounded-xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-accent group-hover:border-accent transition-all duration-300 relative z-10 shadow-sm">
                    <s.icon className="h-6 w-6 text-text-secondary group-hover:text-white transition-colors" />
                  </div>
                  
                  {/* Content */}
                  <div className="relative z-10 mt-auto">
                    <h4 className="text-lg font-black text-text-primary mb-3 uppercase tracking-tight">{s.title}</h4>
                    <p className="text-text-secondary text-sm leading-relaxed font-medium">{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-app-bg relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-card-bg rounded-2xl shadow-xl border border-border-main p-12 lg:p-16">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div>
                <p className="text-accent text-[10px] font-black uppercase tracking-[0.3em] mb-4">Premium Selection</p>
                <h2 className="text-3xl md:text-4xl font-black text-text-primary tracking-tighter uppercase">Featured <span className="text-accent">Devices</span></h2>
              </div>
              <Link to="/shop" className="group flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-text-primary hover:text-accent transition-all px-6 py-3 border border-border-main rounded-sm hover:border-accent">
                View All <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {loading ? (
              <SkeletonGrid count={4} />
            ) : featuredProducts.length > 0 ? (
              <div className="flex flex-col gap-8">
                {/* Hero Featured Product (Full Width Showcase) */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="w-full group"
                >
                  <div className="bg-app-bg border border-border-main rounded-2xl overflow-hidden flex flex-col lg:flex-row relative hover:border-accent hover:shadow-[0_8px_40px_rgba(var(--color-accent),0.12)] transition-all duration-500">
                    <div className="absolute top-4 left-4 z-20">
                      <span className="bg-text-primary text-card-bg text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-sm shadow-lg border border-border-main">
                        {featuredProducts[0].heroBadge || "Top Pick"}
                      </span>
                    </div>
                    
                    <div className="w-full lg:w-2/5 bg-card-bg p-12 flex items-center justify-center relative overflow-hidden min-h-[300px]">
                      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <img src={featuredProducts[0].image} alt={featuredProducts[0].name} className="w-full h-full object-contain max-h-[300px] z-10 group-hover:scale-110 transition-transform duration-700 drop-shadow-xl" />
                    </div>
                    
                    <div className="w-full lg:w-3/5 p-8 lg:p-12 xl:p-16 flex flex-col justify-center">
                      <div className="text-[10px] font-bold text-accent uppercase tracking-widest mb-2">{featuredProducts[0].category}</div>
                      <Link to={`/product/${featuredProducts[0].slug || featuredProducts[0]._id}`}>
                        <h3 className="text-2xl lg:text-4xl font-black text-text-primary tracking-tighter leading-tight mb-4 hover:text-accent transition-colors">{featuredProducts[0].name}</h3>
                      </Link>
                      <p className="text-text-secondary text-sm lg:text-base leading-relaxed mb-8 max-w-xl">
                        {featuredProducts[0].description?.substring(0, 160) || "Experience the next level of embedded processing with our top-rated IoT module. Engineered for industrial reliability and seamless integration."}...
                      </p>
                      
                      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-6 mt-auto w-full">
                        <div className="w-full sm:w-auto mb-2 sm:mb-0 mr-0 sm:mr-4">
                          <p className="text-xs text-text-muted font-bold uppercase tracking-widest mb-1">Price</p>
                          <p className="text-3xl lg:text-4xl font-black text-text-primary tracking-tighter">{formatPrice(featuredProducts[0].price)}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-1">
                          <button 
                            onClick={() => onAddToCart(featuredProducts[0])}
                            className="w-full sm:w-auto flex-1 justify-center px-6 py-4 bg-accent hover:bg-accent-light text-white rounded-xl font-bold text-[11px] sm:text-xs uppercase tracking-widest transition-all shadow-lg shadow-accent/20 flex items-center gap-2 sm:gap-3 hover:-translate-y-0.5"
                          >
                            <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" /> Add to Cart
                          </button>
                          <Link to={`/product/${featuredProducts[0].slug || featuredProducts[0]._id}`} className="w-full sm:w-auto flex-1 justify-center px-6 py-4 bg-transparent border border-border-main hover:border-text-primary text-text-primary rounded-xl font-bold text-[11px] sm:text-xs uppercase tracking-widest transition-all flex items-center gap-2 hover:-translate-y-0.5">
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Secondary Grid */}
                {featuredProducts.length > 1 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-4">
                    {featuredProducts.slice(1, 4).map((product, i) => (
                      <motion.div
                        key={product._id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: i * 0.1 }}
                      >
                        <ProductCard product={product} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* AI Recommendation Engine: Theme Integrated */}
      <section ref={chatSectionRef} className="py-32 bg-card-bg relative border-t border-b border-border-main">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black text-text-primary tracking-tighter mb-6">Designed by <span className="text-accent">Intelligence.</span></h2>
            <p className="text-xl text-text-secondary font-medium max-w-3xl mx-auto leading-relaxed">
              Tell us what you want to build. Our neural engine will instantly assemble the perfect combination of components for your specific requirements. Clean, simple, perfect.
            </p>
          </div>

          <div className="max-w-5xl mx-auto bg-app-bg rounded-[24px] md:rounded-[40px] p-4 md:p-12 relative overflow-hidden shadow-2xl border border-border-main flex flex-col min-h-[600px]">
             {/* Chat History Container */}
             <div className="flex-grow overflow-y-auto space-y-8 p-2 md:p-4 mb-8 scrollbar-hide">
                
                {chatHistory.map((msg, index) => (
                  <div key={index} className={`flex gap-3 md:gap-6 ${msg.type === 'user' ? 'justify-end' : 'max-w-full lg:max-w-4xl'}`}>
                    {msg.type === 'ai' && (
                      <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center flex-shrink-0 shadow-md">
                        <BrainCircuit className="w-5 h-5"/>
                      </div>
                    )}
                    
                    <div className={`${msg.type === 'user' ? 'bg-accent text-white rounded-tr-sm max-w-[90%] md:max-w-[80%]' : 'bg-card-bg border border-border-main rounded-tl-sm w-full'} rounded-3xl p-4 md:p-6 text-sm md:text-base shadow-sm font-medium leading-relaxed`}>
                      <p className={msg.type === 'ai' && msg.products?.length > 0 ? "mb-8 text-text-primary" : (msg.type === 'ai' ? "text-text-primary" : "text-white")}>
                        {msg.text}
                      </p>
                      
                      {msg.products && msg.products.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {msg.products.map((product) => (
                            <div key={product._id} className="flex gap-3 sm:gap-4 bg-app-bg p-3 sm:p-4 rounded-2xl items-center hover:bg-card-bg hover:border-accent/50 transition-colors group cursor-pointer border border-border-subtle">
                              <div className="w-14 h-14 sm:w-20 sm:h-20 bg-white rounded-xl p-1.5 sm:p-2 flex items-center justify-center flex-shrink-0 shadow-sm border border-border-main">
                                <img src={product.image} className="w-full h-full object-contain mix-blend-multiply" alt={product.name} />
                              </div>
                              <div className="flex flex-col justify-center flex-grow min-w-0">
                                 <p className="font-bold text-text-primary text-sm truncate mb-1">{product.name}</p>
                                 <p className="text-accent font-black text-sm mb-2">{formatPrice(product.price)}</p>
                                 {product.ai_reason && (
                                    <p className="text-[10px] text-text-muted font-medium italic line-clamp-2">"{product.ai_reason}"</p>
                                 )}
                              </div>
                              <button 
                                onClick={() => onAddToCart(product)}
                                className="ml-2 sm:ml-auto w-8 h-8 sm:w-10 sm:h-10 bg-app-bg border border-border-main text-accent rounded-full shadow-sm flex items-center justify-center flex-shrink-0 group-hover:bg-accent group-hover:text-white group-hover:border-accent transition-all"
                              >
                                <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4"/>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isChatLoading && (
                  <div className="flex gap-6 max-w-3xl">
                    <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center flex-shrink-0 shadow-md">
                      <BrainCircuit className="w-5 h-5 animate-pulse"/>
                    </div>
                    <div className="bg-card-bg border border-border-main rounded-3xl rounded-tl-sm p-6 text-text-primary shadow-sm flex items-center gap-2">
                      <div className="w-2 h-2 bg-accent rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                )}
                
                <div ref={chatEndRef} />
             </div>

             {/* Chat Input */}
             <form onSubmit={handleChatSubmit} className="mt-auto relative z-10 flex gap-2 md:gap-3">
               <input 
                 type="text" 
                 value={chatInput}
                 onChange={(e) => setChatInput(e.target.value)}
                 disabled={isChatLoading}
                 placeholder="Type your project idea here..." 
                 className="flex-grow min-w-0 bg-card-bg border border-border-main rounded-full px-5 py-4 md:px-8 md:py-5 text-sm md:text-base font-medium text-text-primary shadow-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all disabled:opacity-50" 
               />
               <button 
                 type="submit"
                 disabled={isChatLoading || !chatInput.trim()}
                 className="bg-accent text-white px-5 py-4 md:px-8 md:py-5 rounded-full shadow-md hover:bg-accent-light hover:shadow-lg transition-all font-bold flex items-center gap-2 flex-shrink-0 disabled:opacity-50"
               >
                 <span className="hidden sm:inline">{isChatLoading ? "Thinking..." : "Send"}</span>
                 <ArrowRight className="w-5 h-5"/>
               </button>
             </form>
          </div>
        </div>
      </section>

      {/* Ultra Premium Community Reviews */}
      <section className="py-32 bg-surface-dark relative overflow-hidden">
        {/* Deep Tech Background */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/20 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/20 rounded-full blur-[150px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col items-center text-center mb-24">
             <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/10 text-accent rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-accent/20 shadow-[0_0_15px_rgba(2,132,199,0.2)]">
                <Star className="w-3 h-3 fill-current"/> Verified Community
             </div>
             <h2 className="text-5xl lg:text-7xl font-black text-text-inverse tracking-tighter mb-6 leading-[1.1]">
               Built by <br className="md:hidden"/><span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary">Engineers.</span>
             </h2>
             <p className="text-text-on-dark font-medium leading-relaxed max-w-2xl text-lg">
               Read what verified buyers are saying about their hardware purchases. Real reviews from real IoT projects running across the globe.
             </p>
          </div>
        </div>

        {/* Infinite Scrolling Marquee Feed */}
        <div className="relative w-full overflow-hidden pb-10 flex group">
           {/* Fade edges */}
           <div className="absolute top-0 left-0 w-24 md:w-64 h-full bg-gradient-to-r from-surface-dark to-transparent z-20 pointer-events-none"></div>
           <div className="absolute top-0 right-0 w-24 md:w-64 h-full bg-gradient-to-l from-surface-dark to-transparent z-20 pointer-events-none"></div>
           
           <motion.div 
             animate={{ x: ["0%", "-50%"] }}
             transition={{ repeat: Infinity, ease: "linear", duration: 45 }}
             className="flex gap-8 w-max px-4 hover:[animation-play-state:paused]"
           >
              {[...realReviews, ...realReviews, ...realReviews, ...realReviews].map((t, i) => (
                <div 
                  key={i} 
                  className="w-[350px] md:w-[450px] bg-card-bg/5 backdrop-blur-xl border border-card-bg/10 p-8 rounded-3xl hover:border-accent/50 transition-all duration-300 hover:shadow-[0_10px_40px_rgba(2,132,199,0.15)] relative overflow-hidden flex flex-col"
                >
                  <Quote className="absolute top-6 right-6 w-16 h-16 text-card-bg/5 -z-10 transition-colors duration-500 rotate-180" />
                  
                  <div className="flex gap-1 mb-6 text-accent">
                    {Array.from({length: t.rating || 5}).map((_, s) => <Star key={s} className="h-5 w-5 fill-current drop-shadow-[0_0_12px_rgba(2,132,199,0.5)]" />)}
                  </div>
                  
                  <p className="text-text-inverse font-medium mb-8 leading-relaxed text-base flex-grow">"{t.text}"</p>
                  
                  {t.product_name && (
                     <div className="mb-8 inline-block px-4 py-2 bg-card-bg/10 border border-card-bg/10 rounded-md text-xs font-bold text-text-on-dark w-fit max-w-full truncate">
                       <span className="opacity-60 font-normal mr-2">Purchased:</span> {t.product_name}
                     </div>
                  )}

                  <div className="flex items-center gap-4 mt-auto border-t border-card-bg/10 pt-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-accent to-secondary rounded-full flex items-center justify-center font-black text-white shadow-inner text-lg">{t.avatar}</div>
                    <div>
                      <h5 className="font-bold text-text-inverse text-sm mb-1">{t.name}</h5>
                      <p className="text-accent text-[10px] font-black uppercase tracking-widest">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
           </motion.div>
        </div>
      </section>

      <Newsletter />
    </div>
  );
};

export default Home;
