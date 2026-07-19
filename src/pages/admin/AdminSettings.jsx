import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import apiClient from '../../services/api.client';
import { Save, Truck, DollarSign, Power, Loader2, ShieldCheck, ShieldOff, KeyRound, Bell, User, Lock, CheckCircle, XCircle, Send, Settings, ArrowRight, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import TwoFactorSettingsModal from '../../components/profile/TwoFactorSettingsModal';
import { sendVerification, verifyMobile, verifyEmailOtp, getGiftcardSettings, updateGiftcardSettings } from '../../services/api';
import { Gift, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

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
  const [initialSettings, setInitialSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiClient.get('/settings');
        setSettings(res.data);
        setInitialSettings(res.data);
      } catch (error) {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Gift Card Settings State
  const [giftcardTiers, setGiftcardTiers] = useState([]);
  const [initialGiftcardTiers, setInitialGiftcardTiers] = useState([]);
  const [isGCEditing, setIsGCEditing] = useState(false);

  useEffect(() => {
    const fetchGC = async () => {
      try {
        const res = await getGiftcardSettings();
        setGiftcardTiers(res.data.tiers || []);
        setInitialGiftcardTiers(res.data.tiers || []);
      } catch (err) {
        console.error("Failed to load giftcard settings", err);
      }
    }
    fetchGC();
  }, []);

  const handleSaveGC = async () => {
    setSaving(true);
    try {
      await updateGiftcardSettings({ tiers: giftcardTiers });
      setInitialGiftcardTiers(giftcardTiers);
      setIsGCEditing(false);
      toast.success('Gift card settings saved!');
    } catch (err) {
      toast.error('Failed to update giftcard settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (JSON.stringify(settings) === JSON.stringify(initialSettings)) {
      toast.error('No changes to save');
      return;
    }
    if (settings.shipping_cost < 0 || settings.free_shipping_threshold < 0 || settings.tax_rate < 0) {
      toast.error('Financial values cannot be negative');
      return;
    }
    if (!settings.store_name?.trim() || !settings.support_email?.trim() || !settings.order_prefix?.trim()) {
      toast.error('Store identity fields cannot be empty');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(settings.support_email)) {
      toast.error('Please enter a valid support email');
      return;
    }

    setSaving(true);
    try {
      await apiClient.put('/settings', settings);
      setInitialSettings(settings);
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
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const { user, updateUserSession } = useAuth();

  const getInitialProfile = () => ({
    first_name: user?.first_name || user?.name?.split(' ')[0] || '',
    last_name: user?.last_name || user?.name?.split(' ').slice(1).join(' ') || '',
    phone: user?.phone || '',
    email: user?.email || '',
    email_notifications: user?.email_notifications ?? true,
    sms_notifications: user?.sms_notifications ?? false,
  });

  const [profile, setProfile] = useState(getInitialProfile());
  const [initialProfile, setInitialProfile] = useState(getInitialProfile());
  
  useEffect(() => {
    if (user) {
      setInitialProfile(getInitialProfile());
    }
  }, [user?.first_name, user?.last_name, user?.phone, user?.email, user?.email_notifications, user?.sms_notifications]);

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Email/Phone verification state
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [emailChanged, setEmailChanged] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false); // unlocks email field after verified
  const [editingPhone, setEditingPhone] = useState(false); // unlocks phone field after verified
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleSendEmailOtp = async () => {
    const emailToVerify = newEmail || profile.email;
    if (!emailToVerify || !/^\S+@\S+\.\S+$/.test(emailToVerify)) {
      toast.error('Please enter a valid email address');
      return;
    }
    setVerifying(true);
    try {
      // Send OTP to the NEW email they want to use
      await sendVerification(emailToVerify, 'email');
      setEmailOtpSent(true);
      toast.success('OTP sent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send OTP');
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
    if (!profile.phone || profile.phone.length < 10) { 
      toast.error('Please enter a valid phone number'); 
      return; 
    }
    setVerifying(true);
    try {
      if (profile.phone !== user?.phone) {
        await apiClient.put(`/users/${user._id}/profile`, profile);
      }
      await sendVerification(profile.email, 'mobile');
      setPhoneOtpSent(true);
      toast.success('OTP sent to your phone!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send OTP');
    }
    setVerifying(false);
  };

  const handleVerifyPhone = async () => {
    setVerifying(true);
    try {
      await verifyMobile(profile.email, phoneOtp);
      updateUserSession({ ...user, phone: profile.phone, phone_verified: true });
      setInitialProfile(p => ({ ...p, phone: profile.phone }));
      setPhoneOtpSent(false);
      setEditingPhone(false);
      setPhoneOtp('');
      toast.success('Phone verified successfully!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid OTP');
    }
    setVerifying(false);
  };

  const personalDetailsChanged = 
    profile.first_name !== initialProfile.first_name ||
    profile.last_name !== initialProfile.last_name ||
    profile.phone !== initialProfile.phone ||
    profile.email !== initialProfile.email;

  const notificationsChanged = 
    profile.email_notifications !== initialProfile.email_notifications ||
    profile.sms_notifications !== initialProfile.sms_notifications;

  const handleProfileSave = async () => {
    if (!personalDetailsChanged && !notificationsChanged) {
      toast.error('No changes to save');
      return;
    }
    if (!profile.first_name?.trim() || !profile.last_name?.trim()) {
      toast.error('First and last name are required');
      return;
    }
    if (!profile.phone || profile.phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setSaving(true);
    try {
      const res = await apiClient.put(`/users/${user._id}/profile`, profile);
      // Merge API response with current session to preserve verified flags
      updateUserSession({ ...user, ...res.data.user });
      setInitialProfile(profile);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwords.currentPassword) {
      toast.error('Current password is required');
      return;
    }
    if (!passwords.newPassword || passwords.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }
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

  const inputCls = "w-full px-4 py-3 bg-app-bg border border-border-main rounded-xl text-sm font-bold text-text-primary outline-none focus:bg-card-bg focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-text-muted disabled:opacity-50 disabled:cursor-not-allowed";

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-10 h-10 animate-spin text-accent" />
    </div>
  );

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-subtle pb-6">
        <div>
          <p className="text-[10px] font-black text-accent uppercase tracking-[0.25em] mb-1">System Settings</p>
          <h1 className="text-3xl font-black text-text-primary tracking-tighter">
            Store & <span className="text-accent">Account</span>
          </h1>
        </div>
        
        {/* Tab Navigation */}
        <div className="bg-app-bg border border-border-main p-1 rounded-xl shadow-inner w-full sm:w-auto">
          <div className="grid grid-cols-3 w-full">
            <button
              onClick={() => setActiveTab('config')}
              className={`px-2 py-2.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-200 whitespace-nowrap text-center ${
                activeTab === 'config' ? 'bg-accent text-white shadow-lg shadow-accent/30' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Configuration
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-2 py-2.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-200 whitespace-nowrap text-center ${
                activeTab === 'profile' ? 'bg-accent text-white shadow-lg shadow-accent/30' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Admin Profile
            </button>
            <button
              onClick={() => setActiveTab('giftcards')}
              className={`px-2 py-2.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-200 whitespace-nowrap text-center ${
                activeTab === 'giftcards' ? 'bg-accent text-white shadow-lg shadow-accent/30' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Gift Cards
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'config' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          
          {/* Action Bar */}
          <div className="flex justify-end gap-3">
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} 
                className="flex items-center gap-2 px-5 py-2.5 bg-app-bg border-2 border-accent text-accent hover:bg-accent hover:text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-sm">
                <Edit2 className="w-4 h-4" /> Enable Editing
              </button>
            ) : (
              <>
                <button onClick={() => { setIsEditing(false); setSettings(initialSettings); }} 
                  className="px-5 py-2.5 bg-app-bg border border-border-main text-text-muted hover:text-text-primary font-black text-xs uppercase tracking-widest rounded-xl transition-all">
                  Cancel
                </button>
                <button onClick={() => { handleSave(); setIsEditing(false); }} disabled={saving || JSON.stringify(settings) === JSON.stringify(initialSettings)} 
                  className="flex items-center gap-2 px-6 py-2.5 bg-status-success text-white hover:bg-status-success/90 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-status-success/20 disabled:opacity-60">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
                </button>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="space-y-6">
              {/* Store Identity */}
              <div className="card rounded-2xl p-6 border border-border-main relative overflow-hidden transition-all duration-300" style={{ opacity: isEditing ? 1 : 0.8 }}>
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 blur-xl bg-accent" />
                <div className="flex items-center gap-4 mb-6 pb-5 border-b border-border-subtle">
                  <div className="p-3 bg-accent/10 rounded-xl text-accent"><Settings className="h-5 w-5" /></div>
                  <div>
                    <h2 className="text-sm font-black text-text-primary uppercase tracking-wider">Store Identity</h2>
                    <p className="text-[10px] text-text-muted font-bold mt-0.5">Basic store information</p>
                  </div>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Store Name</label>
                    <input type="text" maxLength={50} disabled={!isEditing} value={settings.store_name || ''} onChange={(e) => setSettings({...settings, store_name: e.target.value})} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Support Email</label>
                    <input type="email" maxLength={100} disabled={!isEditing} value={settings.support_email || ''} onChange={(e) => setSettings({...settings, support_email: e.target.value})} className={inputCls} />
                  </div>
                </div>
              </div>

              {/* Shipping Rules */}
              <div className="card rounded-2xl p-6 border border-border-main relative overflow-hidden transition-all duration-300" style={{ opacity: isEditing ? 1 : 0.8 }}>
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 blur-xl bg-[#0891b2]" />
                <div className="flex items-center gap-4 mb-6 pb-5 border-b border-border-subtle">
                  <div className="p-3 bg-[#0891b2]10 rounded-xl text-[#0891b2]" style={{ background: '#0891b220' }}><Truck className="h-5 w-5" /></div>
                  <div>
                    <h2 className="text-sm font-black text-text-primary uppercase tracking-wider">Shipping Rules</h2>
                    <p className="text-[10px] text-text-muted font-bold mt-0.5">Logistics cost configuration</p>
                  </div>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Base Shipping Cost (₹)</label>
                    <input type="number" min={0} disabled={!isEditing} value={settings.shipping_cost} onChange={(e) => setSettings({...settings, shipping_cost: Number(e.target.value)})} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Free Shipping Threshold (₹)</label>
                    <input type="number" min={0} disabled={!isEditing} value={settings.free_shipping_threshold} onChange={(e) => setSettings({...settings, free_shipping_threshold: Number(e.target.value)})} className={inputCls} />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Financial & Orders */}
              <div className="card rounded-2xl p-6 border border-border-main relative overflow-hidden transition-all duration-300" style={{ opacity: isEditing ? 1 : 0.8 }}>
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 blur-xl bg-status-success" />
                <div className="flex items-center gap-4 mb-6 pb-5 border-b border-border-subtle">
                  <div className="p-3 bg-status-success-bg rounded-xl text-status-success"><DollarSign className="h-5 w-5" /></div>
                  <div>
                    <h2 className="text-sm font-black text-text-primary uppercase tracking-wider">Financial & Orders</h2>
                    <p className="text-[10px] text-text-muted font-bold mt-0.5">Tax and inventory rules</p>
                  </div>
                </div>
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Default Tax (%)</label>
                      <input type="number" min={0} max={100} disabled={!isEditing} value={settings.tax_rate} onChange={(e) => setSettings({...settings, tax_rate: Number(e.target.value)})} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Low Stock Alert</label>
                      <input type="number" min={0} disabled={!isEditing} value={settings.low_stock_threshold || 5} onChange={(e) => setSettings({...settings, low_stock_threshold: Number(e.target.value)})} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Order ID Prefix</label>
                    <input type="text" maxLength={10} disabled={!isEditing} value={settings.order_prefix || 'ORD-'} onChange={(e) => setSettings({...settings, order_prefix: e.target.value})} className={inputCls} />
                  </div>
                </div>
              </div>

              {/* System Control */}
              <div className="card rounded-2xl p-6 border border-status-danger/30 relative overflow-hidden transition-all duration-300" style={{ opacity: isEditing ? 1 : 0.8 }}>
                <div className="absolute inset-0 bg-status-danger/5" />
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 blur-xl bg-status-danger" />
                <div className="relative z-10 flex items-center gap-4 mb-6 pb-5 border-b border-status-danger/20">
                  <div className="p-3 bg-status-danger-bg rounded-xl text-status-danger"><Power className="h-5 w-5" /></div>
                  <div>
                    <h2 className="text-sm font-black text-status-danger uppercase tracking-wider">System Control</h2>
                    <p className="text-[10px] text-status-danger/70 font-bold mt-0.5">Danger zone — be careful</p>
                  </div>
                </div>
                <div className="relative z-10 flex items-center justify-between gap-4 p-4 rounded-xl bg-card-bg border border-status-danger/20">
                  <div>
                    <h3 className="font-black text-text-primary text-sm">Maintenance Mode</h3>
                    <p className="text-[10px] text-text-muted font-bold mt-1">Block public access when enabled</p>
                  </div>
                  <button onClick={() => isEditing && setSettings({...settings, maintenance_mode: !settings.maintenance_mode})} disabled={!isEditing} 
                    className={`w-14 h-7 rounded-full transition-all duration-300 relative flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed border ${
                      settings.maintenance_mode ? 'bg-status-danger border-status-danger' : 'bg-app-bg border-border-main'
                    }`}>
                    <div className={`absolute top-[2px] left-[2px] w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${settings.maintenance_mode ? 'translate-x-7' : ''}`}></div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'profile' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

          {/* Action Bar */}
          <div className="flex justify-end gap-3">
            {!isProfileEditing ? (
              <button onClick={() => setIsProfileEditing(true)} 
                className="flex items-center gap-2 px-5 py-2.5 bg-app-bg border-2 border-accent text-accent hover:bg-accent hover:text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-sm">
                <Edit2 className="w-4 h-4" /> Edit Profile
              </button>
            ) : (
              <>
                <button onClick={() => { setIsProfileEditing(false); setProfile(initialProfile); setEditingEmail(false); setEditingPhone(false); }} 
                  className="px-5 py-2.5 bg-app-bg border border-border-main text-text-muted hover:text-text-primary font-black text-xs uppercase tracking-widest rounded-xl transition-all">
                  Cancel
                </button>
                <button onClick={() => { handleProfileSave(); setIsProfileEditing(false); }} disabled={saving || (!personalDetailsChanged && !notificationsChanged)} 
                  className="flex items-center gap-2 px-6 py-2.5 bg-status-success text-white hover:bg-status-success/90 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-status-success/20 disabled:opacity-60">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
                </button>
              </>
            )}
          </div>

          {/* Profile Banner */}
          <div className="card rounded-2xl p-6 border border-border-main flex items-center gap-6 relative overflow-hidden">
             <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full opacity-10 blur-3xl bg-accent" />
            <div className="w-20 h-20 rounded-2xl bg-accent flex items-center justify-center text-white font-black text-3xl flex-shrink-0 shadow-lg shadow-accent/30 z-10">
              {avatarLetter}
            </div>
            <div className="z-10">
              <h2 className="text-xl font-black text-text-primary">{profile.first_name} {profile.last_name}</h2>
              <p className="text-sm font-bold text-text-muted mt-1">{profile.email}</p>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="px-2.5 py-1 bg-accent/10 text-accent border border-accent/20 text-[9px] font-black uppercase tracking-widest rounded-lg">Super Admin</span>
                {user?.is_2fa_enabled && (
                  <span className="px-2.5 py-1 bg-status-success-bg text-status-success border border-status-success/20 text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5">
                    <ShieldCheck className="h-3 w-3" /> 2FA Active
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Personal Details */}
              <div className="card rounded-2xl p-6 border border-border-main">
                <div className="flex items-center gap-4 mb-6 pb-5 border-b border-border-subtle">
                  <div className="p-3 bg-accent/10 rounded-xl text-accent"><User className="h-5 w-5" /></div>
                  <h2 className="text-sm font-black text-text-primary uppercase tracking-wider">Personal Details</h2>
                </div>
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">First Name</label>
                      <input type="text" maxLength={50} disabled={!isProfileEditing} value={profile.first_name} onChange={e => setProfile({...profile, first_name: e.target.value})} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Last Name</label>
                      <input type="text" maxLength={50} disabled={!isProfileEditing} value={profile.last_name} onChange={e => setProfile({...profile, last_name: e.target.value})} className={inputCls} />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Email</label>
                    {user?.email_verified && !editingEmail ? (
                      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                        <div className="flex-1 px-4 py-3 bg-app-bg border border-border-main rounded-xl text-sm font-bold text-text-muted">
                          {profile.email}
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-2 bg-status-success-bg border border-status-success/20 text-status-success rounded-xl text-[10px] font-black uppercase tracking-wider flex-shrink-0">
                          <CheckCircle className="h-3.5 w-3.5" /> Verified
                        </div>
                        <button onClick={() => { setEditingEmail(true); setEmailChanged(true); setEmailOtpSent(false); setEmailOtp(''); }} disabled={!isProfileEditing}
                          className="px-4 py-2 border border-border-main hover:border-accent text-text-muted hover:text-accent rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex-shrink-0 bg-app-bg hover:bg-accent/10 disabled:opacity-50 disabled:cursor-not-allowed">
                          Change
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input type="email" maxLength={100} value={newEmail} onChange={e => { setNewEmail(e.target.value); setEmailChanged(e.target.value !== profile.email); setEmailOtpSent(false); setEmailOtp(''); }}
                            className={`${inputCls} flex-1`} autoFocus={editingEmail} />
                          <button onClick={handleSendEmailOtp} disabled={verifying || emailOtpSent || !newEmail} 
                            className="px-4 py-2 bg-accent/10 border border-accent/20 text-accent hover:bg-accent hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex-shrink-0 disabled:opacity-50 flex items-center gap-1.5">
                            <Send className="h-3.5 w-3.5" /> {emailOtpSent ? 'Sent' : 'Send OTP'}
                          </button>
                          {editingEmail && (
                            <button onClick={() => { setEditingEmail(false); setEmailChanged(false); setNewEmail(profile.email); setEmailOtpSent(false); setEmailOtp(''); }} 
                              className="px-4 py-2 bg-app-bg border border-border-main text-text-muted hover:text-text-primary rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex-shrink-0">
                              Cancel
                            </button>
                          )}
                        </div>
                        {emailOtpSent && (
                          <div className="flex gap-3 mt-3">
                            <input type="text" value={emailOtp} onChange={e => setEmailOtp(e.target.value)} placeholder="Enter 6-digit OTP" maxLength={6} 
                              className={`${inputCls} flex-1 font-mono tracking-[0.5em] text-center`} />
                            <button onClick={handleVerifyEmail} disabled={verifying || emailOtp.length !== 6} 
                              className="px-6 py-2 bg-accent text-white hover:bg-accent/90 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex-shrink-0 disabled:opacity-50 shadow-md">
                              Confirm
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Mobile Number</label>
                    {user?.phone_verified && !editingPhone ? (
                      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                        <div className="flex-1 px-4 py-3 bg-app-bg border border-border-main rounded-xl text-sm font-bold text-text-muted">
                          {profile.phone}
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-2 bg-status-success-bg border border-status-success/20 text-status-success rounded-xl text-[10px] font-black uppercase tracking-wider flex-shrink-0">
                          <CheckCircle className="h-3.5 w-3.5" /> Verified
                        </div>
                        <button onClick={() => { setEditingPhone(true); setPhoneOtpSent(false); setPhoneOtp(''); }} disabled={!isProfileEditing}
                          className="px-4 py-2 border border-border-main hover:border-accent text-text-muted hover:text-accent rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex-shrink-0 bg-app-bg hover:bg-accent/10 disabled:opacity-50 disabled:cursor-not-allowed">
                          Change
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input type="text" maxLength={10} value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value.replace(/\D/g, '')})} placeholder="9876543210" className={`${inputCls} flex-1`} autoFocus={editingPhone} />
                          <button onClick={handleSendPhoneOtp} disabled={verifying || phoneOtpSent || !profile.phone} 
                            className="px-4 py-2 bg-accent/10 border border-accent/20 text-accent hover:bg-accent hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex-shrink-0 disabled:opacity-50 flex items-center gap-1.5">
                            <Send className="h-3.5 w-3.5" /> {phoneOtpSent ? 'OTP Sent' : 'Verify'}
                          </button>
                          {editingPhone && (
                            <button onClick={() => { setEditingPhone(false); setProfile({...profile, phone: user.phone}); setPhoneOtpSent(false); setPhoneOtp(''); }} 
                              className="px-4 py-2 bg-app-bg border border-border-main text-text-muted hover:text-text-primary rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex-shrink-0">
                              Cancel
                            </button>
                          )}
                        </div>
                        {phoneOtpSent && (
                          <div className="flex gap-3 mt-3">
                            <input type="text" value={phoneOtp} onChange={e => setPhoneOtp(e.target.value)} placeholder="Enter 6-digit OTP" maxLength={6} 
                              className={`${inputCls} flex-1 font-mono tracking-[0.5em] text-center`} />
                            <button onClick={handleVerifyPhone} disabled={verifying || phoneOtp.length !== 6} 
                              className="px-6 py-2 bg-accent text-white hover:bg-accent/90 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex-shrink-0 disabled:opacity-50 shadow-md">
                              Confirm
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notification Preferences */}
              <div className="card rounded-2xl p-6 border border-border-main">
                <div className="flex items-center gap-4 mb-6 pb-5 border-b border-border-subtle">
                  <div className="p-3 bg-[#d97706]10 rounded-xl text-[#d97706]" style={{ background: '#d9770620' }}><Bell className="h-5 w-5" /></div>
                  <h2 className="text-sm font-black text-text-primary uppercase tracking-wider">Notifications</h2>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-app-bg border border-border-main">
                    <div>
                      <p className="text-sm font-black text-text-primary">Email Notifications</p>
                      <p className="text-[10px] font-bold text-text-muted mt-1">Daily summaries & new order alerts</p>
                    </div>
                    <button onClick={() => isProfileEditing && setProfile({...profile, email_notifications: !profile.email_notifications})} disabled={!isProfileEditing}
                      className={`w-12 h-6 rounded-full transition-all duration-300 relative flex-shrink-0 border disabled:opacity-50 disabled:cursor-not-allowed ${
                        profile.email_notifications ? 'bg-accent border-accent' : 'bg-card-bg border-border-main'
                      }`}>
                      <div className={`absolute top-[2px] left-[2px] w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${profile.email_notifications ? 'translate-x-6' : ''}`}></div>
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-app-bg border border-border-main">
                    <div>
                      <p className="text-sm font-black text-text-primary">SMS Alerts</p>
                      <p className="text-[10px] font-bold text-text-muted mt-1">Critical system events via SMS</p>
                    </div>
                    <button onClick={() => isProfileEditing && setProfile({...profile, sms_notifications: !profile.sms_notifications})} disabled={!isProfileEditing}
                      className={`w-12 h-6 rounded-full transition-all duration-300 relative flex-shrink-0 border disabled:opacity-50 disabled:cursor-not-allowed ${
                        profile.sms_notifications ? 'bg-accent border-accent' : 'bg-card-bg border-border-main'
                      }`}>
                      <div className={`absolute top-[2px] left-[2px] w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${profile.sms_notifications ? 'translate-x-6' : ''}`}></div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Two-Factor Auth */}
              <div className="card rounded-2xl p-6 border border-border-main relative overflow-hidden">
                <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 blur-xl ${user?.is_2fa_enabled ? 'bg-status-success' : 'bg-status-warning'}`} />
                <div className="flex items-center gap-4 mb-6 pb-5 border-b border-border-subtle relative z-10">
                  <div className={`p-3 rounded-xl ${user?.is_2fa_enabled ? 'bg-status-success-bg text-status-success' : 'bg-status-warning-bg text-status-warning'}`}>
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h2 className="text-sm font-black text-text-primary uppercase tracking-wider">Two-Factor Auth</h2>
                </div>

                <div className="relative z-10">
                  {user?.is_2fa_enabled ? (
                    <div className="space-y-5">
                      <div className="flex items-start gap-4 p-5 bg-status-success-bg rounded-xl border border-status-success/20">
                        <ShieldCheck className="h-6 w-6 text-status-success flex-shrink-0" />
                        <div>
                          <p className="text-sm font-black text-status-success">2FA is Active</p>
                          <p className="text-[10px] font-bold text-status-success/70 mt-1 uppercase tracking-widest">
                            Method: {user.two_factor_type === 'authenticator' ? 'Authenticator App' : 'Email OTP'}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => setShow2FA(true)} 
                        className="w-full py-3.5 bg-app-bg border border-border-main text-text-muted hover:text-status-danger hover:border-status-danger/30 hover:bg-status-danger-bg font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2">
                        <ShieldOff className="h-4 w-4" /> Manage / Disable
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="flex items-start gap-4 p-5 bg-status-warning-bg rounded-xl border border-status-warning/20">
                        <ShieldOff className="h-6 w-6 text-status-warning flex-shrink-0" />
                        <div>
                          <p className="text-sm font-black text-status-warning">2FA Not Enabled</p>
                          <p className="text-[10px] font-bold text-status-warning/80 mt-1 leading-relaxed">
                            Your admin account is not protected. Enable two-factor authentication to secure your account.
                          </p>
                        </div>
                      </div>
                      <button onClick={() => setShow2FA(true)} 
                        className="w-full py-3.5 bg-accent hover:bg-accent/90 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2">
                        <ShieldCheck className="h-4 w-4" /> Setup 2FA Now
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Change Password */}
              <div className="card rounded-2xl p-6 border border-border-main">
                <div className="flex items-center gap-4 mb-6 pb-5 border-b border-border-subtle">
                  <div className="p-3 bg-[#8b5cf6]10 rounded-xl text-[#8b5cf6]" style={{ background: '#8b5cf620' }}><Lock className="h-5 w-5" /></div>
                  <h2 className="text-sm font-black text-text-primary uppercase tracking-wider">Change Password</h2>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Current Password</label>
                    <input type="password" value={passwords.currentPassword} onChange={e => setPasswords({...passwords, currentPassword: e.target.value})} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">New Password</label>
                    <input type="password" value={passwords.newPassword} onChange={e => setPasswords({...passwords, newPassword: e.target.value})} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Confirm New Password</label>
                    <input type="password" value={passwords.confirmPassword} onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})} className={inputCls} />
                  </div>
                  <button onClick={handlePasswordChange} disabled={saving || !passwords.currentPassword || !passwords.newPassword} 
                    className={`w-full mt-2 py-3.5 font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${
                      saving || !passwords.currentPassword || !passwords.newPassword
                        ? 'bg-app-bg border border-border-main text-text-muted opacity-60 cursor-not-allowed'
                        : 'bg-[#8b5cf6] hover:bg-[#7c3aed] text-white shadow-lg shadow-[#8b5cf6]/20'
                    }`}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Update Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'giftcards' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="flex justify-end gap-3">
            {!isGCEditing ? (
              <button onClick={() => setIsGCEditing(true)} 
                className="px-6 py-3 bg-app-bg border border-border-main text-text-primary font-black text-xs uppercase tracking-widest rounded-xl hover:border-accent hover:text-accent transition-all flex items-center gap-2">
                <Edit2 className="h-4 w-4" /> Edit Configuration
              </button>
            ) : (
              <>
                <button onClick={() => { setGiftcardTiers(initialGiftcardTiers); setIsGCEditing(false); }} 
                  className="px-6 py-3 bg-app-bg border border-border-main text-text-muted font-black text-xs uppercase tracking-widest rounded-xl hover:bg-surface transition-all flex items-center gap-2">
                  <XCircle className="h-4 w-4" /> Cancel
                </button>
                <button onClick={handleSaveGC} disabled={saving}
                  className="px-6 py-3 bg-[#10b981] hover:bg-[#059669] text-white shadow-lg shadow-[#10b981]/20 font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
                </button>
              </>
            )}
          </div>

          <div className="bg-card-bg border border-border-main rounded-[32px] overflow-hidden shadow-sm p-6 sm:p-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-6 border-b border-border-subtle gap-4">
              <h2 className="text-xl font-black text-text-primary flex items-center gap-3">
                <Gift className="h-6 w-6 text-accent" /> Gift Card Bonus Offers
              </h2>
              {isGCEditing && (
                <button 
                  onClick={() => setGiftcardTiers([...giftcardTiers, { pay: 100, get: 100, label: "" }])}
                  className="px-4 py-2 bg-accent/10 text-accent hover:bg-accent hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  <Plus className="w-4 h-4" /> Add Offer Tier
                </button>
              )}
            </div>

            <div className="space-y-6">
              {giftcardTiers.map((tier, idx) => (
                <div key={idx} className="flex flex-col md:grid md:grid-cols-12 gap-4 p-5 md:p-4 border border-border-subtle rounded-2xl md:items-end relative bg-app-bg group transition-all hover:border-border-main">
                  
                  {isGCEditing && (
                    <div className="absolute top-3 right-3 md:hidden">
                      <button 
                        onClick={() => {
                          const newTiers = [...giftcardTiers];
                          newTiers.splice(idx, 1);
                          setGiftcardTiers(newTiers);
                        }}
                        className="p-2 bg-status-danger/10 text-status-danger rounded-lg flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 md:col-span-5 md:flex md:gap-4 w-full">
                    <div className="w-full">
                      <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">User Pays (₹)</label>
                      <input 
                        type="number" 
                        value={tier.pay} 
                        disabled={!isGCEditing}
                        onChange={(e) => {
                          const newTiers = [...giftcardTiers];
                          newTiers[idx].pay = Number(e.target.value);
                          setGiftcardTiers(newTiers);
                        }} 
                        className={inputCls} 
                      />
                    </div>
                    <div className="w-full">
                      <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">User Gets (₹)</label>
                      <input 
                        type="number" 
                        value={tier.get} 
                        disabled={!isGCEditing}
                        onChange={(e) => {
                          const newTiers = [...giftcardTiers];
                          newTiers[idx].get = Number(e.target.value);
                          setGiftcardTiers(newTiers);
                        }} 
                        className={inputCls} 
                      />
                    </div>
                  </div>

                  <div className="md:col-span-7 flex gap-4 w-full items-end mt-2 md:mt-0">
                    <div className="flex-1 w-full">
                      <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Marketing Label</label>
                      <input 
                        type="text" 
                        value={tier.label} 
                        placeholder="e.g. 10% Extra"
                        disabled={!isGCEditing}
                        onChange={(e) => {
                          const newTiers = [...giftcardTiers];
                          newTiers[idx].label = e.target.value;
                          setGiftcardTiers(newTiers);
                        }} 
                        className={inputCls} 
                      />
                    </div>
                    {isGCEditing && (
                      <button 
                        onClick={() => {
                          const newTiers = [...giftcardTiers];
                          newTiers.splice(idx, 1);
                          setGiftcardTiers(newTiers);
                        }}
                        className="hidden md:flex h-[50px] w-[50px] items-center justify-center bg-status-danger/10 text-status-danger hover:bg-status-danger hover:text-white rounded-xl transition-all flex-shrink-0 mb-0.5"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {giftcardTiers.length === 0 && (
                <div className="text-center py-10 text-text-muted">
                  <Gift className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No gift card tiers configured.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Real 2FA Modal */}
      <TwoFactorSettingsModal show={show2FA} onClose={() => setShow2FA(false)} />
    </div>
  );
};

export default AdminSettings;
