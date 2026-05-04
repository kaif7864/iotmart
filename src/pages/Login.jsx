import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, ShieldCheck, ArrowRight, CircuitBoard } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (role) => {
    login(role);
    if (role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/shop');
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Decorative Elements */}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full px-8 py-12 glass border border-border-main rounded-[40px] shadow-2xl bg-card-bg"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mb-6 border border-border-accent">
            <CircuitBoard className="h-10 w-10 text-accent" />
          </div>
          <h1 className="text-3xl font-extrabold text-text-primary text-center">Welcome Back</h1>
          <p className="text-text-secondary mt-2">Secure access to IoTMart ecosystem</p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={() => handleLogin('user')}
            className="w-full group flex items-center justify-between p-5 bg-app-bg hover:bg-card-bg border border-border-main hover:border-accent/50 rounded-2xl transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent group-hover:text-white text-accent transition-colors">
                <User className="h-6 w-6" />
              </div>
              <div className="text-left">
                <p className="text-text-primary font-bold">User Login</p>
                <p className="text-text-muted text-xs">Standard customer access</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-text-muted group-hover:text-accent group-hover:translate-x-1 transition-all" />
          </button>

          <button 
            onClick={() => handleLogin('admin')}
            className="w-full group flex items-center justify-between p-5 bg-app-bg hover:bg-card-bg border border-border-main hover:border-secondary/50 rounded-2xl transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center group-hover:bg-secondary group-hover:text-white text-secondary transition-colors">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="text-left">
                <p className="text-text-primary font-bold">Admin Portal</p>
                <p className="text-text-muted text-xs">Full system management</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-text-muted group-hover:text-secondary transition-all" />
          </button>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 text-center">
          <p className="text-text-muted text-xs">
            Trusted by 10,000+ IoT Professionals
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
