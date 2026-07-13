import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User, ArrowRight, CircuitBoard, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { isValidEmail } from '../../utils/validators';
import { handleError } from '../../utils/errorHandler';
import { useGoogleLogin } from '@react-oauth/google';
import apiClient from '../../services/api.client';
import { verify2FALogin } from '../../services/api';

const Login = () => {
  const { login, completeLogin, googleLogin } = useAuth();
  const navigate = useNavigate();
  
  const googleLoginAction = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      const result = await googleLogin(tokenResponse.access_token, false);
      setIsLoading(false);
      if (result.requires_2fa) {
        setTwoFactorData(result.data);
        setShow2FA(true);
        return;
      }
      
      if (result.success) {
        toast.success('Google Login Successful!');
        navigate(result.user?.role === 'admin' ? '/admin/dashboard' : '/shop');
      } else {
        handleError(new Error(result.message));
      }
    },
    onError: () => {
      toast.error('Google Login Failed');
    }
  });
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  // 2FA States
  const [show2FA, setShow2FA] = useState(false);
  const [otp, setOtp] = useState('');
  const [twoFactorData, setTwoFactorData] = useState(null);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/forgot-password', { email });
      toast.success(res.data.message || "Reset link sent!");
      setIsForgotPassword(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to send reset link");
    } finally {
      setIsLoading(false);
    }
  };

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

    if (result.requires_2fa) {
      setTwoFactorData(result.data);
      setShow2FA(true);
      return;
    }

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

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) return;
    setIsLoading(true);
    try {
      const res = await verify2FALogin({ email: twoFactorData.email, code: otp });
      completeLogin(res.data);
      toast.success('Welcome back to IoTMart!');
      if (res.data.user?.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/shop');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid 2FA code");
    } finally {
      setIsLoading(false);
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
            <div className="flex justify-between items-center mb-2">
              <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest">Password</label>
              <button type="button" onClick={() => setIsForgotPassword(true)} className="text-[10px] font-black text-accent uppercase tracking-widest hover:underline">
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-5 pr-12 py-4 bg-app-bg border border-border-main rounded-xl text-sm font-bold focus:border-accent outline-none transition-all"
                placeholder="••••••••"
                required={!isForgotPassword}
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
            onClick={(e) => handleSubmit(e)}
            disabled={isLoading}
            className="w-full py-4 bg-accent text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-accent-hover transition-all flex items-center justify-center gap-2 group relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              {isLoading ? 'Authenticating...' : 'Sign In'} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </form>

        {isForgotPassword && (
          <div className="fixed inset-0 bg-app-bg/80 backdrop-blur-sm z-[999] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-10 rounded-[32px] max-w-md w-full relative">
              <button onClick={() => setIsForgotPassword(false)} className="absolute top-6 right-6 text-text-muted hover:text-text-primary text-xl">&times;</button>
              <h2 className="heading-section mb-2 text-center">Reset Password</h2>
              <p className="text-xs text-text-muted text-center mb-8">Enter your email and we'll send a link to reset your password.</p>
              
              <form onSubmit={handleForgotPassword} className="space-y-6">
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
                <button disabled={isLoading} className="w-full btn-premium py-4">
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* 2FA Modal */}
        <AnimatePresence>
          {show2FA && (
            <div className="fixed inset-0 bg-app-bg/80 backdrop-blur-sm z-[999] flex items-center justify-center px-4">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="card p-10 rounded-[32px] max-w-md w-full relative">
                <button onClick={() => setShow2FA(false)} className="absolute top-6 right-6 text-text-muted hover:text-text-primary text-xl">&times;</button>
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck className="h-8 w-8 text-accent" />
                </div>
                <h2 className="heading-section mb-2 text-center">Two-Factor Authentication</h2>
                <p className="text-xs text-text-muted text-center mb-8">
                  {twoFactorData?.two_factor_type === 'authenticator' 
                    ? 'Enter the 6-digit code from your authenticator app.'
                    : `We've sent a 6-digit code to ${twoFactorData?.email}.`}
                </p>
                
                <form onSubmit={handleVerify2FA} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 text-center">Enter 6-Digit Code</label>
                    <input 
                      type="text" 
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      className="w-full px-5 py-4 bg-app-bg border border-border-main rounded-xl text-2xl tracking-[0.5em] text-center font-mono focus:border-accent outline-none transition-all"
                      placeholder="123456"
                      required
                    />
                  </div>
                  <button disabled={isLoading || otp.length !== 6} className="w-full btn-premium py-4">
                    {isLoading ? 'Verifying...' : 'Verify Code'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border-main"></div></div>
          <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
            <span className="bg-card-bg px-4 text-text-muted">Or Continue With</span>
          </div>
        </div>

        <button 
          type="button"
          onClick={() => googleLoginAction()}
          disabled={isLoading}
          className="w-full py-4 bg-white text-gray-800 border border-gray-200 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-3 mb-8"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google
        </button>


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
