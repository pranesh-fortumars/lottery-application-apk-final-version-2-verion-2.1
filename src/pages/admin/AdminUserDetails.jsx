import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Wallet,
  History,
  ShieldAlert,
  Mail,
  Phone,
  Edit,
  Activity,
  Ticket,
  ChevronRight,
  ShieldCheck,
  Zap,
  Star,
  User,
  Trophy,
  Info,
  ChevronLeft,
  X,
  Key,
  Landmark
} from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, collection, query, where, getDocs, orderBy, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import PullToRefresh from '../../components/PullToRefresh';

const AdminUserDetails = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activity, setActivity] = useState([]);
  const [stats, setStats] = useState({ tickets: 0, won: 0 });
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ name: '', mobile: '', email: '' });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    let unsubscribeUser;
    let unsubscribeTickets;

    const setupListeners = () => {
      try {
        unsubscribeUser = onSnapshot(doc(db, 'users', userId), (userDoc) => {
          if (userDoc.exists()) {
            const userData = { id: userDoc.id, ...userDoc.data() };
            setUser(userData);
            setEditData({
              name: userData.name || '',
              mobile: userData.mobile || '',
              email: userData.email || '',
              accountHolderName: userData.accountHolderName || '',
              accountNumber: userData.accountNumber || '',
              ifscCode: userData.ifscCode || '',
              upiId: userData.upiId || ''
            });
          }
          setLoading(false);
        });

        const ticketsQuery = query(collection(db, 'tickets'), where('userId', '==', userId));
        unsubscribeTickets = onSnapshot(ticketsQuery, (ticketsSnap) => {
          const ticketsList = ticketsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => {
              const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
              const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
              return timeB - timeA;
            });

          const totalWonValue = ticketsList.reduce((sum, t) => {
            if (t.status === 'Won') {
              const prize = parseFloat(t.prize?.replace(/[^0-9.]/g, '') || 0);
              return sum + prize;
            }
            return sum;
          }, 0);

          setStats({
            tickets: ticketsList.length,
            won: totalWonValue
          });

          const activityFeed = ticketsList.slice(0, 10).map(t => ({
             id: t.id,
             type: t.status === 'Won' ? 'Win' : 'Purchase',
             amount: t.status === 'Won' ? `+₹${t.prize}` : `-₹${t.price * t.qty}`,
             date: t.timestamp?.toDate().toLocaleString() || 'Recent',
             desc: t.status === 'Won' ? `Won ${t.type} Draw` : `Bought ${t.qty} units (${t.type})`
          }));

          setActivity(activityFeed);
        });
      } catch (error) {
        console.error("Error setting up listeners:", error);
        setLoading(false);
      }
    };

    setupListeners();

    return () => {
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeTickets) unsubscribeTickets();
    };
  }, [userId]);

  const handleRefresh = async () => {
    await new Promise(r => setTimeout(r, 600));
  };

  const handleToggleBlock = async () => {
    if (!user) return;
    const newStatus = user.status === 'Blocked' ? 'Active' : 'Blocked';
    if (!window.confirm(`Are you sure you want to ${newStatus === 'Blocked' ? 'BLOCK' : 'UNBLOCK'} this user?`)) return;

    try {
      await updateDoc(doc(db, 'users', userId), { status: newStatus });
      setUser(prev => ({ ...prev, status: newStatus }));
      alert(`User identity has been set to ${newStatus}.`);
    } catch (error) {
      console.error("Error toggling block status:", error);
      alert("Failed to update user status.");
    }
  };

  const handleDeleteUser = async () => {
    if (!window.confirm("CRITICAL WARNING: This will permanently delete this user's access while archiving their records. Proceed?")) return;

    try {
      await updateDoc(doc(db, 'users', userId), { 
        status: 'Deleted',
        isDeleted: true,
        active: false,
        deletedAt: new Date().toISOString()
      });
      alert("User account has been successfully deleted and archived.");
      navigate('/admin/users');
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user profile.");
    }
  };

  const handleAdjustBalance = async (type, isAddition) => {
    const amount = window.prompt(`Enter amount to ${isAddition ? 'ADD' : 'SUBTRACT'} ${type === 'deposited' ? 'Deposited Chips' : type === 'winning' ? 'Winning Credits' : 'Bonus Chips'}:`);
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;

    const finalVal = isAddition ? val : -val;
    const field = type === 'deposited' ? 'depositedBalance' : type === 'winning' ? 'winningBalance' : 'bonusBalance';
    
    try {
      await updateDoc(doc(db, 'users', userId), {
        [field]: (user[field] || 0) + finalVal,
        balance: (user.balance || 0) + finalVal
      });
      setUser(prev => ({
        ...prev,
        [field]: (prev[field] || 0) + finalVal,
        balance: (prev.balance || 0) + finalVal
      }));
      alert(`Balance synchronized! ${isAddition ? 'Added' : 'Subtracted'} ₹${val} to ${type}.`);
    } catch (error) {
      alert("Failed to adjust balance: " + error.message);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'users', userId), editData);
      setUser(prev => ({ ...prev, ...editData }));
      setShowEditModal(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Update error:", error);
      alert("Failed to update profile.");
    } finally {
      setUpdating(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!user.email) {
      alert("No email address associated with this profile.");
      return;
    }
    if (!window.confirm(`Send password reset email to ${user.email}?`)) return;

    try {
      await sendPasswordResetEmail(auth, user.email);
      alert("Reset link sent successfully!");
    } catch (error) {
      console.error("Reset error:", error);
      alert("Error: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8f9fa]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f42464]"></div>
      </div>
    );
  }
  if (loading || !user) return <div className="p-8 text-center font-bold text-gray-500 uppercase">Loading Profile...</div>;

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-6 p-4 pb-24 relative min-h-screen bg-[#f8f9fa]">
      {/* Navigation & Header */}
      <div className="border-[1.5px] border-[#ff004d] rounded-[2.5rem] p-8 bg-white shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff004d]/5 rounded-full blur-3xl"></div>
         <button 
           onClick={() => navigate('/admin/users')}
           className="flex items-center gap-2 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-[#f42464] mb-6 transition-colors"
         >
           <ArrowLeft size={16} /> Back to Directory
         </button>
         
         <div className="flex gap-4 items-center">
            <div className="w-20 h-20 rounded-[2rem] bg-gray-50 flex items-center justify-center text-[#f42464] font-black text-3xl border border-white shadow-lg transform group-hover:-rotate-6 transition-transform relative">
               {user.name?.charAt(0) || 'U'}
               <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center">
                  <ShieldCheck size={14} className="text-white" />
               </div>
            </div>
            <div className="flex-grow">
               <h2 className="text-2xl font-black text-gray-900 font-condensed uppercase tracking-tighter italic leading-none">{user.name || 'Anonymous'}</h2>
               <p className="text-[#ff004d] font-black text-[10px] uppercase tracking-widest leading-none mt-1">Player Rank: Lottery Elite</p>
               <div className="mt-3 flex gap-2">
                 <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1">
                    <Zap size={10} fill="currentColor" /> {user.status || 'Active'}
                 </span>
                 <span className="bg-gray-50 text-gray-400 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border border-gray-100">
                    ID: #{user.id.slice(0, 8)}
                 </span>
                 {user.createdAt && (
                   <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border border-blue-100 flex items-center gap-1">
                      <Info size={10} /> Joined: {user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString('en-IN') : new Date(user.createdAt).toLocaleDateString('en-IN')}
                   </span>
                 )}
               </div>
            </div>
         </div>
      </div>

      {/* Wallet Dashboard */}
      <div className="bg-gray-950 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 bg-[#ff004d] rounded-bl-[2.5rem] group-hover:scale-110 transition-transform">
             <Wallet size={48} />
          </div>
          
          <p className="text-[10px] font-black uppercase tracking-widest text-[#ff004d] mb-4">Total Authority Balance</p>
          <div className="flex items-baseline gap-2">
             <span className="text-4xl font-black italic tracking-tighter">₹ {(user.balance || 0).toLocaleString()}</span>
          </div>
          
          <div className="grid grid-cols-3 gap-6 mt-10 pt-10 border-t border-white/5">
             <div className="space-y-3">
                <div>
                   <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Deposited</p>
                   <p className="text-xl font-black italic">₹ {(user.depositedBalance || 0).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                   <button onClick={() => handleAdjustBalance('deposited', true)} className="bg-white/10 hover:bg-emerald-500/20 p-2 rounded-lg text-emerald-400 transition-colors"><Zap size={14} fill="currentColor" /></button>
                   <button onClick={() => handleAdjustBalance('deposited', false)} className="bg-white/10 hover:bg-red-500/20 p-2 rounded-lg text-red-400 transition-colors"><X size={14} /></button>
                </div>
             </div>
             <div className="space-y-3">
                <div>
                   <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Winning</p>
                   <p className="text-xl font-black text-emerald-400 italic">₹ {(user.winningBalance || 0).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                   <button onClick={() => handleAdjustBalance('winning', true)} className="bg-white/10 hover:bg-emerald-500/20 p-2 rounded-lg text-emerald-400 transition-colors"><Zap size={14} fill="currentColor" /></button>
                   <button onClick={() => handleAdjustBalance('winning', false)} className="bg-white/10 hover:bg-red-500/20 p-2 rounded-lg text-red-400 transition-colors"><X size={14} /></button>
                </div>
             </div>
             <div className="space-y-3">
                <div>
                   <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Bonus</p>
                   <p className="text-xl font-black text-blue-400 italic">₹ {(user.bonusBalance || 0).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                   <button onClick={() => handleAdjustBalance('bonus', true)} className="bg-white/10 hover:bg-emerald-500/20 p-2 rounded-lg text-emerald-400 transition-colors"><Zap size={14} fill="currentColor" /></button>
                   <button onClick={() => handleAdjustBalance('bonus', false)} className="bg-white/10 hover:bg-red-500/20 p-2 rounded-lg text-red-400 transition-colors"><X size={14} /></button>
                </div>
             </div>
          </div>
       </div>

      {/* Credentials & Details */}
      <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-gray-100 space-y-8">
         <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
            <ShieldCheck className="text-[#f42464]" size={22} />
            <h3 className="text-xl font-black font-condensed uppercase tracking-tighter text-gray-800 italic leading-none">Identity Check</h3>
         </div>
         
         <div className="grid grid-cols-1 gap-6">
            <div className="flex items-center gap-5 p-4 bg-gray-50/50 rounded-2xl border border-gray-50">
               <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400"><Mail size={22} /></div>
               <div>
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Electronic Mail</p>
                  <p className="text-sm font-black text-gray-800">{user.email || 'N/A'}</p>
               </div>
            </div>
            <div className="flex items-center gap-5 p-4 bg-gray-50/50 rounded-2xl border border-gray-50">
               <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400"><Phone size={22} /></div>
               <div>
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Mobile Interface</p>
                  <p className="text-sm font-black text-gray-800">{user.mobile || 'No Mobile'}</p>
               </div>
            </div>
         </div>

         {/* Banking & Payout Credentials */}
         <div className="bg-gray-50/30 rounded-[2rem] p-6 border border-gray-100 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
               <Landmark className="text-[#f42464]" size={20} />
               <h4 className="text-sm font-black uppercase tracking-tight text-gray-800 italic font-condensed">Banking & Payout Credentials</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Account Holder Name</p>
                  <p className="text-xs font-black text-gray-800 truncate">{user.accountHolderName || <span className="text-red-500 italic">Not Provided</span>}</p>
               </div>
               <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Account Number</p>
                  <p className="text-xs font-black text-gray-800 truncate">{user.accountNumber || <span className="text-red-500 italic">Not Provided</span>}</p>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">IFSC Code</p>
                  <p className="text-xs font-black text-gray-800 truncate">{user.ifscCode || <span className="text-red-500 italic">Not Provided</span>}</p>
               </div>
               <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">UPI ID / Address</p>
                  <p className="text-xs font-black text-gray-800 truncate">{user.upiId || <span className="text-red-500 italic">Not Provided</span>}</p>
               </div>
            </div>
         </div>

         <div className="space-y-6 pt-4 border-t border-gray-50">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-4">Vault Activity history</h3>
            <div className="space-y-4">
               {activity.length > 0 ? activity.map((act) => (
                  <div key={act.id} className="flex items-center justify-between p-5 bg-white border border-gray-50 rounded-[1.5rem] shadow-sm active:scale-[0.98] transition-all">
                     <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 border-white shadow-sm transition-transform ${
                           act.type === 'Purchase' ? 'bg-[#fce4ec] text-[#f42464]' :
                           act.type === 'Win' ? 'bg-emerald-50 text-emerald-600' :
                           'bg-blue-50 text-blue-600'
                        }`}>
                           {act.type === 'Purchase' ? <Ticket size={20} /> :
                            act.type === 'Win' ? <Activity size={20} /> :
                            <Wallet size={20} />}
                        </div>
                        <div>
                           <h4 className="text-[11px] font-black text-gray-800 uppercase tracking-tight">{act.desc}</h4>
                           <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{act.date}</p>
                        </div>
                     </div>
                     <span className={`text-sm font-black italic tracking-tighter ${act.amount.startsWith('-') ? 'text-red-500' : 'text-emerald-500'}`}>
                        {act.amount}
                     </span>
                  </div>
               )) : (
                 <p className="text-center py-10 text-[9px] font-black uppercase text-gray-300 italic">No Activity Logged</p>
               )}
            </div>
         </div>
      </div>

      {/* Global Actions */}
      <div className="flex flex-col gap-4">
         <div className="flex gap-4">
            <button 
              onClick={handleToggleBlock}
              className={`flex-1 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest active:scale-95 shadow-xl transition-all flex items-center justify-center gap-2 ${
                user.status === 'Blocked' 
                  ? 'bg-emerald-500 text-white shadow-emerald-500/10' 
                  : 'bg-white border-2 border-[#ff004d]/20 text-[#ff004d] shadow-red-500/5'
              }`}
            >
              {user.status === 'Blocked' ? 'Unrestrict Entity' : 'Restrict Entity'}
            </button>
            <button 
              onClick={() => setShowEditModal(true)}
              className="flex-1 bg-gray-900 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest active:scale-95 shadow-xl shadow-black/10 transition-all flex items-center justify-center gap-2"
            >
               Edit Profile <Edit size={16} className="text-[#f42464]" />
            </button>
         </div>
         
         <button 
           onClick={handleSendResetEmail}
           className="w-full bg-blue-600/10 border-2 border-blue-600/20 text-blue-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-600 hover:text-white transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2"
         >
           <Key size={16} /> Request Password Reset
         </button>
         
         <button 
           onClick={handleDeleteUser}
           className="w-full bg-red-600/10 border-2 border-red-600/20 text-red-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all active:scale-95 shadow-lg"
         >
           Purge Profile Identity
         </button>
      </div>
      
      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
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
                       <Edit className="text-[#f42464]" size={24} />
                       <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic leading-none">Modify Profile</h2>
                   </div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Updating global identity records</p>
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
                  { label: 'Full Name', key: 'name', icon: User, type: 'text' },
                  { label: 'Mobile Number', key: 'mobile', icon: Phone, type: 'tel', inputMode: 'numeric', pattern: '[0-9]*' },
                  { label: 'Email Address', key: 'email', icon: Mail, type: 'email' },
                  { label: 'Account Holder Name', key: 'accountHolderName', icon: User, type: 'text' },
                  { label: 'Account Number', key: 'accountNumber', icon: Info, type: 'text', inputMode: 'numeric', pattern: '[0-9]*' },
                  { label: 'IFSC Code', key: 'ifscCode', icon: Key, type: 'text' },
                  { label: 'UPI ID', key: 'upiId', icon: Mail, type: 'text' },
                ].map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{field.label}</label>
                    <div className="relative group/field">
                      <field.icon className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within/field:text-[#f42464] transition-colors" size={18} />
                      <input 
                        required
                        type={field.type} 
                        inputMode={field.inputMode}
                        pattern={field.pattern}
                        value={editData[field.key]}
                        onChange={e => setEditData({...editData, [field.key]: e.target.value})}
                        className="w-full h-15 bg-gray-50/50 border border-gray-100 rounded-2xl pl-16 pr-6 outline-none font-bold text-gray-800 focus:bg-white focus:border-[#f42464]/20 transition-all text-xs"
                      />
                    </div>
                  </div>
                ))}

                <button 
                  type="submit"
                  disabled={updating}
                  className="w-full h-16 bg-gray-900 text-white rounded-2xl font-black text-[12px] uppercase tracking-widest shadow-xl shadow-black/20 flex items-center justify-center gap-3 mt-6 active:scale-95 transition-all disabled:opacity-50"
                >
                   {updating ? 'Synchronizing...' : 'Save Changes'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <div className="pt-10 text-center opacity-30">
         <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] italic">Full Trace Audit Record #{user.id.slice(0, 6)}</p>
      </div>
    </div>
    </PullToRefresh>
  );
};

export default AdminUserDetails;

