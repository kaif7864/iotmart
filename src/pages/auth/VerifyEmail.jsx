import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, XCircle, Loader2 } from 'lucide-react';
import apiClient from '../../services/api.client';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const hasFetched = React.useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    if (hasFetched.current) return;
    hasFetched.current = true;

    const verify = async () => {
      try {
        await apiClient.post('/auth/verify-email', { token });
        setStatus('success');
        toast.success("Email verified successfully!");
        
        // Update local session so the profile shows Verified instantly
        const sessionStr = localStorage.getItem('user_session');
        if (sessionStr) {
          const user = JSON.parse(sessionStr);
          user.email_verified = true;
          localStorage.setItem('user_session', JSON.stringify(user));
        }

        // After 3 seconds, redirect to profile with a full reload to ensure context updates
        setTimeout(() => {
          window.location.href = '/profile';
        }, 3000);
      } catch (error) {
        setStatus('error');
        toast.error(error.response?.data?.detail || "Invalid or expired link");
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <div className="min-h-screen pt-32 pb-12 flex flex-col items-center justify-center bg-app-bg px-4">
      <div className="card p-10 rounded-[32px] max-w-md w-full text-center space-y-6">
        {status === 'verifying' && (
          <>
            <Loader2 className="h-16 w-16 text-accent animate-spin mx-auto" />
            <h2 className="text-2xl font-black text-text-primary">Verifying Email...</h2>
            <p className="text-text-muted">Please wait while we verify your email address.</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <ShieldCheck className="h-16 w-16 text-status-success mx-auto" />
            <h2 className="text-2xl font-black text-status-success">Email Verified!</h2>
            <p className="text-text-muted">Your email has been successfully verified. Redirecting to your dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-16 w-16 text-status-danger mx-auto" />
            <h2 className="text-2xl font-black text-status-danger">Verification Failed</h2>
            <p className="text-text-muted">This link is invalid or has expired.</p>
            <button onClick={() => navigate('/profile')} className="mt-4 btn-premium py-3 px-8">
              Back to Profile
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
