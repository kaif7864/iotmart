import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2 } from 'lucide-react';
import apiClient from '../../services/api.client';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error("Invalid reset link");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.post('/auth/reset-password', { token, new_password: password });
      toast.success(res.data.message || "Password reset successfully!");
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen pt-32 pb-12 flex flex-col items-center justify-center bg-app-bg px-4">
        <div className="card p-10 rounded-[32px] max-w-md w-full text-center space-y-6">
          <h2 className="text-2xl font-black text-status-danger">Invalid Link</h2>
          <p className="text-text-muted">This reset link is missing or invalid.</p>
          <button onClick={() => navigate('/login')} className="btn-premium py-3 px-8">Back to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-12 flex flex-col items-center justify-center bg-app-bg px-4">
      <div className="card p-10 rounded-[32px] max-w-md w-full relative">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center">
            <ShieldCheck className="h-8 w-8 text-accent" />
          </div>
        </div>
        <h2 className="heading-section mb-2 text-center">Set New Password</h2>
        <p className="text-xs text-text-muted text-center mb-8">Enter your new secure password below.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">New Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 bg-app-bg border border-border-main rounded-xl text-sm font-bold focus:border-accent outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Confirm Password</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-5 py-4 bg-app-bg border border-border-main rounded-xl text-sm font-bold focus:border-accent outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          <button disabled={isSubmitting} className="w-full btn-premium py-4">
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
