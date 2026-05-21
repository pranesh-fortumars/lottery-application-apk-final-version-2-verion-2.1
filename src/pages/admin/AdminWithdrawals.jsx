import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, writeBatch, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { CheckCircle2, XCircle, Clock, ShieldAlert, Zap, Phone, Landmark, ArrowUpRight, Filter, RefreshCw, BadgeCheck } from 'lucide-react';

const AdminWithdrawals = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // pending, history

  useEffect(() => {
    // Fetch ALL withdrawal requests to dynamically sync pending and history in real-time
    const q = query(collection(db, 'withdrawals'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      data.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
      setRequests(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async (req) => {
    if (!window.confirm(`APPROVE WITHDRAWAL: ₹${req.amount} to ${req.upiId}?`)) return;

    try {
      const batch = writeBatch(db);
      const reqRef = doc(db, 'withdrawals', req.id);
      const userRef = doc(db, 'users', req.userId);

      // 1. Update Request Status
      batch.update(reqRef, { 
        status: 'approved', 
        processedAt: serverTimestamp() 
      });

      // 2. No balance deduction needed here anymore! 
      // The balance is already deducted and placed into 'escrow' when the user requested it.

      // 3. Create Notification for User
      const notifRef = doc(collection(db, 'notifications'));
      batch.set(notifRef, {
        userId: req.userId,
        title: 'Withdrawal Success',
        message: `Your withdrawal of ₹${req.amount} has been approved and sent to ${req.upiId}.`,
        type: 'success',
        read: false,
        timestamp: serverTimestamp()
      });

      await batch.commit();
      alert(`Withdrawal approved and processed!`);
    } catch (error) {
      console.error("Approval error:", error);
      alert("Failed to process withdrawal.");
    }
  };

  const handleReject = async (req) => {
    const reason = window.prompt("Reason for rejection (Optional):");
    if (reason === null) return;

    try {
      const batch = writeBatch(db);
      const reqRef = doc(db, 'withdrawals', req.id);
      
      batch.update(reqRef, {
        status: 'rejected',
        rejectionReason: reason,
        rejectedAt: serverTimestamp()
      });

      // Refund the balance back to the user since the withdrawal was rejected
      const userRef = doc(db, 'users', req.userId);
      batch.update(userRef, {
        winningBalance: increment(req.amount),
        balance: increment(req.amount)
      });

      // Create Notification for User
      const notifRef = doc(collection(db, 'notifications'));
      batch.set(notifRef, {
        userId: req.userId,
        title: 'Withdrawal Rejected',
        message: `Your withdrawal of ₹${req.amount} was rejected. ${reason ? 'Reason: ' + reason : ''}`,
        type: 'error',
        read: false,
        timestamp: serverTimestamp()
      });

      await batch.commit();
      alert("Withdrawal request rejected.");
    } catch (error) {
      console.error("Rejection error:", error);
      alert("Failed to reject request.");
    }
  };

  const pendingReqs = requests.filter(req => req.status === 'pending');
  const historyReqs = requests.filter(req => req.status !== 'pending');

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold uppercase tracking-widest text-[10px]">Loading...</div>;

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header Banner */}
      <div className="border-[1.5px] border-emerald-500 rounded-[2.5rem] p-6 bg-white shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl"></div>
         <div className="flex gap-4 items-center mb-6">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
               <Landmark size={28} />
            </div>
            <div className="flex-grow">
               <h2 className="text-2xl font-black text-gray-900 font-condensed uppercase tracking-tighter italic">Withdrawal Requests</h2>
               <p className="text-emerald-600 font-black text-[10px] uppercase tracking-widest leading-none mt-1">Real-Time Payout Oversight</p>
            </div>
         </div>
         
         <div className="flex bg-gray-50 p-4 rounded-2xl items-center justify-between">
            <div className="flex items-center gap-3">
               <RefreshCw className="text-emerald-500 animate-spin" size={16} />
               <span className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Live Sync Active</span>
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Records: {requests.length}</span>
         </div>
      </div>

      {/* Tab Buttons */}
      <div className="flex gap-3 bg-gray-100 p-1.5 rounded-2xl">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
            activeTab === 'pending'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 scale-[1.02]'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Pending Payouts
          <span className={`px-2 py-0.5 rounded-full text-[9px] ${activeTab === 'pending' ? 'bg-white text-emerald-600' : 'bg-gray-200 text-gray-600'}`}>
            {pendingReqs.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
            activeTab === 'history'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 scale-[1.02]'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Payout History
          <span className={`px-2 py-0.5 rounded-full text-[9px] ${activeTab === 'history' ? 'bg-white text-emerald-600' : 'bg-gray-200 text-gray-600'}`}>
            {historyReqs.length}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'pending' ? (
        pendingReqs.length === 0 ? (
           <div className="bg-gray-50 rounded-[2rem] p-12 text-center border border-gray-100 shadow-inner">
              <BadgeCheck className="mx-auto text-emerald-400 mb-4 opacity-50" size={48} />
              <p className="text-[12px] font-black uppercase tracking-widest text-gray-400 italic">No Pending Requests</p>
           </div>
        ) : (
          <div className="space-y-4">
            {pendingReqs.map(req => (
              <div key={req.id} className="bg-white rounded-3xl p-5 shadow-lg border border-gray-100 flex flex-col gap-4 group hover:border-emerald-100 transition-all">
                <div className="flex justify-between items-start">
                   <div>
                      <div className="flex items-center gap-2">
                         <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md uppercase tracking-widest">Payout Pending</span>
                      </div>
                      <p className="text-lg font-black text-gray-900 leading-none mt-2">{req.userName}</p>
                      <div className="flex items-center gap-2 mt-1">
                         <Phone size={10} className="text-gray-400" />
                         <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{req.userMobile}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Request Amount</p>
                      <p className="text-2xl font-black text-emerald-600 tracking-tighter italic">₹{req.amount}</p>
                   </div>
                </div>

                <div className="bg-gray-950 p-5 rounded-2xl flex flex-col relative overflow-hidden space-y-3 shadow-xl">
                   <div className="absolute top-0 right-0 p-4 opacity-10 text-white">
                      <ArrowUpRight size={32} />
                   </div>
                   <div>
                     <p className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-0.5">Account Holder Name</p>
                     <p className="text-xs font-black text-white tracking-tight italic select-all">{req.accountHolderName || req.userName}</p>
                   </div>
                   <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                     <div>
                       <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">Account Number</p>
                       <p className="text-xs font-black text-white tracking-tight italic select-all">{req.accountNumber || 'N/A'}</p>
                     </div>
                     <div>
                       <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">IFSC Code</p>
                       <p className="text-xs font-black text-white tracking-tight italic select-all">{req.ifscCode || 'N/A'}</p>
                     </div>
                   </div>
                   <div className="pt-2 border-t border-white/10">
                     <p className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-0.5">Target UPI ID</p>
                     <p className="text-xs font-black text-white tracking-tight italic select-all">{req.upiId}</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleApprove(req)}
                    className="bg-emerald-600 text-white p-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 flex justify-center items-center gap-2 active:scale-95 transition-transform"
                  >
                    <CheckCircle2 size={16} /> Approve & Paid
                  </button>
                  <button 
                    onClick={() => handleReject(req)}
                    className="bg-gray-100 text-gray-500 p-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex justify-center items-center gap-2 hover:bg-red-50 hover:text-red-500 transition-colors active:scale-95"
                  >
                    <XCircle size={16} /> Reject Request
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        historyReqs.length === 0 ? (
           <div className="bg-gray-50 rounded-[2rem] p-12 text-center border border-gray-100 shadow-inner">
              <Filter className="mx-auto text-gray-300 mb-4" size={40} />
              <p className="text-[12px] font-black uppercase tracking-widest text-gray-400 italic">No Payout History Found</p>
           </div>
        ) : (
          <div className="space-y-4">
            {historyReqs.map(req => {
              const dateObj = req.timestamp?.toDate ? req.timestamp.toDate() : new Date();
              const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
              const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

              const actionDateObj = (req.processedAt || req.rejectedAt)?.toDate ? (req.processedAt || req.rejectedAt).toDate() : dateObj;
              const actionTimeStr = actionDateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

              return (
                <div key={req.id} className="bg-white rounded-3xl p-5 shadow-lg border border-gray-100 flex flex-col gap-4 group hover:border-emerald-100 transition-all">
                  <div className="flex justify-between items-start">
                     <div>
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] font-black bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md uppercase tracking-widest">Withdrawal Request</span>
                        </div>
                        <p className="text-lg font-black text-gray-900 leading-none mt-2">{req.userName}</p>
                        <div className="flex items-center gap-2 mt-1">
                           <Phone size={10} className="text-gray-400" />
                           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{req.userMobile}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Request Amount</p>
                        <p className="text-2xl font-black text-gray-900 tracking-tighter italic">₹{req.amount}</p>
                        <div className="mt-2">
                           {req.status === 'approved' ? (
                             <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm flex items-center gap-1 justify-end">
                               <CheckCircle2 size={12} /> Approved & Paid
                             </span>
                           ) : (
                             <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm flex items-center gap-1 justify-end">
                               <XCircle size={12} /> Rejected
                             </span>
                           )}
                        </div>
                     </div>
                  </div>

                  <div className="bg-gray-950 p-5 rounded-2xl flex flex-col relative overflow-hidden space-y-3 shadow-xl">
                     <div className="absolute top-0 right-0 p-4 opacity-10 text-white">
                        <ArrowUpRight size={32} />
                     </div>
                     <div>
                       <p className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-0.5">Account Holder Name</p>
                       <p className="text-xs font-black text-white tracking-tight italic select-all">{req.accountHolderName || req.userName}</p>
                     </div>
                     <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                       <div>
                         <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">Account Number</p>
                         <p className="text-xs font-black text-white tracking-tight italic select-all">{req.accountNumber || 'N/A'}</p>
                       </div>
                       <div>
                         <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">IFSC Code</p>
                         <p className="text-xs font-black text-white tracking-tight italic select-all">{req.ifscCode || 'N/A'}</p>
                       </div>
                     </div>
                     <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                       <div>
                         <p className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-0.5">Target UPI ID</p>
                         <p className="text-xs font-black text-white tracking-tight italic select-all">{req.upiId}</p>
                       </div>
                       <div className="text-right">
                         <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">Requested</p>
                         <p className="text-[10px] font-bold text-gray-300">{dateStr} • {timeStr}</p>
                       </div>
                     </div>

                     {req.rejectionReason && (
                       <div className="pt-2 border-t border-red-500/30 bg-red-500/10 p-3 rounded-xl mt-2">
                         <p className="text-[8px] font-black text-red-400 uppercase tracking-[0.2em] mb-0.5">Rejection Reason</p>
                         <p className="text-xs font-bold text-red-200 italic">{req.rejectionReason}</p>
                       </div>
                     )}

                     <div className="pt-2 border-t border-white/10 flex justify-between items-center text-[9px] text-gray-400">
                        <span className="font-black uppercase tracking-widest">Action Date & Time</span>
                        <span className="font-bold">{dateStr} • {actionTimeStr}</span>
                     </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};

export default AdminWithdrawals;
