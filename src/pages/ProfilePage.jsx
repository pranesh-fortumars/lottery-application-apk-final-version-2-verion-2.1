import React from 'react';
import { 
  User, 
  LogOut, 
  ChevronRight, 
  History, 
  Ticket, 
  Settings, 
  Wallet, 
  CreditCard,
  Users,
  Gift,
  Zap,
  Copy,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageWrapper, { SupportSection } from '../components/PageWrapper';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { APP_VERSION, BUILD_VERSION } from '../config';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Edit2, ShieldCheck, Mail, Phone, Key, X, Save, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getReferralLink, COMMON_REFERRAL_CODE } from '../constants/referralConfig';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ name: '', mobile: '', email: '' });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      setEditData({
        name: user.name || '',
        mobile: user.mobile || '',
        email: user.email || ''
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), editData);
      alert("Admin profile synchronized!");
      setShowEditModal(false);
      window.location.reload(); // Refresh to sync auth context
    } catch (error) {
      alert("Update failed: " + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleResetPassword = async () => {
    if (window.confirm("Send password reset link to your email?")) {
      try {
        await sendPasswordResetEmail(auth, user.email);
        alert("Link sent!");
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const isAdmin = user?.role === 'admin';
  
  const menuItems = [
    !isAdmin && { icon: <Ticket size={20} />, label: 'My Tickets', color: 'text-green-500', path: '/tickets' },
    !isAdmin && { icon: <Wallet size={20} />, label: 'Wallet Top Up', color: 'text-blue-500', path: '/topup' },
    !isAdmin && { icon: <Zap size={20} />, label: 'Request Withdrawal', color: 'text-emerald-500', path: '/withdraw' },
    { icon: <History size={20} />, label: 'Transaction History', color: 'text-purple-500', path: isAdmin ? '/admin/reports' : '/transactions' },
    { icon: <Settings size={20} />, label: 'Settings', color: 'text-gray-500', path: isAdmin ? '/admin/settings' : '/settings' },
  ].filter(Boolean);

  const handleCopyCode = () => {
    navigator.clipboard.writeText('LOTTERY777');
    alert('Referral code copied!');
  };

  return (
    <PageWrapper title="MY PROFILE" showNav={true}>
      <div className="bg-white min-h-screen">
        {/* Profile Header Card */}
        <div className="p-10 bg-gradient-to-br from-[#ff0033] to-[#ff4d6a] relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-125 transition-transform"></div>
           <div className="flex flex-col items-center relative z-10">
              <div className="w-24 h-24 bg-white p-1 rounded-[2.5rem] shadow-2xl mb-4 group relative transform group-hover:-rotate-3 transition-transform">
                 <div className="w-full h-full bg-gray-50 rounded-[2.5rem] flex items-center justify-center border border-gray-100 italic font-black text-3xl text-[#ff0033] shadow-inner">
                    {user?.name?.charAt(0) || 'P'}
                 </div>
                 <div className="absolute bottom-1 right-1 bg-white p-1.5 rounded-full shadow-lg border border-[#ff0033]/20">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                 </div>
              </div>
               <h2 className="text-white text-3xl font-black uppercase tracking-tighter italic leading-none">{user?.name || 'Pranesh'}</h2>
               <p className="text-white/60 font-black text-[10px] uppercase tracking-[0.3em] mt-1 shadow-sm px-2 py-0.5 rounded-full border border-white/5 bg-black/5">
                 {isAdmin ? 'SMS Lottery Secretariat' : 'Verified Member'}
               </p>
               
               {isAdmin && (
                 <button 
                   onClick={() => setShowEditModal(true)}
                   className="mt-6 flex items-center gap-2 bg-white/20 px-6 py-2 rounded-full border border-white/10 backdrop-blur-sm text-white font-black text-[9px] uppercase tracking-widest hover:bg-white/30 transition-all active:scale-95"
                 >
                   <Edit2 size={14} /> Customize Identity
                 </button>
               )}
            </div>
         </div>

         {/* Triple-Balance Management Card */}
         {!isAdmin && (
           <div className="px-6 -mt-10 relative z-20">
              <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
                 {/* Top: Total Balance */}
                 <div className="p-8 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between group cursor-pointer active:bg-gray-100 transition-all" onClick={() => navigate('/topup')}>
                    <div className="flex items-center gap-5">
                       <div className="w-14 h-14 bg-[#ff0033] text-white rounded-[1.4rem] flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:rotate-6 transition-transform">
                          <Wallet size={28} />
                       </div>
                       <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none mb-1.5">Total Available Balance</p>
                          <p className="text-3xl font-black text-gray-900 italic tracking-tighter">₹ {user?.balance?.toLocaleString() || '0.00'}</p>
                       </div>
                    </div>
                    <ChevronRight size={24} className="text-gray-200 group-hover:text-[#ff0033] transition-all" />
                 </div>

                  {/* Bottom Split: Deposited vs Winnings vs Bonus */}
                  <div className="grid grid-cols-3 divide-x divide-gray-100">
                     <div className="p-4 flex flex-col items-center text-center group cursor-pointer hover:bg-red-50/30 transition-all" onClick={() => navigate('/topup')}>
                        <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Deposit</p>
                        <p className="text-sm font-black text-gray-800 italic">₹ {user?.depositedBalance?.toLocaleString() || '0'}</p>
                        <span className="mt-1.5 text-[6px] font-black bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Purchase</span>
                     </div>
                     <div className="p-4 flex flex-col items-center text-center group cursor-pointer hover:bg-emerald-50/30 transition-all" onClick={() => navigate('/withdraw')}>
                        <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Winning</p>
                        <p className="text-sm font-black text-emerald-600 italic">₹ {user?.winningBalance?.toLocaleString() || '0'}</p>
                        <span className="mt-1.5 text-[6px] font-black bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Payout</span>
                     </div>
                     <div className="p-4 flex flex-col items-center text-center group cursor-pointer hover:bg-blue-50/30 transition-all">
                        <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Bonus</p>
                        <p className="text-sm font-black text-blue-600 italic">₹ {user?.bonusBalance?.toLocaleString() || '0'}</p>
                        <span className="mt-1.5 text-[6px] font-black bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Tickets Only</span>
                     </div>
                  </div>
               </div>
            </div>
          )}


          {/* Payout & Banking Info Card */}
          {!isAdmin && (
            <div className="p-6">
               <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-6 border-b border-gray-50 pb-4">
                     <div className="flex items-center gap-3">
                        <CreditCard className="text-[#ff0033]" size={24} />
                        <h3 className="text-lg font-black font-condensed uppercase tracking-tighter italic text-gray-900">Payout & Banking Info</h3>
                     </div>
                     <button 
                       onClick={() => navigate('/settings/personal-info')}
                       className="text-[10px] font-black text-[#ff0033] uppercase tracking-widest hover:underline flex items-center gap-1"
                     >
                        Edit <Edit2 size={12} />
                     </button>
                  </div>

                  <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                           <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Account Holder</p>
                           <p className="text-xs font-black text-gray-800 truncate">{user?.accountHolderName || <span className="text-red-500 italic">Required</span>}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                           <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Account Number</p>
                           <p className="text-xs font-black text-gray-800 truncate">{user?.accountNumber || <span className="text-red-500 italic">Required</span>}</p>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                           <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">IFSC Code</p>
                           <p className="text-xs font-black text-gray-800 truncate">{user?.ifscCode || <span className="text-red-500 italic">Required</span>}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                           <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">UPI Address / ID</p>
                           <p className="text-xs font-black text-gray-800 truncate">{user?.upiId || <span className="text-red-500 italic">Required</span>}</p>
                        </div>
                     </div>
                     <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Registered Phone Number</p>
                        <p className="text-xs font-black text-gray-800">{user?.mobile || 'N/A'}</p>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {/* Referral Section - Hidden for Admins */}
          {!isAdmin && (
            <div className="p-6">
               <div className="bg-gray-950 rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff0033]/20 rounded-full blur-3xl group-hover:bg-[#ff0033]/40 transition-colors"></div>
                  <div className="relative z-10">
                     <div className="flex items-center gap-3 mb-4">
                        <Gift className="text-[#ff0033]" size={24} />
                        <h3 className="text-xl font-black font-condensed uppercase tracking-tighter italic italic">Refer & Get ₹50</h3>
                     </div>
                     <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed mb-6">
                        Share the link below. When your friends register with code <span className="text-white">LOTTERY777</span>, they get <span className="text-[#ff0033]">₹50 BONUS CHIPS</span> instantly!
                     </p>
                     
                     <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10 group-hover:border-[#ff0033]/30 transition-all">
                        <div className="flex-grow overflow-hidden">
                           <p className="text-[8px] font-black text-[#ff0033] uppercase tracking-widest mb-1">Your Referral Link</p>
                           <p className="text-[10px] font-bold tracking-tight text-gray-400 truncate">{getReferralLink()}</p>
                        </div>
                        <div className="flex gap-2">
                           <button 
                             onClick={async () => {
                               const shareData = {
                                 title: 'Join SMS Lottery',
                                 text: `Hey! Register on SMS Lottery using code ${COMMON_REFERRAL_CODE} and get ₹50 bonus chips instantly!`,
                                 url: getReferralLink()
                               };
                               
                               if (navigator.share) {
                                 try {
                                   await navigator.share(shareData);
                                 } catch (err) {
                                   console.log('Share failed', err);
                                 }
                               } else {
                                 navigator.clipboard.writeText(getReferralLink());
                                 alert('Referral link copied!');
                               }
                             }}
                             className="bg-[#ff0033] p-3 rounded-xl text-white shadow-lg shadow-[#ff0033]/20 active:scale-95 transition-all shrink-0"
                             title="Share Link"
                           >
                              <Share2 size={18} />
                           </button>
                           <button 
                             onClick={() => {
                               navigator.clipboard.writeText(getReferralLink());
                               alert('Referral link copied!');
                             }}
                             className="bg-white/10 p-3 rounded-xl text-white border border-white/10 active:scale-95 transition-all shrink-0"
                             title="Copy Link"
                           >
                              <Copy size={18} />
                           </button>
                        </div>
                     </div>
                     
                     <div className="mt-4 flex items-center gap-2 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                        <AlertCircle size={14} className="text-blue-400" />
                        <p className="text-[8px] font-bold text-blue-300 uppercase tracking-widest">Bonus chips are non-withdrawable and for tickets only.</p>
                     </div>
                  </div>
               </div>
            </div>
          )}

        {/* Menu Items */}
        <div className="p-4 py-6 space-y-4">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 mb-2 italic">Account Services</p>
          {menuItems.map((item, i) => (
            <div 
              key={i} 
              onClick={() => item.path !== '#' && navigate(item.path)}
              className="group flex items-center justify-between p-5 bg-white rounded-[2rem] border border-gray-100 shadow-sm active:bg-gray-50 active:scale-[0.98] transition-all cursor-pointer hover:border-red-100"
            >
              <div className="flex items-center gap-5">
                 <div className={`${item.color} bg-gray-50 p-3 rounded-2xl shadow-sm border border-gray-50 group-hover:scale-110 transition-transform group-hover:rotate-6 group-hover:bg-white`}>
                    {item.icon}
                 </div>
                 <span className="font-black text-gray-800 uppercase tracking-tight text-sm italic">{item.label}</span>
              </div>
              <ChevronRight size={20} className="text-gray-200 group-hover:text-[#ff0033] transition-colors" />
            </div>
          ))}

          <div 
            onClick={() => {
              logout();
            }}
            className="flex items-center justify-between p-5 bg-gray-950 text-white rounded-[2rem] border border-gray-900 mt-10 active:scale-95 transition-all cursor-pointer shadow-xl shadow-black/10"
          >
            <div className="flex items-center gap-5">
               <div className="text-[#ff0033] bg-white/10 p-3 rounded-2xl shadow-sm border border-white/5">
                  <LogOut size={20} />
               </div>
               <span className="font-black uppercase tracking-widest text-[11px] italic">Logout Securely</span>
            </div>
            <ChevronRight size={20} className="text-white/20" />
          </div>

          {/* Mandatory Profile Completion Warning Banner */}
          {!isAdmin && !Boolean(user?.accountHolderName && user?.accountNumber && user?.ifscCode && user?.upiId) && (
            <div className="mt-8 bg-amber-50 border-2 border-amber-200 rounded-[2.5rem] p-6 shadow-lg flex flex-col gap-4 animate-pulse">
               <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md">
                     <AlertCircle size={24} />
                  </div>
                  <div>
                     <h3 className="text-sm font-black text-amber-900 uppercase tracking-tight italic font-condensed">Action Required: Mandatory Profile Completion</h3>
                     <p className="text-[10px] text-amber-800 font-bold mt-0.5 leading-relaxed">
                        You must verify your banking & UPI payout credentials before purchasing tickets or requesting withdrawals.
                     </p>
                  </div>
               </div>
               <button 
                 onClick={() => navigate('/settings/personal-info')}
                 className="w-full bg-amber-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
               >
                  Complete Verification Details <ChevronRight size={16} />
               </button>
            </div>
          )}
        </div>

        {!isAdmin && <SupportSection />}

        <div className="p-6 mx-6 mb-6 text-center border border-[#ff0033]/20 bg-[#ff0033]/5 rounded-2xl space-y-2 shadow-sm">
           {user?.createdAt && (
              <p className="text-[11px] text-gray-800 font-black uppercase tracking-widest flex items-center justify-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                 Account Created: <span className="text-[#ff0033]">{user.createdAt?.toDate ? user.createdAt.toDate().toLocaleString('en-IN') : new Date(user.createdAt).toLocaleString('en-IN')}</span>
              </p>
           )}
           <div className="w-16 h-[1px] bg-gray-200 mx-auto my-2"></div>
           <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em] italic leading-tight">
              App Version: <span className="text-gray-900 font-black">{APP_VERSION}</span><br/>
              Build: <span className="text-gray-900 font-black">{BUILD_VERSION}</span>
           </p>
        </div>
      </div>

      {/* Admin Identity Customization Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[2000] flex items-end justify-center p-4 pb-10"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-[480px] rounded-[2.5rem] p-10 shadow-2xl space-y-8 relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-start border-b border-gray-50 pb-8">
                <div>
                   <div className="flex items-center gap-3 mb-2">
                       <ShieldCheck className="text-[#ff0033]" size={24} />
                       <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic leading-none">Authority Records</h2>
                   </div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Modifying high-privilege credentials</p>
                </div>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 active:bg-red-50 active:text-red-500 transition-all border border-gray-100"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-5">
                {[
                  { label: 'Display Name', key: 'name', icon: User, type: 'text' },
                  { label: 'Direct Mobile', key: 'mobile', icon: Phone, type: 'tel', inputMode: 'numeric', pattern: '[0-9]*' },
                ].map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{field.label}</label>
                    <div className="relative group/field">
                      <field.icon className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within/field:text-[#ff0033] transition-colors" size={18} />
                      <input 
                        required
                        type={field.type} 
                        inputMode={field.inputMode}
                        pattern={field.pattern}
                        value={editData[field.key]}
                        onChange={e => setEditData({...editData, [field.key]: e.target.value})}
                        className="w-full h-15 bg-gray-50/50 border border-gray-100 rounded-2xl pl-16 pr-6 outline-none font-bold text-gray-800 focus:bg-white focus:border-[#ff0033]/20 transition-all text-xs"
                      />
                    </div>
                  </div>
                ))}

                <div className="pt-4 border-t border-gray-50 space-y-4">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Authentication Security</p>
                  <button 
                    type="button"
                    onClick={handleResetPassword}
                    className="w-full flex items-center justify-between p-5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 active:scale-95 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Key size={18} />
                      <span className="text-[11px] font-black uppercase tracking-widest">Update Secret Password</span>
                    </div>
                    <ChevronRight size={16} className="opacity-50" />
                  </button>
                </div>

                <button 
                  type="submit"
                  disabled={updating}
                  className="w-full h-16 bg-gray-900 text-white rounded-2xl font-black text-[12px] uppercase tracking-widest shadow-xl shadow-black/20 flex items-center justify-center gap-3 mt-6 active:scale-95 transition-all disabled:opacity-50"
                >
                   {updating ? 'SYNCING...' : 'Authorize Changes'} <Save size={18} className="text-[#ff0033]" />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
};

export default ProfilePage;
