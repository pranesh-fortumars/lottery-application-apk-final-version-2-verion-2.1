import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  UserPlus,
  X,
  User,
  Mail,
  Phone,
  Wallet,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { subscribeToUsers } from '../../services/firebaseService';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const AdminUsers = () => {
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    mobile: '',
    balance: ''
  });

  useEffect(() => {
    const unsubscribe = subscribeToUsers((fetchedUsers) => {
      setUsers(fetchedUsers);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.mobile) return;

    try {
      const userToAdd = {
        name: newUser.name,
        email: newUser.email,
        mobile: newUser.mobile,
        depositedBalance: newUser.balance ? parseInt(newUser.balance) : 0,
        winningBalance: 0,
        bonusBalance: 0,
        balance: newUser.balance ? parseInt(newUser.balance) : 0,
        status: 'Active',
        role: 'user',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'users'), userToAdd);
      
      setNewUser({ name: '', email: '', mobile: '', balance: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding user:", error);
      alert("Failed to register user");
    }
  };

  const filteredUsers = users.filter(user => {
    if (user.status === 'Deleted' || user.isDeleted || user.active === false) return false;
    return (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
           (user.mobile?.includes(searchTerm) || '');
  });

  return (
    <div className="space-y-10 p-4 pb-24 relative min-h-screen bg-[#f8f9fa]">
      {/* Top Banner */}
      <div className="border-[1.5px] border-[#ff004d] rounded-[2.5rem] p-6 bg-white shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff004d]/5 rounded-full blur-3xl"></div>
         <div className="flex gap-4 items-center">
            <img src="https://img.icons8.com/color/64/000000/treasure-chest.png" alt="Chest" className="w-16 h-16 drop-shadow-xl" />
            <div className="flex-grow">
               <h2 className="text-2xl font-black text-gray-900 font-condensed uppercase tracking-tighter italic">Player Vault</h2>
               <p className="text-[#ff004d] font-black text-[10px] uppercase tracking-widest leading-none mt-1">Total Members: {users.length}</p>
            </div>
         </div>
      </div>

      {/* Search & Actions */}
      <div className="space-y-4">
        <div className="relative group">
           <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#f42464] transition-colors" size={20} />
           <input 
             type="text" 
             placeholder="Search by name or mobile..." 
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full h-15 bg-white border border-gray-100 rounded-2xl pl-16 pr-6 outline-none font-bold text-gray-800 shadow-sm text-sm placeholder:text-gray-300 focus:border-[#f42464]/30 transition-all"
           />
        </div>
        
        <button 
          onClick={() => setShowAddForm(true)}
          className="w-full h-15 bg-gray-900 rounded-2xl font-black text-[11px] text-white uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all shadow-black/10"
        >
          <UserPlus size={20} className="text-[#f42464]" /> Register New Player
        </button>
      </div>

      {/* User Cards */}
      <div className="space-y-5">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-2 italic">Active Member List</p>
        
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f42464]"></div>
          </div>
        ) : (
          <AnimatePresence>
            {filteredUsers.length > 0 ? filteredUsers.map((user) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={user.id} 
                onClick={() => navigate(`/admin/users/${user.id}`)}
                className="bg-white rounded-[2rem] p-5 shadow-lg border border-gray-100 flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden"
              >
                 <div className="flex items-center gap-4 relative z-10">
                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-[#f42464] font-black text-xl border border-white shadow-sm group-hover:bg-[#f42464] group-hover:text-white transition-all transform group-hover:rotate-6">
                       {user.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                       <h4 className="font-black text-gray-800 text-sm tracking-tight uppercase italic">{user.name || 'Anonymous'}</h4>
                       <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">{user.mobile || 'No Mobile'}</p>
                    </div>
                 </div>
                  <div className="text-right flex items-center gap-4 relative z-10">
                    <div className="space-y-1">
                      <p className="font-black text-gray-900 text-sm italic leading-none">₹{(user.balance || 0).toLocaleString()}</p>
                      <div className="flex flex-col items-end gap-0.5">
                         <span className="text-[7px] font-black uppercase text-gray-400">Dep: ₹{(user.depositedBalance || 0).toLocaleString()}</span>
                         <span className="text-[7px] font-black uppercase text-emerald-500">Win: ₹{(user.winningBalance || 0).toLocaleString()}</span>
                         <span className="text-[7px] font-black uppercase text-blue-500">Bon: ₹{(user.bonusBalance || 0).toLocaleString()}</span>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-100 group-hover:text-[#f42464] transition-colors" />
                  </div>
              </motion.div>
            )) : (
              <div className="text-center py-10 opacity-30">
                 <AlertCircle className="mx-auto mb-2" size={32} />
                 <p className="text-[10px] font-black uppercase tracking-widest">No Players Found</p>
              </div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-end justify-center p-4 pb-10"
            onClick={() => setShowAddForm(false)}
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
                       <UserPlus className="text-[#f42464]" size={24} />
                       <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic leading-none">New Identity</h2>
                   </div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Registering unique player credentials</p>
                </div>
                <button 
                  onClick={() => setShowAddForm(false)}
                  className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 active:bg-red-50 active:text-red-500 transition-all border border-gray-100"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddUser} className="space-y-5">
                {[
                  { label: 'Full Name', key: 'name', icon: User, type: 'text', placeholder: 'Legal name of player' },
                  { label: 'Mobile Number', key: 'mobile', icon: Phone, type: 'tel', placeholder: '+91 00000 00000', inputMode: 'numeric', pattern: '[0-9]*' },
                  { label: 'Email (Optional)', key: 'email', icon: Mail, type: 'email', placeholder: 'contact@player.com' },
                  { label: 'Starting Balance', key: 'balance', icon: Wallet, type: 'text', placeholder: '₹ 0.00', inputMode: 'decimal', pattern: '[0-9]*' },
                ].map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{field.label}</label>
                    <div className="relative group/field">
                      <field.icon className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within/field:text-[#f42464] transition-colors" size={18} />
                      <input 
                        required={field.key !== 'email'}
                        type={field.type} 
                        inputMode={field.inputMode}
                        pattern={field.pattern}
                        placeholder={field.placeholder} 
                        value={newUser[field.key]}
                        onChange={e => setNewUser({...newUser, [field.key]: e.target.value})}
                        className="w-full h-15 bg-gray-50/50 border border-gray-100 rounded-2xl pl-16 pr-6 outline-none font-bold text-gray-800 focus:bg-white focus:border-[#f42464]/20 transition-all text-xs placeholder:text-gray-300"
                      />
                    </div>
                  </div>
                ))}

                <button 
                  type="submit"
                  className="w-full h-16 bg-gradient-to-r from-[#f42464] to-[#ff004d] text-white rounded-2xl font-black text-[12px] uppercase tracking-widest shadow-xl shadow-[#f42464]/20 flex items-center justify-center gap-3 mt-6 active:scale-95 transition-all"
                >
                   Finalize Registration <CheckCircle2 size={24} className="text-white/40" />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminUsers;

