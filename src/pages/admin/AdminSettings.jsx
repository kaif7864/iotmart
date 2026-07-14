import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import apiClient from '../../services/api.client';
import { Save, Truck, DollarSign, Power, Loader2, ShieldCheck, ShieldOff, KeyRound, Bell, User, Lock, CheckCircle, XCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import TwoFactorSettingsModal from '../../components/profile/TwoFactorSettingsModal';
import { sendVerification, verifyMobile, verifyEmailOtp } from '../../services/api';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    store_name: 'IoTMart',
    support_email: 'support@iotmart.com',
    shipping_cost: 50,
    free_shipping_threshold: 500,
    tax_rate: 18,
    order_prefix: 'ORD-',
    low_stock_threshold: 5,
    maintenance_mode: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiClient.get('/settings');
        setSettings(res.data);
      } catch (error) {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put('/settings', settings);
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const [activeTab, setActiveTab] = useState(queryParams.get('tab') || 'config');
  const [isEditing, setIsEditing] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const { user, updateUserSession } = useAuth();

  const [profile, setProfile] = useState({
    first_name: user?.first_name || user?.name?.split(' ')[0] || '',
    last_name: user?.last_name || user?.name?.split(' ').slice(1).join(' ') || '',
    phone: user?.phone || '',
    email: user?.email || '',
    email_notifications: user?.email_notifications ?? true,
    sms_notifications: user?.sms_notifications ?? false,
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Email/Phone verification state
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [emailChanged, setEmailChanged] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false); // unlocks email field after verified
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleSendEmailOtp = async () => {
    setVerifying(true);
    try {
      // Send OTP to the NEW email they want to use
      await sendVerification(newEmail || profile.email, 'email');
      setEmailOtpSent(true);
      toast.success('OTP sent to your email!');
    } catch (err) {
      toast.error('Failed to send OTP');
    }
    setVerifying(false);
  };

  const handleVerifyEmail = async () => {
    setVerifying(true);
    try {
      await verifyEmailOtp(profile.email, emailOtp, newEmail !== profile.email ? newEmail : null);
      updateUserSession({ ...user, email: newEmail || profile.email, email_verified: true });
      setProfile(p => ({ ...p, email: newEmail || p.email }));
      setEmailOtpSent(false);
      setEmailChanged(false);
      setEditingEmail(false);
      setEmailOtp('');
      toast.success('Email verified & updated!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid OTP');
    }
    setVerifying(false);
  };

  const handleSendPhoneOtp = async () => {
    if (!profile.phone) { toast.error('Enter a phone number first'); return; }
    setVerifying(true);
    try {
      await sendVerification(profile.email, 'mobile');
      setPhoneOtpSent(true);
      toast.success('OTP sent to your phone!');
    } catch (err) {
      toast.error('Failed to send OTP');
    }
    setVerifying(false);
  };

  const handleVerifyPhone = async () => {
    setVerifying(true);
    try {
      await verifyMobile(profile.email, phoneOtp);
      updateUserSession({ ...user, phone_verified: true });
      setPhoneOtpSent(false);
      setPhoneOtp('');
      toast.success('Phone verified successfully!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid OTP');
    }
    setVerifying(false);
  };

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      const res = await apiClient.put(`/users/${user._id}/profile`, profile);
      // Merge API response with current session to preserve verified flags
      updateUserSession({ ...user, ...res.data.user });
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await apiClient.put(`/users/${user._id}/password`, {
        current_password: passwords.currentPassword,
        new_password: passwords.newPassword
      });
      toast.success('Password changed successfully!');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const avatarLetter = (user?.first_name || user?.name || 'A').charAt(0).toUpperCase();

  if (loading) return <div className="p-8 text-text-primary font-bold text-xl">Loading configuration...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-border-main">
        <div>
          <p className="label-caps text-accent mb-2">System Settings</p>
          <h1 className="heading-page">Store & <span className="text-accent">Account</span></h1>
        </div>
        <div className="flex bg-app-bg p-1 rounded-xl border border-border-main">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'config' ? 'bg-accent text-white shadow' : 'text-text-muted hover:text-text-primary'}`}
          >
            Configuration
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'profile' ? 'bg-accent text-white shadow' : 'text-text-muted hover:text-text-primary'}`}
          >
            Admin Profile
          </button>
        </div>
      </div>

      {activeTab === 'config' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-end gap-3">
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="btn-secondary px-6 py-2 rounded-xl text-sm font-bold border-2 border-accent text-accent hover:bg-accent hover:text-white transition-all">
                Enable Editing
              </button>
            ) : (
              <>
                <button onClick={() => setIsEditing(false)} className="btn-secondary px-6 py-2 rounded-xl text-sm font-bold border-2 border-border-main hover:bg-card-bg transition-all">
                  Cancel
                </button>
                <button onClick={() => { handleSave(); setIsEditing(false); }} disabled={saving} className="btn-premium px-6 py-2 flex items-center gap-2 rounded-xl text-sm font-bold disabled:opacity-60">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
                </button>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
              <div className="card rounded-2xl p-8 border border-border-main transition-opacity" style={{ opacity: isEditing ? 1 : 0.7 }}>
                <div className="flex items-center gap-3 mb-8 pb-5 border-b border-border-subtle">
                  <div className="p-3 bg-accent-light rounded-xl text-accent"><Save className="h-5 w-5" /></div>
                  <div>
                    <h2 className="text-sm font-black text-text-primary uppercase tracking-wider">Store Identity</h2>
                    <p className="text-[10px] text-text-muted mt-0.5">Basic store information</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">Store Name</label>
                    <input type="text" disabled={!isEditing} value={settings.store_name || ''} onChange={(e) => setSettings({...settings, store_name: e.target.value})} className="w-full px-5 py-4 bg-app-bg border border-border-main rounded-xl text-sm text-text-primary font-bold focus:outline-none focus:border-accent disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">Support Email</label>
                    <input type="email" disabled={!isEditing} value={settings.support_email || ''} onChange={(e) => setSettings({...settings, support_email: e.target.value})} className="w-full px-5 py-4 bg-app-bg border border-border-main rounded-xl text-sm text-text-primary font-bold focus:outline-none focus:border-accent disabled:opacity-50" />
                  </div>
                </div>
              </div>

              <div className="card rounded-2xl p-8 border border-border-main transition-opacity" style={{ opacity: isEditing ? 1 : 0.7 }}>
                <div className="flex items-center gap-3 mb-8 pb-5 border-b border-border-subtle">
                  <div className="p-3 bg-accent-light rounded-xl text-accent"><Truck className="h-5 w-5" /></div>
                  <div>
                    <h2 className="text-sm font-black text-text-primary uppercase tracking-wider">Shipping Rules</h2>
                    <p className="text-[10px] text-text-muted mt-0.5">Logistics cost configuration</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">Base Shipping Cost (₹)</label>
                    <input type="number" disabled={!isEditing} value={settings.shipping_cost} onChange={(e) => setSettings({...settings, shipping_cost: Number(e.target.value)})} className="w-full px-5 py-4 bg-app-bg border border-border-main rounded-xl text-sm text-text-primary font-bold focus:outline-none focus:border-accent disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">Free Shipping Threshold (₹)</label>
                    <input type="number" disabled={!isEditing} value={settings.free_shipping_threshold} onChange={(e) => setSettings({...settings, free_shipping_threshold: Number(e.target.value)})} className="w-full px-5 py-4 bg-app-bg border border-border-main rounded-xl text-sm text-text-primary font-bold focus:outline-none focus:border-accent disabled:opacity-50" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="card rounded-2xl p-8 border border-border-main transition-opacity" style={{ opacity: isEditing ? 1 : 0.7 }}>
                <div className="flex items-center gap-3 mb-8 pb-5 border-b border-border-subtle">
                  <div className="p-3 bg-status-success-bg rounded-xl text-status-success"><DollarSign className="h-5 w-5" /></div>
                  <div>
                    <h2 className="text-sm font-black text-text-primary uppercase tracking-wider">Financial & Orders</h2>
                    <p className="text-[10px] text-text-muted mt-0.5">Tax and inventory rules</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">Default Tax (%)</label>
                      <input type="number" disabled={!isEditing} value={settings.tax_rate} onChange={(e) => setSettings({...settings, tax_rate: Number(e.target.value)})} className="w-full px-5 py-4 bg-app-bg border border-border-main rounded-xl text-sm text-text-primary font-bold focus:outline-none focus:border-accent disabled:opacity-50" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">Low Stock Alert</label>
                      <input type="number" disabled={!isEditing} value={settings.low_stock_threshold || 5} onChange={(e) => setSettings({...settings, low_stock_threshold: Number(e.target.value)})} className="w-full px-5 py-4 bg-app-bg border border-border-main rounded-xl text-sm text-text-primary font-bold focus:outline-none focus:border-accent disabled:opacity-50" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">Order ID Prefix</label>
                    <input type="text" disabled={!isEditing} value={settings.order_prefix || 'ORD-'} onChange={(e) => setSettings({...settings, order_prefix: e.target.value})} className="w-full px-5 py-4 bg-app-bg border border-border-main rounded-xl text-sm text-text-primary font-bold focus:outline-none focus:border-accent disabled:opacity-50" />
                  </div>
                </div>
              </div>

              <div className="card rounded-2xl p-8 border border-status-danger/30 bg-gradient-to-br from-card-bg to-status-danger-bg/10 transition-opacity" style={{ opacity: isEditing ? 1 : 0.7 }}>
                <div className="flex items-center gap-3 mb-6 pb-5 border-b border-border-subtle">
                  <div className="p-3 bg-status-danger-bg rounded-xl text-status-danger"><Power className="h-5 w-5" /></div>
                  <div>
                    <h2 className="text-sm font-black text-text-primary uppercase tracking-wider">System Control</h2>
                    <p className="text-[10px] text-text-muted mt-0.5">Danger zone — be careful</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-black text-text-primary text-sm">Maintenance Mode</h3>
                    <p className="text-xs text-text-muted mt-1">Block public access when enabled</p>
                  </div>
                  <button onClick={() => isEditing && setSettings({...settings, maintenance_mode: !settings.maintenance_mode})} disabled={!isEditing} className={`w-14 h-7 rounded-full transition-colors relative flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${settings.maintenance_mode ? 'bg-status-danger' : 'bg-border-main'}`}>
                    <div className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${settings.maintenance_mode ? 'translate-x-7' : ''}`}></div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Profile Banner */}
          <div className="card rounded-2xl p-6 border border-border-main flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center text-white font-black text-3xl flex-shrink-0 shadow-lg shadow-accent/20">
              {avatarLetter}
            </div>
            <div>
              <h2 className="text-xl font-black text-text-primary">{profile.first_name} {profile.last_name}</h2>
              <p className="text-sm text-text-muted mt-1">{profile.email}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="px-2 py-0.5 bg-accent/10 text-accent text-[10px] font-black uppercase tracking-widest rounded-full">Super Admin</span>
                {user?.is_2fa_enabled && (
                  <span className="px-2 py-0.5 bg-status-success-bg text-status-success text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1">
                    <ShieldCheck className="h-2.5 w-2.5" /> 2FA Active
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Personal Details */}
              <div className="card rounded-2xl p-8 border border-border-main">
                <div className="flex items-center gap-3 mb-6 pb-5 border-b border-border-subtle">
                  <div className="p-2.5 bg-accent/10 rounded-xl text-accent"><User className="h-4 w-4" /></div>
                  <h2 className="text-sm font-black text-text-primary uppercase tracking-wider">Personal Details</h2>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">First Name</label>
                      <input type="text" value={profile.first_name} onChange={e => setProfile({...profile, first_name: e.target.value})} className="w-full px-4 py-3 bg-app-bg border border-border-main rounded-xl text-sm font-bold text-text-primary focus:border-accent outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Last Name</label>
                      <input type="text" value={profile.last_name} onChange={e => setProfile({...profile, last_name: e.target.value})} className="w-full px-4 py-3 bg-app-bg border border-border-main rounded-xl text-sm font-bold text-text-primary focus:border-accent outline-none transition-colors" />
                    </div>
                  </div>

                  {/* Email - locked when verified, editable after clicking Change */}
                  <div>
                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Email</label>
                    
                    {/* Verified + locked state */}
                    {user?.email_verified && !editingEmail ? (
                      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                        <div className="flex-1 min-w-0 w-full px-4 py-3 bg-app-bg border border-border-main rounded-xl text-sm font-bold text-text-muted flex items-center overflow-hidden">
                          <span className="truncate">{profile.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-2 bg-status-success-bg text-status-success rounded-xl text-[10px] font-black uppercase tracking-wider flex-shrink-0">
                          <CheckCircle className="h-3.5 w-3.5" /> Verified
                        </div>
                        <button
                          onClick={() => { setEditingEmail(true); setEmailChanged(true); setEmailOtpSent(false); setEmailOtp(''); }}
                          className="px-3 py-2 border-2 border-border-main hover:border-accent text-text-muted hover:text-accent rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex-shrink-0"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      /* Edit mode */
                      <div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="email"
                            value={newEmail}
                            onChange={e => { setNewEmail(e.target.value); setEmailChanged(e.target.value !== profile.email); setEmailOtpSent(false); setEmailOtp(''); }}
                            className="flex-1 min-w-0 w-full px-4 py-3 bg-app-bg border border-accent rounded-xl text-sm font-bold text-text-primary focus:border-accent outline-none transition-colors"
                            autoFocus={editingEmail}
                          />
                          <button onClick={handleSendEmailOtp} disabled={verifying || emailOtpSent || !newEmail} className="px-3 py-2 bg-accent/10 text-accent hover:bg-accent hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex-shrink-0 disabled:opacity-50 flex items-center gap-1.5">
                            <Send className="h-3.5 w-3.5" /> {emailOtpSent ? 'Sent' : 'Send OTP'}
                          </button>
                          {editingEmail && (
                            <button onClick={() => { setEditingEmail(false); setEmailChanged(false); setNewEmail(profile.email); setEmailOtpSent(false); setEmailOtp(''); }} className="px-3 py-2 border-2 border-border-main rounded-xl text-[10px] font-black text-text-muted hover:text-text-primary uppercase tracking-wider transition-all flex-shrink-0">
                              Cancel
                            </button>
                          )}
                        </div>
                        {emailOtpSent && (
                          <div className="flex gap-2 mt-2">
                            <input type="text" value={emailOtp} onChange={e => setEmailOtp(e.target.value)} placeholder="Enter 6-digit OTP" maxLength={6} className="flex-1 px-4 py-3 bg-app-bg border border-accent rounded-xl text-sm font-bold font-mono tracking-widest text-text-primary focus:outline-none" />
                            <button onClick={handleVerifyEmail} disabled={verifying || emailOtp.length !== 6} className="px-4 py-2 btn-premium rounded-xl text-xs font-bold flex-shrink-0 disabled:opacity-50">Confirm</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Phone with verify */}
                  <div>
                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Mobile Number</label>
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                      <input type="text" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} placeholder="+91 98765 43210" className="flex-1 min-w-0 w-full px-4 py-3 bg-app-bg border border-border-main rounded-xl text-sm font-bold text-text-primary focus:border-accent outline-none transition-colors" />
                      {user?.phone_verified ? (
                        <div className="flex items-center gap-1.5 px-3 py-2 bg-status-success-bg text-status-success rounded-xl text-[10px] font-black uppercase tracking-wider flex-shrink-0">
                          <CheckCircle className="h-3.5 w-3.5" /> Verified
                        </div>
                      ) : (
                        <button onClick={handleSendPhoneOtp} disabled={verifying || phoneOtpSent || !profile.phone} className="px-3 py-2 bg-accent/10 text-accent hover:bg-accent hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex-shrink-0 disabled:opacity-50 flex items-center gap-1.5">
                          <Send className="h-3.5 w-3.5" /> {phoneOtpSent ? 'OTP Sent' : 'Verify'}
                        </button>
                      )}
                    </div>
                    {phoneOtpSent && (
                      <div className="flex gap-2 mt-2">
                        <input type="text" value={phoneOtp} onChange={e => setPhoneOtp(e.target.value)} placeholder="Enter 6-digit OTP" maxLength={6} className="flex-1 px-4 py-3 bg-app-bg border border-accent rounded-xl text-sm font-bold font-mono tracking-widest text-text-primary focus:outline-none" />
                        <button onClick={handleVerifyPhone} disabled={verifying || phoneOtp.length !== 6} className="px-4 py-2 btn-premium rounded-xl text-xs font-bold flex-shrink-0 disabled:opacity-50">Confirm</button>
                      </div>
                    )}
                  </div>

                  <button onClick={handleProfileSave} disabled={saving} className="mt-2 btn-premium px-6 py-3 rounded-xl w-full text-sm font-bold flex justify-center items-center gap-2 disabled:opacity-60">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Profile
                  </button>
                </div>
              </div>

              {/* Notification Preferences */}
              <div className="card rounded-2xl p-8 border border-border-main">
                <div className="flex items-center gap-3 mb-6 pb-5 border-b border-border-subtle">
                  <div className="p-2.5 bg-accent/10 rounded-xl text-accent"><Bell className="h-4 w-4" /></div>
                  <h2 className="text-sm font-black text-text-primary uppercase tracking-wider">Notifications</h2>
                </div>
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-text-primary">Email Notifications</p>
                      <p className="text-xs text-text-muted mt-0.5">Daily summaries & new order alerts</p>
                    </div>
                    <button
                      onClick={() => setProfile({...profile, email_notifications: !profile.email_notifications})}
                      className={`w-12 h-6 rounded-full transition-all duration-300 relative flex-shrink-0 ${profile.email_notifications ? 'bg-accent shadow-md shadow-accent/30' : 'bg-border-main'}`}
                    >
                      <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${profile.email_notifications ? 'translate-x-6' : ''}`}></div>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-text-primary">SMS Alerts</p>
                      <p className="text-xs text-text-muted mt-0.5">Critical system events via SMS</p>
                    </div>
                    <button
                      onClick={() => setProfile({...profile, sms_notifications: !profile.sms_notifications})}
                      className={`w-12 h-6 rounded-full transition-all duration-300 relative flex-shrink-0 ${profile.sms_notifications ? 'bg-accent shadow-md shadow-accent/30' : 'bg-border-main'}`}
                    >
                      <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${profile.sms_notifications ? 'translate-x-6' : ''}`}></div>
                    </button>
                  </div>
                  <button onClick={handleProfileSave} disabled={saving} className="w-full mt-2 py-3 rounded-xl border-2 border-border-main text-sm font-bold text-text-primary hover:border-accent hover:text-accent transition-all flex items-center justify-center gap-2">
                    <Save className="h-4 w-4" /> Save Preferences
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Two-Factor Auth */}
              <div className="card rounded-2xl p-8 border border-border-main">
                <div className="flex items-center gap-3 mb-6 pb-5 border-b border-border-subtle">
                  <div className={`p-2.5 rounded-xl ${user?.is_2fa_enabled ? 'bg-status-success-bg text-status-success' : 'bg-accent/10 text-accent'}`}>
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm font-black text-text-primary uppercase tracking-wider">Two-Factor Authentication</h2>
                </div>

                {user?.is_2fa_enabled ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-status-success-bg rounded-xl border border-status-success/20">
                      <ShieldCheck className="h-5 w-5 text-status-success flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-status-success">2FA is Active</p>
                        <p className="text-xs text-status-success/70 mt-1">
                          Method: <span className="font-bold">{user.two_factor_type === 'authenticator' ? 'Authenticator App' : 'Email OTP'}</span>
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setShow2FA(true)} className="w-full py-3 rounded-xl border-2 border-status-danger/40 text-status-danger text-sm font-bold hover:bg-status-danger hover:text-white transition-all flex items-center justify-center gap-2">
                      <ShieldOff className="h-4 w-4" /> Manage / Disable 2FA
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-status-warning-bg rounded-xl border border-status-warning/20">
                      <ShieldOff className="h-5 w-5 text-status-warning flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-status-warning">2FA Not Enabled</p>
                        <p className="text-xs text-status-warning/70 mt-1">Your admin account is not protected. Enable 2FA for maximum security.</p>
                      </div>
                    </div>
                    <button onClick={() => setShow2FA(true)} className="w-full py-3 rounded-xl btn-premium text-sm font-bold flex items-center justify-center gap-2">
                      <ShieldCheck className="h-4 w-4" /> Setup Two-Factor Auth
                    </button>
                  </div>
                )}
              </div>

              {/* Change Password */}
              <div className="card rounded-2xl p-8 border border-border-main">
                <div className="flex items-center gap-3 mb-6 pb-5 border-b border-border-subtle">
                  <div className="p-2.5 bg-accent/10 rounded-xl text-accent"><Lock className="h-4 w-4" /></div>
                  <h2 className="text-sm font-black text-text-primary uppercase tracking-wider">Change Password</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Current Password</label>
                    <input type="password" value={passwords.currentPassword} onChange={e => setPasswords({...passwords, currentPassword: e.target.value})} className="w-full px-4 py-3 bg-app-bg border border-border-main rounded-xl text-sm font-bold text-text-primary focus:border-accent outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">New Password</label>
                    <input type="password" value={passwords.newPassword} onChange={e => setPasswords({...passwords, newPassword: e.target.value})} className="w-full px-4 py-3 bg-app-bg border border-border-main rounded-xl text-sm font-bold text-text-primary focus:border-accent outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Confirm New Password</label>
                    <input type="password" value={passwords.confirmPassword} onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})} className="w-full px-4 py-3 bg-app-bg border border-border-main rounded-xl text-sm font-bold text-text-primary focus:border-accent outline-none transition-colors" />
                  </div>
                  <button onClick={handlePasswordChange} disabled={saving} className="w-full py-3 rounded-xl border-2 border-border-main text-sm font-bold text-text-primary hover:border-accent hover:text-accent transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Update Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real 2FA Modal */}
      <TwoFactorSettingsModal show={show2FA} onClose={() => setShow2FA(false)} />
    </div>
  );
};

export default AdminSettings;
