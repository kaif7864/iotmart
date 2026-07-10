import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User, ArrowRight, CircuitBoard, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { isValidEmail } from '../../utils/validators';
import { handleError } from '../../utils/errorHandler';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e, demoRole = null) => {
    if (e) e.preventDefault();
    setError('');
    setIsLoading(true);

    let credentials = { email, password };
    
    if (demoRole === 'admin') {
      credentials = { email: 'admin@iotmart.com', password: 'neural123' };
    } else if (demoRole === 'user') {
      credentials = { email: 'engineer@iotmart.com', password: 'neural123' };
    }

    if (!demoRole && !isValidEmail(email)) {
      setError('Invalid email address format.');
      setIsLoading(false);
      return;
    }
    
    const result = await login(credentials);
    setIsLoading(false);

    if (result.success) {
      toast.success('Welcome back to IoTMart!');
      if (result.user?.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/shop');
      }
    } else {
      handleError(new Error(result.message || 'Invalid credentials'));
      setError(result.message || 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-12 flex flex-col items-center justify-center relative bg-app-bg">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full px-8 py-12 bg-card-bg border border-border-main rounded-2xl shadow-2xl"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-accent/20">
            <CircuitBoard className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-text-primary text-center uppercase tracking-tighter">
            Sign In
          </h1>
          <p className="text-[10px] font-black text-text-muted mt-2 uppercase tracking-widest">
            Secure access to IoTMart
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-status-danger-bg text-status-danger rounded-lg text-[10px] font-black uppercase tracking-widest text-center border border-status-danger/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 mb-8">
          <div>
            <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 bg-app-bg border border-border-main rounded-xl text-sm font-bold focus:border-accent outline-none transition-all"
              placeholder="engineer@iotmart.com"
              required
            />
          </div>
          <div className="relative">
            <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-5 pr-12 py-4 bg-app-bg border border-border-main rounded-xl text-sm font-bold focus:border-accent outline-none transition-all"
                placeholder="••••••••"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-accent transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center py-4 bg-text-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent transition-all shadow-xl disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 flex items-center justify-between">
          <span className="border-b border-border-main w-1/5 lg:w-1/4"></span>
          <span className="text-[10px] text-center text-text-muted font-black uppercase tracking-widest">or authenticate with</span>
          <span className="border-b border-border-main w-1/5 lg:w-1/4"></span>
        </div>

        <div className="mt-6 flex gap-4">
          <button type="button" onClick={() => toast.error('GitHub OAuth coming soon')} className="w-1/2 flex items-center justify-center gap-3 py-4 border border-border-main rounded-xl text-text-primary hover:bg-app-bg transition-all font-black text-xs">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            GitHub
          </button>
          <button type="button" onClick={() => toast.error('Google OAuth coming soon')} className="w-1/2 flex items-center justify-center gap-3 py-4 border border-border-main rounded-xl text-text-primary hover:bg-app-bg transition-all font-black text-xs">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Google
          </button>
        </div>

        <div className="text-center mt-8 mb-8">
          <Link 
            to="/signup"
            className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-accent transition-colors"
          >
            Need an account? Sign Up
          </Link>
        </div>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-subtle"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-card-bg text-[9px] font-black text-text-muted uppercase tracking-widest">Or use demo accounts</span>
          </div>
        </div>

        <div className="space-y-4">
          <button 
            onClick={() => handleSubmit(null, 'user')}
            type="button"
            className="w-full group flex items-center justify-between p-5 bg-app-bg hover:bg-card-bg border border-border-main hover:border-accent rounded-xl transition-all shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                <User className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-text-primary uppercase tracking-tight">Demo User</p>
                <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">kaif@example.com</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-text-muted group-hover:text-accent group-hover:translate-x-1 transition-all" />
          </button>

          <button 
            onClick={() => handleSubmit(null, 'admin')}
            type="button"
            className="w-full group flex items-center justify-between p-5 bg-app-bg hover:bg-card-bg border border-border-main hover:border-status-danger rounded-xl transition-all shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-status-danger-bg flex items-center justify-center text-status-danger">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-text-primary uppercase tracking-tight">Demo Admin</p>
                <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">admin@iotmart.com</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-text-muted group-hover:text-status-danger group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
