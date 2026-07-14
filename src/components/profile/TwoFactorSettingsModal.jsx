import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Mail, Smartphone, Loader2, Send } from 'lucide-react';
import { setup2FA, enable2FA, disable2FA, sendVerification } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const TwoFactorSettingsModal = ({ show, onClose }) => {
  const { user, updateUserSession } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('select');
  const [setupData, setSetupData] = useState(null);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  // Reset everything every time modal opens or closes
  useEffect(() => {
    setStep('select');
    setSetupData(null);
    setOtp('');
    setError('');
    setLoading(false);
  }, [show]);

  const handleSelectAuthenticator = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await setup2FA(user.email);
      setSetupData(res.data);
      setStep('setup_auth');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to setup Authenticator');
    }
    setLoading(false);
  };

  const handleSelectEmail = async () => {
    setLoading(true);
    setError('');
    try {
      await sendVerification(user.email, 'email');
      setStep('verify_email');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send OTP to email');
    }
    setLoading(false);
  };

  const handleEnable = async (type) => {
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }
    setLoading(true);
    setError('');
    try {
      await enable2FA({
        email: user.email,
        type: type,
        secret: type === 'authenticator' ? setupData?.secret : '',
        code: otp
      });
      updateUserSession({ ...user, is_2fa_enabled: true, two_factor_type: type });
      onClose();
      toast.success('2FA enabled successfully!');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid OTP code');
    }
    setLoading(false);
  };

  const handleDisable = async () => {
    if (!window.confirm('Are you sure you want to disable 2FA? This will reduce your account security.')) return;
    setLoading(true);
    try {
      await disable2FA(user.email);
      updateUserSession({ ...user, is_2fa_enabled: false, two_factor_type: null });
      onClose();
      toast.success('2FA disabled.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to disable 2FA');
    }
    setLoading(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-app-bg w-full max-w-md rounded-[32px] border border-border-main overflow-hidden shadow-2xl relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-surface hover:bg-surface-hover rounded-full transition-all"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-8">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-6">
            <ShieldCheck className="h-8 w-8 text-accent" />
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Two-Factor Auth</h3>
          
          {user?.is_2fa_enabled ? (
            <div className="space-y-6 mt-6">
              <div className="p-4 bg-status-success-bg border border-status-success/30 rounded-xl">
                <p className="text-sm font-bold text-status-success flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> 2FA is currently Active
                </p>
                <p className="text-xs text-status-success/80 mt-1">
                  Type: {user.two_factor_type === 'authenticator' ? 'Authenticator App' : 'Email OTP'}
                </p>
              </div>
              <button 
                onClick={handleDisable}
                disabled={loading}
                className="w-full py-4 bg-status-danger-bg text-status-danger hover:bg-status-danger hover:text-white transition-all rounded-xl font-bold uppercase tracking-widest text-[10px]"
              >
                {loading ? 'Processing...' : 'Disable 2FA'}
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-text-secondary mb-6">
                Protect your account with an extra layer of security. Choose your preferred method.
              </p>

              {error && <div className="p-3 mb-6 bg-status-danger-bg text-status-danger text-xs rounded-lg font-medium">{error}</div>}

              {step === 'select' && (
                <div className="space-y-3">
                  <button onClick={handleSelectAuthenticator} disabled={loading} className="w-full p-4 border-2 border-border-main hover:border-accent rounded-xl text-left transition-all group flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-surface group-hover:bg-accent/10 flex items-center justify-center shrink-0">
                      <Smartphone className="h-5 w-5 text-text-muted group-hover:text-accent transition-all" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">Authenticator App</h4>
                      <p className="text-xs text-text-muted mt-1">Google Authenticator, Authy, etc.</p>
                    </div>
                  </button>
                  <button onClick={handleSelectEmail} disabled={loading} className="w-full p-4 border-2 border-border-main hover:border-accent rounded-xl text-left transition-all group flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-surface group-hover:bg-accent/10 flex items-center justify-center shrink-0">
                      <Mail className="h-5 w-5 text-text-muted group-hover:text-accent transition-all" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">Email OTP</h4>
                      <p className="text-xs text-text-muted mt-1">Receive code via {user.email}</p>
                    </div>
                  </button>
                </div>
              )}

              {step === 'setup_auth' && setupData && (
                <div className="space-y-6">
                  <div className="p-4 bg-white rounded-xl mx-auto w-max">
                    <img src={setupData.qr_code} alt="QR Code" className="w-48 h-48" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-text-muted uppercase tracking-widest font-black mb-1">Secret Key</p>
                    <code className="px-3 py-2 bg-surface rounded-lg text-sm font-mono tracking-wider">{setupData.secret}</code>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Enter 6-Digit Code</label>
                    <input 
                      type="text" 
                      value={otp} 
                      onChange={e => setOtp(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                      className="w-full mt-2 p-4 bg-app-bg border-2 border-border-main focus:border-accent rounded-xl outline-none text-center text-xl tracking-[0.5em] font-mono"
                    />
                  </div>
                  <button 
                    onClick={() => handleEnable('authenticator')}
                    disabled={loading || otp.length !== 6}
                    className="w-full py-4 btn-premium text-xs rounded-xl flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify & Enable'}
                  </button>
                </div>
              )}

              {step === 'verify_email' && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
                      <Send className="h-8 w-8 text-accent" />
                    </div>
                    <p className="text-sm text-text-secondary">We've sent a 6-digit verification code to <strong>{user.email}</strong>.</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Enter 6-Digit Code</label>
                    <input 
                      type="text" 
                      value={otp} 
                      onChange={e => setOtp(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                      className="w-full mt-2 p-4 bg-app-bg border-2 border-border-main focus:border-accent rounded-xl outline-none text-center text-xl tracking-[0.5em] font-mono"
                    />
                  </div>
                  <button 
                    onClick={() => handleEnable('email')}
                    disabled={loading || otp.length !== 6}
                    className="w-full py-4 btn-premium text-xs rounded-xl flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify & Enable'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default TwoFactorSettingsModal;
