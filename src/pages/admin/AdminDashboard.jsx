import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Ticket, 
  TrendingUp, 
  Wallet,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Target,
  Zap,
  Landmark
} from 'lucide-react';
import { subscribeToUsers, subscribeToResults, subscribeToTickets } from '../../services/firebaseService';
import PullToRefresh from '../../components/PullToRefresh';

const AdminDashboard = () => {
  const [stats, setStats] = useState([
    { label: 'Total Users', value: '0', icon: Users, change: '0%', color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50' },
    { label: 'Today Tickets', value: '0', icon: Ticket, change: '0%', color: 'from-[#f42464] to-[#ff004d]', bg: 'bg-[#fce4ec]' },
    { label: 'Revenue (Today)', value: '₹0', icon: Wallet, change: '0%', color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Active Sessions', value: '0', icon: TrendingUp, change: '0%', color: 'from-orange-500 to-orange-600', bg: 'bg-orange-50' },
  ]);

  const [recentDraws, setRecentDraws] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeResults;
    let unsubscribeUsers;
    let unsubscribeTickets;

    const calculateStats = (usersData, ticketsData) => {
      const now = new Date();
      const todayStr = now.toLocaleDateString();
      
      const todayTicketsCount = ticketsData.filter(t => {
         if (!t.timestamp) return false;
         return t.timestamp.toDate().toLocaleDateString() === todayStr;
      }).length;

      const totalRevenue = ticketsData.reduce((sum, t) => sum + (parseFloat(t.price || 0) * (t.qty || 1)), 0);

      setStats([
        { label: 'Total Users', value: usersData.length.toString(), icon: Users, change: '+0%', color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50' },
        { label: 'Today Tickets', value: todayTicketsCount.toString(), icon: Ticket, change: '+0%', color: 'from-[#f42464] to-[#ff004d]', bg: 'bg-[#fce4ec]' },
        { label: 'Revenue (Lifetime)', value: `₹${totalRevenue.toLocaleString()}`, icon: Wallet, change: '+0%', color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Active Sessions', value: 'Live', icon: TrendingUp, change: 'Stable', color: 'from-orange-500 to-orange-600', bg: 'bg-orange-50' },
      ]);
      setLoading(false);
    };

    let latestUsers = [];
    let latestTickets = [];
    let usersLoaded = false;
    let ticketsLoaded = false;

    try {
      unsubscribeUsers = subscribeToUsers((users) => {
        latestUsers = users;
        usersLoaded = true;
        if (usersLoaded && ticketsLoaded) calculateStats(latestUsers, latestTickets);
      });

      unsubscribeTickets = subscribeToTickets((tickets) => {
        latestTickets = tickets;
        ticketsLoaded = true;
        if (usersLoaded && ticketsLoaded) calculateStats(latestUsers, latestTickets);
      });

      unsubscribeResults = subscribeToResults((results) => {
         setRecentDraws(results.slice(0, 4));
      });

    } catch (error) {
      console.error("Dashboard data fetch error:", error);
      setLoading(false);
    }

    return () => {
      if (unsubscribeResults) unsubscribeResults();
      if (unsubscribeUsers) unsubscribeUsers();
      if (unsubscribeTickets) unsubscribeTickets();
    };
  }, []);

  const handleRefresh = async () => {
    // Since listeners are active, just provide a smooth UI delay
    await new Promise(r => setTimeout(r, 600));
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-10 pb-20 p-4">
      {/* Premium Admin Header */}
      <div className="border-[1.5px] border-[#ff004d] rounded-[2.5rem] p-6 bg-white shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff004d]/5 rounded-full blur-3xl"></div>
         <div className="flex gap-4 items-center mb-6">
            <img src="https://img.icons8.com/color/64/000000/treasure-chest.png" alt="Chest" className="w-16 h-16 drop-shadow-xl" />
            <div className="flex-grow">
               <h2 className="text-2xl font-black text-gray-900 font-condensed uppercase tracking-tighter italic">Command Center</h2>
               <p className="text-[#ff004d] font-black text-[10px] uppercase tracking-widest leading-none mt-1">SMS Lottery Oversight v4.1</p>
            </div>
         </div>
         
         <div className="flex bg-gray-50 p-4 rounded-2xl items-center justify-between">
            <div className="flex items-center gap-3">
               <Zap className={`${loading ? 'text-gray-300' : 'text-amber-500'} animate-pulse`} size={20} fill="currentColor" />
               <span className="text-[10px] font-black text-gray-800 uppercase tracking-widest">{loading ? "Synchronizing..." : "Real-Time Data Active"}</span>
            </div>
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Sync Priority: High</span>
         </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-[2rem] shadow-lg border border-gray-100 group active:scale-95 transition-all">
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center mb-4 shadow-sm group-hover:rotate-6 transition-transform`}>
              <stat.icon size={20} className="text-[#f42464]" />
            </div>
            <h3 className="text-gray-400 text-[9px] font-black uppercase tracking-widest mb-1">{stat.label}</h3>
            <p className="text-lg font-black text-gray-800 tracking-tight italic">{stat.value}</p>
            <div className={`mt-2 text-[8px] font-black uppercase ${stat.change.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>
               {stat.change} vs Yesterday
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={() => { window.location.href = '/admin/approvals'; }}
        className="w-full bg-[#ff0033] text-white p-5 rounded-3xl shadow-[0_10px_30px_-10px_rgba(255,0,51,0.5)] flex items-center justify-between mt-4 active:scale-95 transition-all"
      >
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <span className="font-black text-white italic text-xl">₹</span>
           </div>
           <div className="text-left">
              <h3 className="font-black text-lg uppercase tracking-tight leading-none italic">Manage Payments</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mt-1">Review pending topups & payments</p>
           </div>
        </div>
        <ChevronRight size={24} className="text-white/50" />
      </button>

      <button 
        onClick={() => { window.location.href = '/admin/withdrawals'; }}
        className="w-full bg-emerald-600 text-white p-5 rounded-3xl shadow-[0_10px_30px_-10px_rgba(5,150,105,0.5)] flex items-center justify-between mt-4 active:scale-95 transition-all"
      >
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Landmark size={24} className="text-white" />
           </div>
           <div className="text-left">
              <h3 className="font-black text-lg uppercase tracking-tight leading-none italic">Withdrawal Requests</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mt-1">Process payout requests from users</p>
           </div>
        </div>
        <ChevronRight size={24} className="text-white/50" />
      </button>

      {/* Main Reports Area */}
      <div className="space-y-8">
        {/* Draw Performance */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100">
           <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                 <Target className="text-[#f42464]" size={24} />
                 <h2 className="text-xl font-black text-gray-800 font-condensed uppercase tracking-tighter">Recent Results</h2>
              </div>
              <button className="text-[#f42464] text-[10px] font-extrabold uppercase tracking-widest bg-red-50 px-4 py-2 rounded-full">Explore All</button>
           </div>
           
           <div className="space-y-6">
              {recentDraws.length > 0 ? recentDraws.map((draw, idx) => (
                <div key={idx} className="flex flex-col gap-4 bg-gray-50/50 p-5 rounded-3xl border border-transparent hover:border-gray-100 transition-all group">
                   <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-gray-800 shadow-sm group-hover:scale-110 transition-transform">{draw.draw?.split(':')[0] || '--'}</div>
                         <div>
                            <p className="text-[10px] font-black text-gray-800 uppercase tracking-tight">{draw.brand} {draw.draw}</p>
                            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">{draw.date || 'Today'}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-[12px] font-black text-gray-900 tracking-[0.2em]">{draw.number}</p>
                         <span className="text-[8px] font-black uppercase tracking-widest text-[#f42464] opacity-40">Declared</span>
                      </div>
                   </div>
                </div>
              )) : (
                <div className="text-center py-10 opacity-20">
                   <p className="text-[10px] font-black uppercase tracking-widest italic">No Recent Results Declared</p>
                </div>
              )}
           </div>
        </div>

        {/* Live System Log */}
        <div className="bg-gray-900 rounded-[2.5rem] p-8 shadow-2xl text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5 bg-white rounded-bl-[2.5rem]">
              <Clock size={48} />
           </div>
           
           <h2 className="text-xl font-black font-condensed uppercase tracking-tighter mb-8 flex items-center gap-3">
              <Zap className="text-amber-500" size={20} fill="currentColor" /> System Intelligence
           </h2>
           
           <div className="space-y-6">
              {[
                { user: 'Admin System', action: 'FIREBASE SYNC ACTIVE', time: 'Just Now', color: 'text-[#f42464]' },
                { user: 'Security Module', action: 'DATABASE COMPRESSION: 0%', time: 'Stable', color: 'text-blue-400' },
                { user: 'Traffic Monitor', action: 'GATEWAY STATUS: OPTIMAL', time: 'Active', color: 'text-emerald-400' },
              ].map((log, idx) => (
                <div key={idx} className="flex gap-4 items-start border-l-2 border-white/10 pl-5 relative">
                   <div className="absolute left-[-5px] top-1.5 w-2 h-2 bg-[#f42464] rounded-full shadow-[0_0_10px_rgba(244,36,100,0.8)]"></div>
                   <div className="flex-grow">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{log.user}</p>
                      <p className={`text-base font-black italic tracking-tight ${log.color} mt-1 uppercase`}>{log.action}</p>
                      <p className="text-[8px] text-gray-500 font-bold uppercase mt-1">{log.time}</p>
                   </div>
                   <ChevronRight size={16} className="text-white/10" />
                </div>
              ))}
           </div>
        </div>
      </div>
      </div>
    </PullToRefresh>
  );
};

export default AdminDashboard;

