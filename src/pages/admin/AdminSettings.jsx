import React, { useState, useEffect } from 'react';
import {
  Settings, 
  Shield, 
  Bell, 
  Globe, 
  CreditCard,
  User,
  Database,
  Lock,
  ChevronRight,
  Zap,
  Box,
  Key,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Trash2, 
  RotateCcw, 
  AlertTriangle,
  Phone,
  Mail,
  MessageCircle,
  Send
} from 'lucide-react';
import { usePayment } from '../../context/PaymentContext';
import { subscribeToAppSettings, updateAppSettings } from '../../services/firebaseService';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { doc, updateDoc, collection, getDocs, deleteDoc, writeBatch, query } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { APP_VERSION, BUILD_VERSION } from '../../config';

const SettingRow = ({ label, desc, children }) => (
  <div className="flex flex-col justify-between items-start py-8 gap-4 first:pt-4 last:pb-4 border-b border-gray-50 last:border-none group">
    <div className="space-y-1">
       <h4 className="text-base font-black text-gray-800 tracking-tight uppercase italic group-hover:text-[#f42464] transition-colors">{label}</h4>
       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed italic">{desc}</p>
    </div>
    <div className="w-full shrink-0">
       {children}
    </div>
  </div>
);

const GeneralSettingsWithContext = () => {
  const { appSettings, updateAppSettings } = useCart();
  const [localSettings, setLocalSettings] = useState(appSettings);

  useEffect(() => {
    setLocalSettings(appSettings);
  }, [appSettings]);

  const handleChange = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    await updateAppSettings(localSettings);
  };

  return (
    <div className="space-y-4">
      <SettingRow label="Platform Maintenance" desc="Temporarily disable all user features globally for system sync.">
        <div 
          onClick={() => handleChange('maintenanceMode', !localSettings.maintenanceMode)}
          className="relative inline-flex items-center cursor-pointer group origin-left"
        >
          <div className={`w-16 h-8 border rounded-full transition-all relative ${localSettings.maintenanceMode ? 'bg-[#ff004d] border-[#ff004d]' : 'bg-gray-100 border-gray-200'}`}>
             <div className={`absolute top-[4px] bg-white rounded-full h-6 w-8 transition-all ${localSettings.maintenanceMode ? 'left-[28px]' : 'left-[4px]'}`}></div>
          </div>
        </div>
      </SettingRow>

      <SettingRow label="Secure Brand Name" desc="Public platform display name throughout user experience.">
        <div className="relative">
          <Box className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-200" size={20} />
          <input 
            type="text" 
            value={localSettings.brandName} 
            onChange={(e) => handleChange('brandName', e.target.value)}
            className="bg-gray-50/50 border border-gray-100 rounded-2xl pl-16 pr-6 h-16 font-black text-gray-800 outline-none w-full text-xs focus:bg-white focus:border-[#ff004d]/20 transition-all uppercase tracking-widest" 
          />
        </div>
      </SettingRow>

      <SettingRow label="Hovering News / Marquee" desc="Update the moving news visible globally on top of the screen">
        <div className="flex flex-col gap-2">
          <input 
            type="text" 
            value={localSettings.hoveringNews || ''} 
            onChange={(e) => handleChange('hoveringNews', e.target.value)} 
            placeholder="E.g. Welcome to SMS Lottery!"
            className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 h-16 font-black text-gray-800 outline-none text-xs focus:bg-white focus:border-[#ff004d]/20 transition-all uppercase tracking-widest"
          />
        </div>
      </SettingRow>

      <SettingRow label="Customer Care Number" desc="Dynamic helpline displayed in Help & Support and on receipts.">
        <div className="relative">
          <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-200" size={20} />
          <input 
            type="text" 
            inputMode="numeric"
            pattern="[0-9]*"
            value={localSettings.customerCare || ''} 
            onChange={(e) => handleChange('customerCare', e.target.value)}
            className="bg-gray-50/50 border border-gray-100 rounded-2xl pl-16 pr-6 h-16 font-black text-gray-800 outline-none w-full text-xs focus:bg-white focus:border-[#ff004d]/20 transition-all uppercase tracking-widest" 
          />
        </div>
      </SettingRow>

      <SettingRow label="WhatsApp Support Link" desc="Direct WhatsApp chat URL for instant messaging support.">
        <div className="relative">
          <MessageCircle className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-200" size={20} />
          <input 
            type="text" 
            value={localSettings.whatsapp || ''} 
            onChange={(e) => handleChange('whatsapp', e.target.value)}
            placeholder="https://wa.me/910000000000"
            className="bg-gray-50/50 border border-gray-100 rounded-2xl pl-16 pr-6 h-16 font-black text-gray-800 outline-none w-full text-xs focus:bg-white focus:border-[#ff004d]/20 transition-all uppercase tracking-widest" 
          />
        </div>
      </SettingRow>

      <SettingRow label="Telegram Support Link" desc="Official Telegram handle or group link for community support.">
        <div className="relative">
          <Send className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-200" size={20} />
          <input 
            type="text" 
            value={localSettings.telegram || ''} 
            onChange={(e) => handleChange('telegram', e.target.value)}
            placeholder="https://t.me/yourusername"
            className="bg-gray-50/50 border border-gray-100 rounded-2xl pl-16 pr-6 h-16 font-black text-gray-800 outline-none w-full text-xs focus:bg-white focus:border-[#ff004d]/20 transition-all uppercase tracking-widest" 
          />
        </div>
      </SettingRow>

      <SettingRow label="Session Persistence" desc="Automated admin logout threshold for enhanced security.">
        <div className="relative">
          <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-200" size={20} />
          <select 
            value={localSettings.sessionPersistence}
            onChange={(e) => handleChange('sessionPersistence', e.target.value)}
            className="bg-gray-50/50 border border-gray-100 rounded-2xl pl-16 pr-6 h-16 font-black text-gray-800 outline-none w-full text-xs focus:bg-white focus:border-[#ff004d]/20 transition-all uppercase tracking-widest appearance-none"
          >
            <option>01 HOUR (RELAXED)</option>
            <option>04 HOURS (STANDARD)</option>
            <option>08 HOURS (LONG TERM)</option>
          </select>
          <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none rotate-90" size={16} />
        </div>
      </SettingRow>

      <div className="pt-6">
         <button 
            onClick={handleSave}
            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
         >
            Save General Config
         </button>
      </div>
    </div>
  );
};

const MyProfileSettings = () => {
  const { user } = useAuth();
  const [localUser, setLocalUser] = useState({
    name: user?.name || '',
    mobile: user?.mobile || '',
    email: user?.email || '',
    notifications: user?.notifications !== false,
    securityAlerts: user?.securityAlerts !== false
  });
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setLocalUser({
        name: user.name || '',
        mobile: user.mobile || '',
        email: user.email || '',
        notifications: user.notifications !== false,
        securityAlerts: user.securityAlerts !== false
      });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = { ...localUser };
      if (newPassword) {
        updates.tempPassword = newPassword;
        updates.passwordUpdateRequested = true;
      }
      await updateDoc(doc(db, 'users', user.uid), updates);
      alert("Administrative Identity Synchronized!");
      setNewPassword('');
    } catch (error) {
      console.error("Profile sync error:", error);
      alert("Failed to sync profile data.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    if (window.confirm(`A password reset link will be sent to ${user.email}. Continue?`)) {
       try {
         await sendPasswordResetEmail(auth, user.email);
         alert("Secure reset link transmitted to your email.");
       } catch (err) {
         alert("Transmission failed: " + err.message);
       }
    }
  };

  return (
    <div className="space-y-4">
      <SettingRow label="Administrative Identity" desc="Your display name as it appears in administrative logs.">
        <div className="relative">
          <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-200" size={20} />
          <input 
            type="text" 
            value={localUser.name} 
            onChange={(e) => setLocalUser(prev => ({ ...prev, name: e.target.value }))}
            className="bg-gray-50/50 border border-gray-100 rounded-2xl pl-16 pr-6 h-16 font-black text-gray-800 outline-none w-full text-xs focus:bg-white focus:border-[#ff004d]/20 transition-all uppercase tracking-widest" 
          />
        </div>
      </SettingRow>

      <SettingRow label="Direct Hotline" desc="Registered mobile number for high-priority alerts.">
        <div className="relative">
          <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-200" size={20} />
          <input 
            type="tel" 
            inputMode="numeric"
            pattern="[0-9]*"
            value={localUser.mobile} 
            onChange={(e) => setLocalUser(prev => ({ ...prev, mobile: e.target.value }))}
            className="bg-gray-50/50 border border-gray-100 rounded-2xl pl-16 pr-6 h-16 font-black text-gray-800 outline-none w-full text-xs focus:bg-white focus:border-[#ff004d]/20 transition-all uppercase tracking-widest" 
          />
        </div>
      </SettingRow>

      <SettingRow label="Authority Email" desc="The primary contact for standards-based recovery and reporting.">
        <div className="relative">
          <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-200" size={20} />
          <input 
            type="email" 
            value={localUser.email} 
            onChange={(e) => setLocalUser(prev => ({ ...prev, email: e.target.value }))}
            className="bg-gray-50/50 border border-gray-100 rounded-2xl pl-16 pr-6 h-16 font-black text-gray-800 outline-none w-full text-xs focus:bg-white focus:border-[#ff004d]/20 transition-all uppercase tracking-widest" 
          />
        </div>
      </SettingRow>

      <SettingRow label="Quick Password Update" desc="Directly set a new administrative password (requires sync).">
        <div className="space-y-3">
          <div className="relative">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-200" size={20} />
            <input 
              type={showPassword ? "text" : "password"} 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter New Password"
              className="bg-gray-50/50 border border-gray-100 rounded-2xl pl-16 pr-14 h-16 font-black text-gray-800 outline-none w-full text-xs focus:bg-white focus:border-[#ff004d]/20 transition-all uppercase tracking-widest" 
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#ff004d]"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <button 
            onClick={handlePasswordReset}
            className="w-full py-4 bg-white border border-gray-100 text-[9px] font-black uppercase tracking-widest text-gray-400 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
          >
             <Key size={14} /> Traditional Email Reset
          </button>
        </div>
      </SettingRow>

      <SettingRow label="Authority Alerts" desc="Configure high-priority notification channels for administrative events.">
         <div className="grid grid-cols-2 gap-4">
            <div 
              onClick={() => setLocalUser(prev => ({ ...prev, notifications: !prev.notifications }))}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col items-center gap-2 ${localUser.notifications ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-gray-50 border-gray-100 text-gray-400 opacity-50'}`}
            >
               <Bell size={24} />
               <span className="text-[9px] font-black uppercase tracking-widest">Push Alerts</span>
            </div>
            <div 
              onClick={() => setLocalUser(prev => ({ ...prev, securityAlerts: !prev.securityAlerts }))}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col items-center gap-2 ${localUser.securityAlerts ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-gray-50 border-gray-100 text-gray-400 opacity-50'}`}
            >
               <Shield size={24} />
               <span className="text-[9px] font-black uppercase tracking-widest">Security</span>
            </div>
         </div>
      </SettingRow>

      <div className="pt-6">
         <button 
            disabled={saving}
            onClick={handleSave}
            className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? 'SYNCHRONIZING...' : 'Commit Identity Changes'}
         </button>
      </div>
    </div>
  );
};

const DatabaseCleanseSettings = () => {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleFactoryReset = async () => {
    if (confirmText !== 'AUTHORIZE CLEANSE') {
      alert("Please type 'AUTHORIZE CLEANSE' to confirm this destructive action.");
      return;
    }

    if (!window.confirm("CRITICAL WARNING: This will permanently delete ALL ticket history, results, and transactions. This cannot be undone. PROCEED?")) return;

    setLoading(true);
    try {
      const collectionsToClear = ['tickets', 'results', 'announcements', 'pending_transactions', 'notifications'];
      
      for (const collName of collectionsToClear) {
        const q = query(collection(db, collName));
        const snapshot = await getDocs(q);
        
        const batchSize = 500;
        for (let i = 0; i < snapshot.docs.length; i += batchSize) {
          const batch = writeBatch(db);
          const chunk = snapshot.docs.slice(i, i + batchSize);
          chunk.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
        }
      }
      
      alert("PLATFORM CLEANSE COMPLETE: The system has been restored to a clean state.");
      setConfirmText('');
    } catch (error) {
      console.error("Cleanse error:", error);
      alert("An error occurred during the cleanse process. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 py-4">
      <div className="bg-red-50 p-8 rounded-[2.5rem] border border-red-100 space-y-6">
        <div className="flex items-center gap-4 text-red-600">
           <AlertTriangle size={32} />
           <div>
              <h3 className="text-lg font-black uppercase tracking-tighter italic">Factory Reset Protocol</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Destructive Operational Clearance</p>
           </div>
        </div>

        <div className="space-y-4">
           <p className="text-xs font-bold text-red-800 leading-relaxed italic bg-white/50 p-4 rounded-2xl">
             This action will purge ALL operational records from the following databases:
             <span className="block mt-2 font-black uppercase tracking-widest text-[9px]">• Ticket Purchase History</span>
             <span className="block font-black uppercase tracking-widest text-[9px]">• Declared Results Archive</span>
             <span className="block font-black uppercase tracking-widest text-[9px]">• Pending & Historical Transactions</span>
             <span className="block font-black uppercase tracking-widest text-[9px]">• Announcements & Alerts</span>
           </p>

           <div className="space-y-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Type 'AUTHORIZE CLEANSE' to unlock</label>
              <input 
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder="UNAUTHORIZED"
                className="w-full h-16 bg-white border border-red-100 rounded-2xl px-6 font-black text-red-600 outline-none focus:ring-4 focus:ring-red-100 transition-all uppercase tracking-[0.3em] text-center"
              />
           </div>

           <button 
             disabled={loading || confirmText !== 'AUTHORIZE CLEANSE'}
             onClick={handleFactoryReset}
             className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-xl ${
               confirmText === 'AUTHORIZE CLEANSE' 
                 ? 'bg-red-600 text-white shadow-red-200 active:scale-95' 
                 : 'bg-gray-100 text-gray-300'
             }`}
           >
             {loading ? 'PURGING DATA...' : 'INITIATE CLEANSE'} <Trash2 size={20} />
           </button>
        </div>
      </div>

      <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 flex items-center justify-between group cursor-help">
         <div className="flex items-center gap-4">
            <RotateCcw className="text-blue-500" size={24} />
            <div>
               <h4 className="text-xs font-black uppercase tracking-tight text-gray-800">Operational Integrity</h4>
               <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mt-1">User balances and accounts will remain intact.</p>
            </div>
         </div>
      </div>
    </div>
  );
};

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('General');
  const { activePayment } = usePayment();
  const { appSettings, updateAppSettings } = useCart();
  const [savingJackpot, setSavingJackpot] = useState(false);

  const handleJackpotToggle = async () => {
    setSavingJackpot(true);
    try {
      await updateAppSettings({ jackpotVisible: !appSettings.jackpotVisible });
    } catch (error) {
      console.error('Error updating jackpot visibility:', error);
    } finally {
      setSavingJackpot(false);
    }
  };
  const tabs = [
    { id: 'General', icon: Box, label: 'General Info' },
    { id: 'Profile', icon: User, label: 'My Identity' },
    { id: 'Security', icon: Key, label: 'Security & Access' },
    { id: 'Cleanse', icon: Trash2, label: 'Factory Reset' },
    { id: 'Integration', icon: Globe, label: 'API & External' },
  ];

  return (
    <div className="space-y-10 pb-32 p-4 min-h-screen bg-[#f8f9fa]">
      {/* Top Banner - Treasure Chest Theme */}
      <div className="border-[1.5px] border-[#ff004d] rounded-[2.5rem] p-8 bg-white shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff004d]/5 rounded-full blur-3xl"></div>
         <div className="flex gap-4 items-center">
            <img src="https://img.icons8.com/color/64/000000/treasure-chest.png" alt="Chest" className="w-16 h-16 drop-shadow-xl group-hover:scale-110 transition-transform" />
            <div className="flex-grow">
               <h2 className="text-2xl font-black text-gray-900 font-condensed uppercase tracking-tighter italic leading-none">Configuration</h2>
               <p className="text-[#ff004d] font-black text-[10px] uppercase tracking-widest leading-none mt-1">Platform Core Alignment</p>
            </div>
         </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide px-2">
         {tabs.map((tab) => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id)}
             className={`flex-shrink-0 flex items-center gap-3 px-8 py-4 rounded-2xl transition-all shadow-md active:scale-95 ${
               activeTab === tab.id 
                 ? 'bg-[#ff004d] text-white shadow-[#ff004d]/20' 
                 : 'bg-white text-gray-400 border border-gray-100'
             }`}
           >
              <tab.icon size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">{tab.id}</span>
           </button>
         ))}
      </div>

      {/* Settings Grid Content */}
      <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-xl space-y-2">
         <div className="flex items-center gap-3 mb-8 border-b border-gray-50 pb-6">
            <Zap className="text-amber-500" size={24} fill="currentColor" />
            <h2 className="text-xl font-black font-condensed uppercase tracking-tighter text-gray-800 italic">{activeTab} Parameters</h2>
         </div>

         {activeTab === 'General' && (
          <div className="space-y-4">
            <SettingRow label="Jackpot Section Visibility" desc="Control whether the Jackpot banner and buttons appear on the user dashboard.">
               <div className="flex items-center justify-between bg-gray-50/50 border border-gray-100 rounded-2xl p-5">
                  <div className="flex items-center gap-4">
                     {appSettings.jackpotVisible ? (
                       <Eye className="text-emerald-500" size={24} />
                     ) : (
                       <EyeOff className="text-gray-300" size={24} />
                     )}
                     <div>
                        <p className="text-xs font-black text-gray-800 uppercase tracking-tight">
                           {appSettings.jackpotVisible ? 'Jackpot Visible' : 'Jackpot Hidden'}
                        </p>
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                           {appSettings.jackpotVisible ? 'Users can see and access jackpot' : 'Jackpot section is hidden from users'}
                        </p>
                     </div>
                  </div>
                  <button
                     onClick={handleJackpotToggle}
                     disabled={savingJackpot}
                     className={`relative inline-flex items-center cursor-pointer transition-all ${savingJackpot ? 'opacity-50' : ''}`}
                  >
                     <div className={`w-16 h-8 rounded-full transition-all ${appSettings.jackpotVisible ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${appSettings.jackpotVisible ? 'left-9' : 'left-1'}`}></div>
                     </div>
                  </button>
               </div>
            </SettingRow>

            <SettingRow label="Global Ticket Sales" desc="Master switch to instantly disable ALL ticket bookings across the platform.">
               <div className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-2xl p-5 text-white shadow-xl">
                  <div className="flex items-center gap-4">
                     {appSettings.globalSalesClosed ? (
                       <Shield className="text-red-500" size={24} />
                     ) : (
                       <Zap className="text-emerald-500" size={24} />
                     )}
                     <div>
                        <p className="text-xs font-black uppercase tracking-tight">
                           {appSettings.globalSalesClosed ? 'Booking Blocked' : 'Booking Active'}
                        </p>
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                           {appSettings.globalSalesClosed ? 'Users cannot purchase any tickets' : 'Global ticket intake is operational'}
                        </p>
                     </div>
                  </div>
                  <button
                     onClick={() => updateAppSettings({ globalSalesClosed: !appSettings.globalSalesClosed })}
                     className="relative inline-flex items-center cursor-pointer transition-all"
                  >
                     <div className={`w-16 h-8 rounded-full transition-all ${appSettings.globalSalesClosed ? 'bg-red-500' : 'bg-gray-700'}`}>
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${appSettings.globalSalesClosed ? 'left-9' : 'left-1'}`}></div>
                     </div>
                  </button>
               </div>
            </SettingRow>
            <SettingRow label="Kerala Early Closure (2 PM)" desc="Force Kerala sales to end early at 02:00 PM instead of the standard 03:00 PM.">

               <div className="flex items-center justify-between bg-red-50/50 border border-red-100 rounded-2xl p-5">
                  <div className="flex items-center gap-4">
                     {appSettings.keralaSalesClosed ? (
                       <Lock className="text-red-500" size={24} />
                     ) : (
                       <Zap className="text-emerald-500" size={24} />
                     )}
                     <div>
                        <p className="text-xs font-black text-gray-800 uppercase tracking-tight">
                           {appSettings.keralaSalesClosed ? 'Kerala Sales CLOSED' : 'Kerala Sales OPEN'}
                        </p>
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                           {appSettings.keralaSalesClosed ? 'Early closure active. Users cannot buy Kerala tickets.' : 'Standard timing rules apply to Kerala Lottery.'}
                        </p>
                     </div>
                  </div>
                  <button
                     onClick={() => updateAppSettings({ keralaSalesClosed: !appSettings.keralaSalesClosed })}
                     className="relative inline-flex items-center cursor-pointer transition-all"
                  >
                     <div className={`w-16 h-8 rounded-full transition-all ${appSettings.keralaSalesClosed ? 'bg-red-500' : 'bg-gray-200'}`}>
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${appSettings.keralaSalesClosed ? 'left-9' : 'left-1'}`}></div>
                     </div>
                  </button>
               </div>
            </SettingRow>

            <GeneralSettingsWithContext />
          </div>
         )}

          {activeTab === 'Profile' && (
            <MyProfileSettings />
          )}

          {activeTab === 'Cleanse' && (
            <DatabaseCleanseSettings />
          )}

         {activeTab !== 'Cleanse' && activeTab !== 'Profile' && (
          <div className="pt-10 grid grid-cols-2 gap-4">
            <button className="py-5 bg-gray-900 text-white rounded-2xl font-black text-[12px] uppercase tracking-widest shadow-xl shadow-black/10 active:scale-95 transition-all">
               Store Global Config
            </button>
            <button className="py-5 bg-white border-2 border-dashed border-gray-100 text-gray-300 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] active:bg-[#fce4ec] active:text-[#ff004d] transition-all">
               Reset Defaults
            </button>
          </div>
         )}
      </div>
      
      <div className="pt-8 text-center opacity-30 space-y-1">
         <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">
            Admin Core System: {APP_VERSION}
         </p>
         <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest italic">
            Build: {BUILD_VERSION}
         </p>
      </div>
    </div>
  );
};

export default AdminSettings;
