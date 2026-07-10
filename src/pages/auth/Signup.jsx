import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User, CircuitBoard, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { isValidEmail, isValidPassword, isValidName, isValidPhone } from '../../utils/validators';
import { handleError } from '../../utils/errorHandler';

const Signup = () => {
  const { signup, login } = useAuth();
  const navigate = useNavigate();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!isValidEmail(email)) {
      setError('Invalid email address format.');
      setIsLoading(false);
      return;
    }
    
    if (!isValidPassword(password)) {
      setError('Password must be at least 8 characters long, contain letters, numbers, and special characters.');
      setIsLoading(false);
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }
    
    if (!isValidName(firstName)) {
      setError('First Name must be at least 2 characters (letters only).');
      setIsLoading(false);
      return;
    }
    
    if (lastName && !isValidName(lastName)) {
      setError('Last Name contains invalid characters.');
      setIsLoading(false);
      return;
    }

    if (!isValidPhone(phone)) {
      setError('Please enter a valid 10-digit phone number.');
      setIsLoading(false);
      return;
    }

    const result = await signup({ first_name: firstName, last_name: lastName, phone, email, password });
    setIsLoading(false);
    
    if (result.success) {
      toast.success('Registration successful! Welcome to IoTMart.');
      await login({ email, password });
      navigate('/shop');
    } else {
      handleError(new Error(result.message || 'Registration failed'));
      setError(result.message || 'Registration failed');
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
            Create Account
          </h1>
          <p className="text-[10px] font-black text-text-muted mt-2 uppercase tracking-widest">
            Register a new engineering profile
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-status-danger-bg text-status-danger rounded-lg text-[10px] font-black uppercase tracking-widest text-center border border-status-danger/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 mb-8">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">First Name</label>
              <input 
                type="text" 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value.replace(/[^A-Za-z\s]/g, ''))}
                className="w-full px-5 py-4 bg-app-bg border border-border-main rounded-xl text-sm font-bold focus:border-accent outline-none transition-all"
                placeholder="Tony"
                required
                minLength={2}
                pattern="[A-Za-z\s]+"
                title="First name must contain only letters"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Last Name</label>
              <input 
                type="text" 
                value={lastName}
                onChange={(e) => setLastName(e.target.value.replace(/[^A-Za-z\s]/g, ''))}
                className="w-full px-5 py-4 bg-app-bg border border-border-main rounded-xl text-sm font-bold focus:border-accent outline-none transition-all"
                placeholder="Stark"
                required
                pattern="[A-Za-z\s]*"
                title="Last name must contain only letters"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Phone Number</label>
            <input 
              type="tel" 
              value={phone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, ''); 
                if (val.length <= 10) setPhone(val);
              }}
              className="w-full px-5 py-4 bg-app-bg border border-border-main rounded-xl text-sm font-bold focus:border-accent outline-none transition-all"
              placeholder="9876543210"
              required
              maxLength={10}
              pattern="\d{10}"
              title="Phone number must be exactly 10 digits"
            />
          </div>
          
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
          
          <div className="relative">
            <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Confirm Password</label>
            <div className="relative">
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-5 pr-12 py-4 bg-app-bg border border-border-main rounded-xl text-sm font-bold focus:border-accent outline-none transition-all"
                placeholder="••••••••"
                required
              />
              <button 
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-accent transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center py-4 bg-text-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent transition-all shadow-xl disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Create Profile'}
          </button>
        </form>

        <div className="text-center mt-8">
          <Link 
            to="/login"
            className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-accent transition-colors"
          >
            Already registered? Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
