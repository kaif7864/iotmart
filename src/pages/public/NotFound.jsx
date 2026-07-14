import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';
import { motion } from 'framer-motion';

const NotFound = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md"
      >
        <div className="flex justify-center mb-6 text-accent">
          <AlertCircle className="h-24 w-24" />
        </div>
        <h1 className="text-8xl font-black text-text-primary uppercase tracking-tighter mb-4">404</h1>
        <h2 className="text-2xl font-bold text-text-secondary uppercase tracking-wider mb-6">Component Not Found</h2>
        <p className="text-text-muted mb-10 leading-relaxed">
          The module or page you are trying to access does not exist in our current architecture. 
          Please verify the URL or return to the main dashboard.
        </p>
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-text-inverse font-black text-[10px] uppercase tracking-widest rounded-sm hover:scale-105 transition-transform shadow-lg"
        >
          <Home className="h-4 w-4" /> Return to Base
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
