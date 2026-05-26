import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, writeBatch, doc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import PageWrapper, { SupportSection } from '../components/PageWrapper';
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, XCircle, RefreshCw, Filter, Search, Ban } from 'lucide-react';

const UserTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all, topups, withdrawals, purchases

  useEffect(() => {
    if (!user?.uid) return;

    // 1. Fetch User Transactions (Topups, Deposits, Purchases)
    const qTx = query(
      collection(db, 'pending_transactions'),
      where('userId', '==', user.uid)
    );

    const unsubscribeTx = onSnapshot(qTx, (snapshot) => {
      const txData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        category: doc.data().type === 'purchase' ? 'purchase' : 'topup'
      }));
      setTransactions(txData);
      setLoading(false);
    });

    // 2. Fetch User Withdrawals
    const qWd = query(
      collection(db, 'withdrawals'),
      where('userId', '==', user.uid)
    );

    const unsubscribeWd = onSnapshot(qWd, (snapshot) => {
      const wdData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        category: 'withdrawal',
        type: 'withdrawal'
      }));
      setWithdrawals(wdData);
    });

    return () => {
      unsubscribeTx();
      unsubscribeWd();
    };
  }, [user]);

  // Combine and sort all financial activities by timestamp descending
  const allActivities = [...transactions, ...withdrawals].sort((a, b) => {
    const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : Date.now();
    const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : Date.now();
    return timeB - timeA;
  });

  const filteredActivities = allActivities.filter(item => {
    if (activeTab === 'all') return true;
    if (activeTab === 'topups') return item.category === 'topup';
    if (activeTab === 'withdrawals') return item.category === 'withdrawal';
    if (activeTab === 'purchases') return item.category === 'purchase';
    return true;
  });

  const handleCancelWithdrawal = async (item) => {
    if (item.category !== 'withdrawal' || item.status !== 'pending') return;
    
    if (!window.confirm("Are you sure you want to cancel this withdrawal request? The deducted amount will be immediately refunded to your winning balance.")) {
      return;
    }

    try {
      const batch = writeBatch(db);
      
      // 1. Update withdrawal status
      const withdrawalRef = doc(db, 'withdrawals', item.id);
      batch.update(withdrawalRef, {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        cancelledBy: 'user'
      });
      
      // 2. Refund user wallet
      const userRef = doc(db, 'users', user.uid);
      batch.update(userRef, {
        winningBalance: increment(item.amount),
        balance: increment(item.amount)
      });
      
      await batch.commit();
      alert("Withdrawal request cancelled successfully! Your winning balance has been restored.");
    } catch (error) {
      console.error("Error cancelling withdrawal:", error);
      alert("Failed to cancel withdrawal. Please try again.");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
      case 'success':
        return (
          <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm">
            <CheckCircle2 size={12} /> Approved
          </span>
        );
      case 'rejected':
      case 'error':
        return (
          <span className="flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm">
            <XCircle size={12} /> Rejected
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center gap-1 bg-gray-100 text-gray-500 border border-gray-200 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm">
            <Ban size={12} /> Cancelled by User
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm animate-pulse">
            <Clock size={12} /> Pending Verification
          </span>
        );
    }
  };

  const getCategoryIcon = (category, type) => {
    if (category === 'withdrawal') {
      return (
        <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shadow-sm shrink-0 border border-purple-100">
          <ArrowUpRight size={22} />
        </div>
      );
    }
    if (category === 'purchase') {
      return (
        <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center shadow-sm shrink-0 border border-orange-100">
          <Wallet size={22} />
        </div>
      );
    }
    return (
      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm shrink-0 border border-blue-100">
        <ArrowDownLeft size={22} />
      </div>
    );
  };

  return (
    <PageWrapper title="TRANSACTION HISTORY" showBack={true}>
      <div className="bg-white min-h-screen p-4 flex flex-col items-center pb-24">
        {/* Header Overview Card */}
        <div className="w-full max-w-sm bg-gradient-to-br from-gray-900 to-black rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden mb-6 group">
          <div className="absolute top-0 right-0 p-6 opacity-10 bg-white rounded-bl-[2.5rem] group-hover:scale-110 transition-transform">
            <Wallet size={48} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Financial Ledger</p>
          <h3 className="text-2xl font-black italic tracking-tighter uppercase font-condensed">Activity Statement</h3>
          
          <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Total Records</p>
              <p className="text-sm font-black text-white italic">{allActivities.length} Transactions</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Sync Status</p>
              <p className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                <RefreshCw size={10} className="animate-spin" /> Real-Time Active
              </p>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="w-full max-w-sm flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-6">
          {[
            { id: 'all', label: 'All Activities' },
            { id: 'topups', label: 'Top-ups & Deposits' },
            { id: 'withdrawals', label: 'Withdrawals' },
            { id: 'purchases', label: 'Ticket Purchases' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shrink-0 transition-all ${
                activeTab === tab.id
                  ? 'bg-[#ff0033] text-white shadow-lg shadow-red-500/20 scale-105'
                  : 'bg-gray-50 text-gray-400 border border-gray-100 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Transactions List */}
        <div className="w-full max-w-sm space-y-4">
          {loading ? (
            <div className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest text-[10px]">
              Loading Financial Records...
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="bg-gray-50 rounded-[2.5rem] p-12 text-center border border-gray-100 shadow-inner">
              <Filter className="mx-auto text-gray-300 mb-4" size={40} />
              <p className="text-xs font-black uppercase tracking-widest text-gray-400 italic mb-1">No Records Found</p>
              <p className="text-[10px] font-bold text-gray-400 max-w-[200px] mx-auto leading-relaxed">
                No financial transactions match the selected filter category.
              </p>
            </div>
          ) : (
            filteredActivities.map((item) => {
              const dateObj = item.timestamp?.toDate ? item.timestamp.toDate() : new Date();
              const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
              const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

              return (
                <div 
                  key={item.id} 
                  className="bg-white rounded-[2rem] p-5 border border-gray-100 shadow-lg hover:shadow-xl transition-all flex flex-col gap-4 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {getCategoryIcon(item.category, item.type)}
                      <div>
                        <p className="text-sm font-black text-gray-900 uppercase tracking-tight italic leading-none mb-1">
                          {item.category === 'withdrawal' ? 'Payout Withdrawal' : item.category === 'purchase' ? 'Ticket Purchase' : 'Wallet Top-Up'}
                        </p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                          <Clock size={10} /> {dateStr} • {timeStr}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={`text-lg font-black italic tracking-tighter ${item.category === 'withdrawal' || item.category === 'purchase' ? 'text-gray-900' : 'text-emerald-600'}`}>
                        {item.category === 'withdrawal' || item.category === 'purchase' ? '-' : '+'}₹{parseFloat(item.amount).toLocaleString()}
                      </p>
                      <div className="mt-1">{getStatusBadge(item.status)}</div>
                    </div>
                  </div>

                  {/* Additional Details Box */}
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2 text-[10px]">
                    {item.transactionId && (
                      <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                        <span className="font-black text-gray-400 uppercase tracking-widest">Transaction ID / UTR</span>
                        <span className="font-bold text-gray-800 select-all">{item.transactionId}</span>
                      </div>
                    )}
                    {item.upiId && (
                      <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                        <span className="font-black text-gray-400 uppercase tracking-widest">Target UPI ID</span>
                        <span className="font-bold text-purple-600 select-all">{item.upiId}</span>
                      </div>
                    )}
                    {item.userEnteredAmount !== undefined && item.userEnteredAmount !== null && item.userEnteredAmount > 0 && (
                      <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                        <span className="font-black text-gray-400 uppercase tracking-widest">User Paid Amount</span>
                        <span className="font-bold text-emerald-600">₹{item.userEnteredAmount}</span>
                      </div>
                    )}
                    {item.paymentType && (
                      <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                        <span className="font-black text-gray-400 uppercase tracking-widest">Payment Method</span>
                        <span className="font-bold text-gray-800">{item.paymentType}</span>
                      </div>
                    )}
                    {item.rejectionReason && (
                      <div className="flex justify-between items-center bg-red-50 p-2 rounded-xl border border-red-100 mt-1">
                        <span className="font-black text-red-500 uppercase tracking-widest">Reason</span>
                        <span className="font-bold text-red-700 italic">{item.rejectionReason}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-0.5">
                      <span className="font-black text-gray-400 uppercase tracking-widest">Record ID</span>
                      <span className="font-bold text-gray-400">{item.id.slice(0, 10)}</span>
                    </div>
                    {item.category === 'withdrawal' && item.status === 'pending' && (
                      <div className="pt-2">
                        <button 
                          onClick={() => handleCancelWithdrawal(item)}
                          className="w-full bg-white border-2 border-red-100 text-red-500 hover:bg-red-50 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
                        >
                          <Ban size={14} /> Cancel Request
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <SupportSection />

        <div className="mt-10 text-center opacity-30">
          <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.4em] italic leading-tight">
            SMS Lottery Financial Transparency Gateway v4.2
          </p>
        </div>
      </div>
    </PageWrapper>
  );
};

export default UserTransactions;
