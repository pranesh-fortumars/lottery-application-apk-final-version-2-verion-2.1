import React, { useState, useMemo } from 'react';
import PageWrapper, { SupportSection } from '../components/PageWrapper';
import { Calendar, RefreshCw, Search, Trophy, Receipt, Download, Printer, ShieldCheck, Clock, Zap } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getBrandBySlot } from '../constants/lotteryConfig';

const MyTickets = () => {
  const { purchasedTickets, refreshTickets, loading, declaredResults } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Filter State - Initialized to TODAY
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAll, setShowAll] = useState(false);

  // Auto-refresh when results change
  React.useEffect(() => {
    if (declaredResults.length > 0) {
      const timer = setTimeout(() => refreshTickets(), 1000);
      return () => clearTimeout(timer);
    }
  }, [declaredResults]);

  // Helper to find declared result for a ticket
  const getDeclaredResult = (date, draw) => {
     if (!declaredResults) return '-';
     const result = declaredResults.find(r => r.date === date && r.draw === draw);
     return result ? result.number : '-';
  };

  // Advanced Grouping with Strict Date Filtering
  const transactionGroups = useMemo(() => {
    if (!purchasedTickets || !Array.isArray(purchasedTickets)) return [];
    
    // 1. Strict filtering by date or full history
    const baseList = showAll 
      ? [...purchasedTickets] 
      : purchasedTickets.filter(t => {
          // Normalize both dates to ensure exact string match (YYYY-MM-DD)
          const tDate = t.purchaseDate ? String(t.purchaseDate).trim() : '';
          return tDate === filterDate;
        });

    const groups = {};
    baseList.forEach(t => {
       const pid = t.purchaseId || 'UNTRACKED';
       if (!groups[pid]) {
          groups[pid] = {
             id: pid,
             date: t.purchaseDate,
             time: t.purchaseTime || '00:00',
             drawSlots: {},
             totalWin: 0,
             totalPurchase: 0,
             brand: (t.title || 'LOTTERY').split('-')[0].trim().toUpperCase()
          };
       }
       
       const slotKey = t.draw || 'N/A';
       if (!groups[pid].drawSlots[slotKey]) {
          groups[pid].drawSlots[slotKey] = {
             slot: slotKey.replace(/[\[\]]/g, ''),
             declaredNum: getDeclaredResult(t.purchaseDate, t.draw),
             tickets: []
          };
       }
       
       groups[pid].drawSlots[slotKey].tickets.push(t);
       
       if (t.status === 'Won') {
          const winAmt = parseInt(String(t.prize || "0").replace(/[^\d]/g, '')) || 0;
          groups[pid].totalWin += winAmt;
       }

       const cost = (parseFloat(t.price) || 0) * (parseInt(t.qty) || 1);
       groups[pid].totalPurchase += cost;
    });

    // Sort: Newest transactions first
    return Object.values(groups).sort((a, b) => {
       if (a.date !== b.date) return new Date(b.date) - new Date(a.date);
       return String(b.time).localeCompare(String(a.time));
    });
  }, [purchasedTickets, filterDate, showAll, declaredResults]);

  const resultCount = useMemo(() => transactionGroups.length, [transactionGroups]);

  return (
    <PageWrapper title="RESULT DECLARATION">
      <div className="bg-[#f0f0f0] min-h-screen p-2 sm:p-4 pb-24 space-y-4 font-sans">
        
        {/* --- DYNAMIC FILTER BAR --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex items-center justify-between gap-2 max-w-4xl mx-auto">
           <div className="flex items-center gap-2 bg-gray-50 p-2 px-3 rounded-xl flex-grow max-w-[220px] transition-all focus-within:ring-2 focus-within:ring-[#ff0000]/10 border border-gray-100">
              <Calendar size={14} className="text-[#ff0000]" />
              <div className="flex flex-col">
                 <span className="text-[6px] font-black text-gray-400 uppercase tracking-widest leading-none mb-0.5">Filter Date</span>
                 <input 
                   type="date" 
                   value={filterDate}
                   onChange={(e) => {
                     setFilterDate(e.target.value);
                     setShowAll(false); // Switch to specific date mode
                   }}
                   className="bg-transparent border-none text-[10px] font-black uppercase outline-none p-0 text-gray-700 w-full cursor-pointer"
                 />
              </div>
           </div>
           <div className="flex gap-2 items-center">
              <div className="hidden sm:flex flex-col items-end mr-2">
                 <p className="text-[7px] font-black text-gray-300 uppercase tracking-widest leading-none italic">Results Found</p>
                 <p className="text-[14px] font-black font-condensed italic text-[#ff0000] leading-none">{resultCount}</p>
              </div>
              <button 
               onClick={() => setShowAll(!showAll)}
               className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showAll ? 'bg-gray-900 text-white shadow-lg shadow-gray-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
              >
                 {showAll ? 'SHOW ALL' : 'HISTORY'}
              </button>
              <button 
                onClick={refreshTickets} 
                disabled={loading}
                className="p-2 bg-gray-900 text-white rounded-xl active:scale-95 transition-all disabled:opacity-30"
              >
                 <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
           </div>
        </div>

        {transactionGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
             <div className="relative">
                <Receipt size={64} className="text-gray-100" />
                <Search size={24} className="absolute -bottom-2 -right-2 text-gray-200" />
             </div>
             <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 italic">No matches for {showAll ? 'all history' : filterDate}</p>
                <button onClick={() => setShowAll(true)} className="text-[8px] font-black text-[#ff0000] uppercase tracking-widest underline decoration-2 underline-offset-4">View All Records</button>
             </div>
          </div>
        ) : (
          <div className="space-y-12 max-w-4xl mx-auto">
             {/* Small mobile counter */}
             <div className="sm:hidden px-4 flex justify-between items-center opacity-50">
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Filtering: {showAll ? 'Full History' : filterDate}</p>
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Records: {resultCount}</p>
             </div>
            {transactionGroups.map((group) => (
               <div key={group.id} className="bg-white rounded-3xl shadow-2xl border-2 border-[#ff0000] overflow-hidden">
                  
                  {/* --- TRANSACTION PARENT HEADER --- */}
                  <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                     <div>
                        <p className="text-[8px] font-black text-[#ff0000] uppercase tracking-[0.3em] italic">Transaction Instance</p>
                        <h4 className="text-[12px] font-black font-condensed italic text-gray-900">ID: {group.id}</h4>
                     </div>
                     <div className="text-right">
                        <p className="text-[11px] font-black font-condensed text-gray-950 italic">{group.date} | {group.time}</p>
                     </div>
                  </div>

                  {/* --- DRAW SLOT GROUPS --- */}
                  {Object.values(group.drawSlots).map((slotGroup, sIdx) => (
                     <div key={sIdx} className="border-b-2 border-red-50 last:border-b-0">
                        
                        {/* --- SLOT HEADER: COMPACT --- */}
                        <div className="bg-white p-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-gray-100">
                           <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center text-white shadow-md">
                                 <Clock size={16} className="text-amber-400" />
                              </div>
                              <div>
                                 <h3 className="text-sm font-black font-condensed italic uppercase text-gray-950 leading-none">
                                    {getBrandBySlot(slotGroup.slot)} LOTTERY <span className="mx-1 text-gray-300">|</span> {slotGroup.slot}
                                 </h3>
                                 <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[7px] font-black uppercase tracking-widest text-[#ff0000] animate-pulse italic">Result Declared</span>
                                    <div className="w-0.5 h-0.5 bg-gray-300 rounded-full"></div>
                                    <span className="text-[7px] font-bold text-gray-300 uppercase tracking-widest italic">Archived</span>
                                 </div>
                              </div>
                           </div>
                           
                           {/* --- MINI DECLARED RESULT --- */}
                           <div className="flex items-center gap-3">
                              <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest italic">Result:</p>
                              <div className="flex gap-1">
                                 {slotGroup.declaredNum.split('').map((n, ni) => (
                                    <div key={ni} className="w-7 h-9 bg-white border-2 border-[#ff0000] rounded-lg flex items-center justify-center text-gray-950 font-black text-sm font-condensed italic">
                                       {n}
                                    </div>
                                 ))}
                                 {slotGroup.declaredNum === '-' && <span className="text-[8px] font-black text-gray-300 italic">PENDING</span>}
                              </div>
                           </div>
                        </div>

                        {/* --- TICKET SPECIFIC TABLE: ULTRA COMPACT --- */}
                        <div className="overflow-x-auto scrollbar-hide">
                           <table className="w-full text-center border-collapse table-fixed min-w-[320px]">
                              <thead>
                                 <tr className="bg-gray-50/30 border-y-2 border-[#ff0000]">
                                    <th className="w-[10%] py-1.5 border-r-2 border-[#ff0000] text-[7px] font-black uppercase text-gray-950 font-condensed italic">TYP</th>
                                    <th className="w-[14%] py-1.5 border-r-2 border-[#ff0000] text-[7px] font-black uppercase text-gray-950 font-condensed italic">BRD</th>
                                    <th className="w-[30%] py-1.5 border-r-2 border-[#ff0000] text-[7px] font-black uppercase text-gray-950 font-condensed italic">NUMBER</th>
                                    <th className="w-[8%] py-1.5 border-r-2 border-[#ff0000] text-[7px] font-black uppercase text-gray-950 font-condensed italic">Q</th>
                                    <th className="w-[15%] py-1.5 border-r-2 border-[#ff0000] text-[7px] font-black uppercase text-gray-950 font-condensed italic">TIER</th>
                                    <th className="w-[23%] py-1.5 text-[7px] font-black uppercase text-gray-950 font-condensed italic">PRIZE</th>
                                 </tr>
                              </thead>
                              <tbody>
                                 {slotGroup.tickets.map((t, tIdx) => {
                                    const isWin = t.status === 'Won';
                                    return (
                                       <tr key={tIdx} className={`group ${isWin ? 'bg-emerald-50/20' : ''}`}>
                                          <td className="py-1.5 px-0 border-r-2 border-b-2 border-[#ff0000] text-[8px] font-black text-gray-950 uppercase italic tracking-tighter leading-none text-center">
                                             {t.type}
                                          </td>
                                          <td className="py-1.5 px-0 border-r-2 border-b-2 border-[#ff0000] text-[11px] font-black font-condensed italic text-gray-950 leading-none text-center">
                                             {t.pos}
                                          </td>
                                          <td className="py-1.5 px-0 border-r-2 border-b-2 border-[#ff0000] text-base font-black font-condensed italic text-gray-950 tracking-normal leading-none text-center">
                                             {t.num}
                                          </td>
                                          <td className="py-1.5 px-0 border-r-2 border-b-2 border-[#ff0000] text-[11px] font-black font-condensed italic text-[#ff0000] leading-none text-center">
                                             {t.qty}
                                          </td>
                                          <td className="py-1.5 px-0 border-r-2 border-b-2 border-[#ff0000] text-[7px] font-bold text-gray-500 italic leading-none text-center">
                                             {t.price}
                                          </td>
                                          <td className="py-1.5 px-0.5 border-b-2 border-[#ff0000] text-right align-middle">
                                             <div className="flex flex-col items-end justify-center leading-none">
                                                {isWin ? (
                                                   <p className="text-[11px] font-black text-emerald-600 font-condensed italic">₹{String(t.prize || "0").replace(/[^\d]/g, '')}</p>
                                                ) : (
                                                   <span className="text-[6px] font-black text-gray-100 uppercase tracking-widest italic">{t.status || 'Active'}</span>
                                                )}
                                             </div>
                                          </td>
                                       </tr>
                                    );
                                 })}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  ))}

                  {/* --- COMPACT TRANSACTION FOOTER --- */}
                  <div className="bg-gray-950 p-4 text-white border-t-4 border-[#ff0000]">
                     <div className="flex justify-between items-end">
                        <div className="text-left">
                           <div className="flex items-center gap-2 mb-2 opacity-30">
                              <ShieldCheck size={10} className="text-amber-400" />
                              <p className="text-[6px] font-black uppercase tracking-[0.2em] italic">Verified Result Ledger</p>
                           </div>
                           <p className="text-[8px] font-black uppercase text-gray-400 tracking-[0.2em] italic leading-none mb-1">Total Purchase</p>
                           <p className="text-xl font-black font-condensed italic text-white tracking-tighter leading-none">
                              ₹ {group.totalPurchase.toLocaleString()}
                           </p>
                        </div>
                        <div className="text-right">
                           <p className="text-[8px] font-black uppercase text-amber-400 tracking-[0.2em] italic leading-none mb-1">Total Winnings</p>
                           <p className="text-2xl font-black font-condensed italic text-amber-400 tracking-tighter leading-none">
                              ₹ {group.totalWin.toLocaleString()}
                           </p>
                        </div>
                     </div>
                  </div>
                </div>
             ))}
           </div>
         )}

        {/* --- GLOBAL PRINT/SAVE --- */}
        <div className="flex justify-center gap-6 py-10 opacity-30 hover:opacity-100 transition-opacity">
           <button className="flex flex-col items-center gap-2 active:scale-95 transition-all">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-950 shadow-xl border border-gray-100"><Printer size={20} /></div>
              <span className="text-[8px] font-black uppercase tracking-widest">Print Result</span>
           </button>
           <button className="flex flex-col items-center gap-2 active:scale-95 transition-all">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-950 shadow-xl border border-gray-100"><Download size={20} /></div>
              <span className="text-[8px] font-black uppercase tracking-widest">Save Ledger</span>
           </button>
        </div>

        <SupportSection />

        {/* --- NAVIGATION --- */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
           <button 
            onClick={() => navigate('/home')}
            className="bg-[#ff0000] text-white px-10 py-4 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-red-500/40 active:scale-95 transition-all flex items-center gap-3 border-4 border-white/20"
           >
              <Zap size={16} /> NEW DRAW SESSION
           </button>
        </div>
      </div>
    </PageWrapper>
  );
};

export default MyTickets;
