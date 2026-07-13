import React, { useState, useEffect } from 'react';
import { ArrowRight, Cpu, Zap, ShieldCheck, Loader2, Star, CheckCircle, Smartphone, Home as HomeIcon, Shield, Layers, Globe, BrainCircuit, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from '../../components/ui/ProductCard';
import Newsletter from '../../components/feedback/Newsletter';
import { getProducts } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { SkeletonGrid } from '../../components/common';
import { useCart } from '../../hooks/useCart';
import SEO from '../../components/common/SEO';

const Home = () => {
  const { onAddToCart } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);

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
        setFeaturedProducts(data.slice(0, 4));
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

  const testimonials = [
    { name: "Rahul Sharma", role: "Embedded Engineer", text: "IoTMart has the most reliable DHT22 sensors. Fast delivery and genuine parts every time.", avatar: "R" },
    { name: "Sarah Chen", role: "IoT Hobbyist", text: "The Smart Home Starter Kit is perfect for beginners. The documentation link was very helpful.", avatar: "S" },
    { name: "John Doe", role: "Project Manager", text: "Best place for bulk orders of ESP32 modules. Competitive pricing and great support.", avatar: "J" },
  ];

  return (
    <div className="pt-20 overflow-x-hidden">
      <SEO 
        title="IoTMart | Next-Gen Electronic Components & IoT Hardware" 
        description="Discover premium microcontrollers, sensors, and smart home modules. High-performance hardware for industrial innovators and hobbyists." 
      />
      {/* Hero Carousel Section */}
      <section className="relative min-h-[85vh] flex items-center bg-surface-dark overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={heroIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 z-0"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-surface-dark via-surface-dark/80 to-transparent z-10"></div>
            <img 
              src={heroSlides[heroIndex].image} 
              alt="Hero" 
              className="w-full h-full object-cover scale-105"
            />
          </motion.div>
        </AnimatePresence>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <motion.div
            key={`content-${heroIndex}`}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-2xl"
          >
            <span className="inline-block px-4 py-1 bg-accent text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-6">
              {heroSlides[heroIndex].badge}
            </span>
            <h1 
              className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-8 leading-[0.9] uppercase"
              dangerouslySetInnerHTML={{ __html: heroSlides[heroIndex].title }}
            ></h1>
            <p className="text-text-secondary text-lg md:text-xl font-medium mb-10 leading-relaxed">
              {heroSlides[heroIndex].subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-5">
              <Link to={heroSlides[heroIndex].link} className="btn-premium px-12 py-4 text-sm">
                {heroSlides[heroIndex].cta}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link to="/shop" className="px-10 py-4 bg-card-bg/10 backdrop-blur-md border border-card-bg/20 text-white rounded-sm font-bold hover:bg-card-bg/20 transition-all text-sm uppercase tracking-widest text-center">
                Explore More
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Carousel Indicators */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex gap-3">
          {heroSlides.map((_, i) => (
            <button 
              key={i} 
              onClick={() => setHeroIndex(i)}
              className={`h-1.5 transition-all duration-500 rounded-full ${heroIndex === i ? 'w-10 bg-accent' : 'w-4 bg-card-bg/30'}`}
            ></button>
          ))}
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-24 bg-card-bg relative z-30 -mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.1 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Link to={`/shop?category=${cat.name}`}>
                  <motion.div 
                    whileHover={{ y: -10 }}
                    className="bg-card-bg p-8 rounded-sm border border-border-main shadow-sm hover:shadow-xl transition-all group cursor-pointer"
                  >
                    <div className={`w-14 h-14 ${cat.color} rounded-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                      <cat.icon className="h-7 w-7" />
                    </div>
                    <h3 className="text-xl font-black text-text-primary mb-1 tracking-tight uppercase">{cat.name}</h3>
                    <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest">{cat.count}</p>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works (IoT Explanation) */}
      <section className="py-24 bg-app-bg overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.1 }}
            className="text-center mb-20"
          >
            <p className="text-accent text-[10px] font-black uppercase tracking-[0.3em] mb-4">The Process</p>
            <h2 className="text-4xl md:text-5xl font-black text-text-primary tracking-tighter uppercase">How It <span className="text-accent">Works</span></h2>
            <div className="w-20 h-1.5 bg-accent mx-auto mt-6 rounded-full"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {[
              { step: '01', title: 'Pick Sensors', desc: 'Choose from our range of verified IoT sensors and MCU modules.' },
              { step: '02', title: 'Connectivity', desc: 'Connect using Wi-Fi, LoRa, or Zigbee with our ESP32 and gateway kits.' },
              { step: '03', title: 'Cloud Logic', desc: 'Send your data to platforms like AWS IoT, Firebase or custom MQTT brokers.' },
              { step: '04', title: 'Visualize', desc: 'Monitor and control your devices in real-time from anywhere in the world.' },
            ].map((s, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.1 }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative group"
              >
                <div className="text-6xl font-black text-border-main group-hover:text-accent/10 transition-colors absolute -top-8 -left-4 z-0">{s.step}</div>
                <div className="relative z-10">
                  <h4 className="text-lg font-bold text-text-primary mb-3 uppercase tracking-tight group-hover:text-accent transition-colors">{s.title}</h4>
                  <p className="text-text-secondary text-sm leading-relaxed font-medium">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-32 bg-card-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <p className="text-accent text-[10px] font-black uppercase tracking-[0.3em] mb-4">Premium Selection</p>
              <h2 className="text-4xl font-black text-text-primary tracking-tighter uppercase">Featured <span className="text-accent">Devices</span></h2>
            </div>
            <Link to="/shop" className="group flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-text-primary hover:text-accent transition-all">
              View All Components <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>
          
          {loading ? (
            <SkeletonGrid count={4} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
              {featuredProducts.map((product, i) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <ProductCard product={product} onAddToCart={onAddToCart} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* AI Recommendation Engine */}
      <section className="py-32 bg-app-bg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-8 bg-card-bg p-10 rounded-[40px] border border-border-main shadow-xl">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-accent/10 rounded-sm flex items-center justify-center text-accent">
                <BrainCircuit className="h-10 w-10" />
              </div>
              <div>
                <p className="text-accent text-[10px] font-black uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Personalized Engine
                </p>
                <h2 className="text-3xl font-black text-text-primary tracking-tighter uppercase leading-tight">AI Curated <span className="text-accent">For Your Project</span></h2>
                <p className="text-text-muted text-xs font-bold uppercase tracking-widest mt-1">Based on your browsing pattern and tech stack</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="bg-surface px-6 py-3 rounded-sm border border-border-main flex items-center gap-3">
                <div className="w-2 h-2 bg-status-success rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-widest">Neural Link Syncing</span>
              </div>
            </div>
          </div>

          {loading && (
            <div className="mt-16">
              <SkeletonGrid count={4} />
            </div>
          )}
          
          {!loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
              {featuredProducts.reverse().map((product, i) => (
                <motion.div 
                  key={product._id} 
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: false, amount: 0.1 }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  className="relative group"
                >
                  <div className="absolute -top-3 -right-3 z-20 bg-surface-dark text-white px-3 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl border border-card-bg/20">
                    <Sparkles className="h-3 w-3 text-accent" /> AI Pick
                  </div>
                  <ProductCard product={product} onAddToCart={onAddToCart} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-surface-dark text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 blur-[150px] rounded-full translate-y-1/2 -translate-x-1/2"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black tracking-tighter uppercase mb-4">Trusted by <span className="text-accent">Innovators</span></h2>
            <p className="text-text-muted font-medium max-w-lg mx-auto">Join thousands of engineers building the next generation of smart devices with our components.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-card-bg/5 backdrop-blur-sm border border-card-bg/10 p-8 rounded-sm hover:bg-card-bg/10 transition-all group">
                <div className="flex gap-1 mb-6 text-accent">
                  {[1, 2, 3, 4, 5].map(s => <Star key={s} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="text-lg font-medium text-text-secondary mb-8 leading-relaxed italic">"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center font-black text-white">{t.avatar}</div>
                  <div>
                    <h5 className="font-bold text-white text-sm uppercase tracking-wider">{t.name}</h5>
                    <p className="text-accent text-[10px] font-bold uppercase tracking-widest">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Newsletter />
    </div>
  );
};

export default Home;
