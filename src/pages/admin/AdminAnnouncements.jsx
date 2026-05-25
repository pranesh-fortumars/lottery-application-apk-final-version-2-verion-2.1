import React, { useState, useEffect, useMemo } from 'react';
import { 
  Megaphone, 
  Trash2, 
  Edit3, 
  Trophy, 
  Clock, 
  Ticket,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Eye,
  ShieldCheck,
  Zap,
  LayoutGrid,
  ListFilter,
  Plus,
  Layers,
  Search,
  Activity,
  Calendar,
  DollarSign,
  Gamepad2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Filter,
  History,
  Layout,
  Lock,
  BarChart3,
  PieChart,
  Shapes,
  Maximize2,
  List,
  Target,
  Hash,
  Save
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { MARKET_GROUPS, getBrandBySlot, isSlotClosed } from '../../constants/lotteryConfig';

const AdminAnnouncements = () => {
  const { purchasedTickets, addResult, declaredResults, prizeScheme, updateScheme, appSettings } = useCart();
  const [activeTab, setActiveTab] = useState('dispatch'); 
  
  // Workflow Navigation State
  const [workflowStep, setWorkflowStep] = useState('root'); 
  const [marketSelection, setMarketSelection] = useState(null); 
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Scheme Editing State
  const [localScheme, setLocalScheme] = useState(null);

  // Sync localScheme with global prizeScheme
  useEffect(() => {
    if (prizeScheme && !localScheme) {
      setLocalScheme(JSON.parse(JSON.stringify(prizeScheme)));
    }
  }, [prizeScheme]);

  // Monitor Detail State
  const [showDetailSlot, setShowDetailSlot] = useState(null);
  const [monitorType, setMonitorType] = useState('1D');
  const [monitorBoard, setMonitorBoard] = useState('A');
  const [monitorSearch, setMonitorSearch] = useState('');
  const [monitorTier, setMonitorTier] = useState('ALL');
  const [monitorDate, setMonitorDate] = useState(new Date().toISOString().split('T')[0]);

  const boardOptions = {
    '1D': ['A', 'B', 'C'],
    '2D': ['AB', 'BC', 'AC'],
    '3D': ['ABC'],
    '4D': ['XABC']
  };

  const tierOptions = {
    '3D': ['12', '28', '30', '55', '60'],
    '4D': ['20', '50', '100']
  };

  useEffect(() => {
    if (boardOptions[monitorType]) {
      setMonitorBoard(boardOptions[monitorType][0]);
    }
    setMonitorTier('ALL');
  }, [monitorType]);

  // Result History Date Filter
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().split('T')[0]);

  // 4-Column Result Entry
  const [resultDigits, setResultDigits] = useState({ X: '', A: '', B: '', C: '' });

  const drawAssignments = MARKET_GROUPS;

  const isDrawFinished = (timeStr, targetDate) => {
    if (!timeStr) return false;
    const nowStr = new Date().toISOString().split('T')[0];
    if (targetDate < nowStr) return true;
    if (targetDate > nowStr) return false;
    
    const brand = getBrandBySlot(timeStr);
    return isSlotClosed(timeStr, brand, appSettings);
  };

  // --- 🛰️ DYNAMIC COMBINATION ENGINE (Lively Sync) ---
  const dynamicAnalyticFeed = useMemo(() => {
    const feed = {};
    const slots = Object.values(drawAssignments).flat();
    
    slots.forEach(s => {
      // Filter by Draw Time, Monitor Date, AND Selected Price Tier (for 3D/4D)
      const tickets = purchasedTickets.filter(t => {
        const dateMatch = t.purchaseDate === monitorDate;
        const drawMatch = t.draw === s;
        const tierMatch = monitorTier === 'ALL' || String(Math.floor(Number(t.price || 0))) === monitorTier;
        return dateMatch && drawMatch && tierMatch;
      });
      
      const combinationTable = {
        '1D': { A: 0, B: 0, C: 0 },
        '2D': { AB: 0, BC: 0, AC: 0 },
        '3D': { ABC: 0 },
        '4D': { XABC: 0 }
      };

      tickets.forEach(t => {
         if (t.type === '1D' && combinationTable['1D']) combinationTable['1D'][t.pos] += t.qty;
         else if (t.type === '2D' && combinationTable['2D']) combinationTable['2D'][t.pos] += t.qty;
         else if (t.type === '3D') combinationTable['3D'].ABC += t.qty;
         else if (t.type === '4D') combinationTable['4D'].XABC += t.qty;
      });

      // Frequency Map for specific numbers - Categorized by Type and Board
      const dataStore = {
        '1D': { A: {}, B: {}, C: {} },
        '2D': { AB: {}, BC: {}, AC: {} },
        '3D': { ABC: {} },
        '4D': { XABC: {} }
      };

      tickets.forEach(t => {
        if (dataStore[t.type] && dataStore[t.type][t.pos]) {
          const count = dataStore[t.type][t.pos][t.num] || 0;
          dataStore[t.type][t.pos][t.num] = count + t.qty;
        }
      });

      const breakdown = {
        combinationTable,
        dataStore,
        totalQty: tickets.reduce((sum, t) => sum + t.qty, 0),
        totalValue: tickets.reduce((sum, t) => sum + (t.qty * t.price), 0),
        ready: isDrawFinished(s, monitorDate)
      };
      feed[s] = breakdown;
    });
    return feed;
  }, [purchasedTickets, monitorDate, monitorTier]);

  const filteredHistory = useMemo(() => {
    // Both historyDate and res.date are in YYYY-MM-DD format
    return declaredResults.filter(r => r.date === historyDate);
  }, [declaredResults, historyDate]);

  const handleDigitChange = (col, val) => { if (val.length <= 1) setResultDigits({ ...resultDigits, [col]: val }); };

  const handleDeclareResult = () => {
    const { X, A, B, C } = resultDigits;
    
    if (X === '' || A === '' || B === '' || C === '') return alert("Please enter all result digits.");
    if (!prizeScheme) return alert("Prize scheme not loaded. Please wait.");

    const existingResult = declaredResults.find(r => 
      r.draw === selectedSlot && 
      r.date === dispatchDate && 
      r.brand === getBrandBySlot(selectedSlot)
    );

    if (existingResult) {
      alert(`The winner for ${selectedSlot} on ${dispatchDate} is already fixed to ${existingResult.number} and cannot be changed.`);
      return;
    }

    addResult({ 
      draw: selectedSlot, 
      date: dispatchDate, // Use explicitly selected dispatch date
      brand: getBrandBySlot(selectedSlot), 
      digits: resultDigits, 
      prizes: prizeScheme 
    });
    
    alert(`RESULT ANNOUNCED FOR ${dispatchDate}: ${X}${A}${B}${C}`);
    setWorkflowStep('root');
    setResultDigits({ X: '', A: '', B: '', C: '' });
  };

  const handleSaveScheme = async () => {
    const success = await updateScheme(localScheme);
    if (success) {
      alert("Prize scheme updated successfully!");
      setWorkflowStep('root');
    } else {
      alert("Failed to update scheme.");
    }
  };

  const exportToPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      
      const doc = new jsPDF();
      const reportDate = new Date(historyDate).toLocaleDateString();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(255, 0, 77); // #ff004d
      doc.text('LOTTERY OFFICIAL REPORT', 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
      doc.text(`Result Date: ${reportDate}`, 14, 35);
      
      // Horizontal Line
      doc.setDrawColor(255, 0, 77);
      doc.setLineWidth(0.5);
      doc.line(14, 40, 196, 40);

      const tableData = filteredHistory.map(res => [
        res.draw,
        `${getBrandBySlot(res.draw)} LOTTERY`,
        res.number
      ]);

      autoTable(doc, {
        startY: 50,
        head: [['TIME SLOT', 'MARKET / BRAND', 'WINNING NUMBER']],
        body: tableData,
        headStyles: { fillColor: [255, 0, 77], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        styles: { fontSize: 10, cellPadding: 5 },
        margin: { top: 50 }
      });

      doc.save(`Lottery_Report_${historyDate}.pdf`);
    } catch (error) {
      console.error("PDF Export Error:", error);
      alert("Error generating PDF. Please ensure all libraries are loaded.");
    }
  };

  // Generate range for the grid
  const getNumberRange = () => {
    let max = 9;
    if (monitorType === '2D') max = 99;
    if (monitorType === '3D') max = 999;
    if (monitorType === '4D') max = 9999;
    
    const digits = monitorType === '1D' ? 1 : monitorType === '2D' ? 2 : monitorType === '3D' ? 3 : 4;
    const range = [];
    for (let i = 0; i <= max; i++) {
      const numStr = i.toString().padStart(digits, '0');
      if (monitorSearch && !numStr.includes(monitorSearch)) continue;
      range.push(numStr);
    }
    return range;
  };

  return (
    <div className="space-y-8 p-4 pb-24 h-full bg-[#f8fbff] overflow-y-auto scrollbar-hide">
      
      {/* Navigation */}
      <div className="flex bg-white rounded-2xl p-2 shadow-sm border border-gray-100 sticky top-0 z-[100]">
        {[
          { id: 'dispatch', label: 'Dispatch', icon: Zap },
          { id: 'analysis', label: 'Monitor', icon: TrendingUp },
          { id: 'history', label: 'History', icon: History }
        ].map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setShowDetailSlot(null); }} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-[#ff0000] text-white shadow-lg shadow-red-500/20' : 'text-gray-400 hover:bg-gray-50'}`}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dispatch' && (
        <div className="space-y-6">
          {workflowStep === 'root' && (
            <div className="grid grid-cols-2 gap-4 animate-in zoom-in-95 h-[300px]">
               <button onClick={() => setWorkflowStep('market')} className="bg-white rounded-[2.5rem] shadow-2xl border-2 border-transparent hover:border-[#ff0000] flex flex-col items-center justify-center space-y-4 group">
                  <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-[#ff0000] group-hover:scale-110 shadow-lg shadow-red-500/10"><Trophy size={32} /></div>
                  <p className="text-xl font-black font-condensed tracking-tighter uppercase italic">Result</p>
               </button>
               <button onClick={() => setWorkflowStep('scheme')} className="bg-white rounded-[2.5rem] shadow-2xl border-2 border-transparent hover:border-blue-500 flex flex-col items-center justify-center space-y-4 group">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 shadow-lg shadow-blue-500/10"><Layout size={32} /></div>
                  <p className="text-xl font-black font-condensed tracking-tighter uppercase italic">Scheme</p>
               </button>
            </div>
          )}

          {workflowStep === 'scheme' && localScheme && (
            <div className="animate-in slide-in-from-bottom-6 duration-500 space-y-6">
                <div className="bg-gray-900 rounded-3xl p-6 text-white flex justify-between items-center border-l-[10px] border-blue-500">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-blue-500"><Layout size={24} /></div>
                     <div><p className="text-[9px] font-black uppercase opacity-60 tracking-[.2em]">Global Setting</p><h2 className="text-2xl font-black font-condensed italic">PRIZE SCHEME</h2></div>
                  </div>
                  <button onClick={() => setWorkflowStep('root')} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-gray-500 transition-colors"><Trash2 size={18} /></button>
               </div>

               <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 space-y-8">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-4">
                            <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">1D Board Prizes</p>
                            {['A', 'B', 'C'].map(p => (
                            <div key={p} className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-black text-gray-400 italic">{p} Board</span>
                                <input type="text" inputMode="decimal" pattern="[0-9]*" value={localScheme['1D'][p]} onChange={(e) => setLocalScheme({...localScheme, '1D': {...localScheme['1D'], [p]: e.target.value}})} className="w-20 bg-white border border-gray-200 rounded-lg py-1 px-2 text-xs font-black" />
                            </div>
                            ))}
                        </div>
                        <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-4">
                            <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">2D Board Prizes</p>
                            {['AB', 'BC', 'AC'].map(p => (
                            <div key={p} className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-black text-gray-400 italic">{p} Combo</span>
                                <input type="text" inputMode="decimal" pattern="[0-9]*" value={localScheme['2D'][p]} onChange={(e) => setLocalScheme({...localScheme, '2D': {...localScheme['2D'], [p]: e.target.value}})} className="w-20 bg-white border border-gray-200 rounded-lg py-1 px-2 text-xs font-black" />
                            </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest ml-2 italic">3D Tier Configuration</p>
                        <div className="grid grid-cols-1 gap-3">
                            {Object.keys(localScheme['3D']).map(tier => (
                                <div key={tier} className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between gap-4">
                                    <div className="shrink-0"><span className="text-xs font-black text-blue-600">₹{tier}</span></div>
                                    <div className="flex gap-2 overflow-x-auto pb-1">
                                        {['ABC', 'BC', 'C'].map(pos => (
                                            <div key={pos} className="flex flex-col items-center">
                                                <label className="text-[8px] font-black text-gray-400 uppercase mb-1">{pos}</label>
                                                <input 
                                                    type="text" 
                                                    inputMode="decimal"
                                                    pattern="[0-9]*"
                                                    value={localScheme['3D'][tier][pos]} 
                                                    onChange={(e) => setLocalScheme({
                                                        ...localScheme, 
                                                        '3D': {
                                                            ...localScheme['3D'], 
                                                            [tier]: { ...localScheme['3D'][tier], [pos]: e.target.value }
                                                        }
                                                    })} 
                                                    className="w-16 bg-white border border-gray-200 rounded-lg py-1 px-2 text-[10px] font-black text-center" 
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest ml-2 italic">4D Tier Configuration</p>
                        <div className="grid grid-cols-1 gap-3">
                            {Object.keys(localScheme['4D']).map(tier => (
                                <div key={tier} className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between gap-4">
                                    <div className="shrink-0"><span className="text-xs font-black text-blue-600">₹{tier}</span></div>
                                    <div className="flex gap-2 overflow-x-auto pb-1">
                                        {['XABC', 'ABC', 'BC', 'C'].map(pos => (
                                            <div key={pos} className="flex flex-col items-center">
                                                <label className="text-[8px] font-black text-gray-400 uppercase mb-1">{pos}</label>
                                                <input 
                                                    type="text" 
                                                    inputMode="decimal"
                                                    pattern="[0-9]*"
                                                    value={localScheme['4D'][tier][pos]} 
                                                    onChange={(e) => setLocalScheme({
                                                        ...localScheme, 
                                                        '4D': {
                                                            ...localScheme['4D'], 
                                                            [tier]: { ...localScheme['4D'][tier], [pos]: e.target.value }
                                                        }
                                                    })} 
                                                    className="w-16 bg-white border border-gray-200 rounded-lg py-1 px-2 text-[10px] font-black text-center" 
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button onClick={handleSaveScheme} className="w-full bg-blue-600 text-white py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2">
                        <Save size={18} /> SAVE SCHEME
                    </button>
               </div>
            </div>
          )}

          {workflowStep === 'market' && (
            <div className="animate-in slide-in-from-right-4 space-y-6 bg-white p-8 rounded-[2.5rem] shadow-2xl">
               <div className="flex justify-between items-center pb-6 border-b border-gray-50">
                  <h3 className="text-lg font-black font-condensed uppercase italic">Select Market</h3>
                  <button onClick={() => setWorkflowStep('root')} className="text-[10px] font-black uppercase text-gray-300">Back</button>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  {['DEAR', 'KERALA'].map(m => (
                    <button key={m} onClick={() => { setMarketSelection(m); setWorkflowStep('slot'); }} className="p-8 rounded-[1.5rem] bg-gray-50 border border-gray-100 hover:border-[#ff0000] transition-all text-center">
                       <p className="text-xl font-black font-condensed italic">{m}</p>
                    </button>
                  ))}
               </div>
            </div>
          )}
          {workflowStep === 'slot' && (
            <div className="animate-in slide-in-from-right-4 space-y-6 bg-white p-8 rounded-[2.5rem] shadow-2xl">
               <div className="flex justify-between items-center pb-6 border-b border-gray-50">
                  <div>
                    <h3 className="text-lg font-black font-condensed uppercase italic">{marketSelection} Slots</h3>
                    <p className="text-[8px] font-black uppercase text-gray-400 italic">Declare results for specific dates</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input 
                      type="date" 
                      value={dispatchDate}
                      onChange={(e) => {
                        setDispatchDate(e.target.value);
                        setMonitorDate(e.target.value); // Sync monitor date to see correct stats
                      }}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase outline-none focus:border-red-500"
                    />
                    <button onClick={() => setWorkflowStep('market')} className="text-[10px] font-black uppercase text-gray-300">Back</button>
                  </div>
               </div>
               <div className="grid grid-cols-1 gap-3">
                  {drawAssignments[marketSelection].map(slot => {
                    const stats = dynamicAnalyticFeed[slot];
                    const isAlreadyDeclared = declaredResults.some(r => r.draw === slot && r.date === dispatchDate && r.brand === getBrandBySlot(slot));

                    return (
                      <button key={slot} onClick={() => { 
                          if (isAlreadyDeclared) {
                             alert(`The winner for ${slot} is already fixed and cannot be changed.`);
                          } else {
                             setSelectedSlot(slot); setWorkflowStep('declare'); 
                          }
                      }} className={`p-5 rounded-2xl border flex justify-between items-center ${isAlreadyDeclared ? 'bg-green-50 border-green-500 shadow-sm' : stats?.ready ? 'bg-red-50 border-red-500 shadow-md' : 'bg-gray-50'}`}>
                         <div className="flex items-center gap-3">
                            {isAlreadyDeclared ? <CheckCircle2 size={18} className="text-green-600" /> : (!stats?.ready && <Lock size={14} className="text-gray-400" />)}
                            <p className={`text-lg font-black font-condensed italic ${isAlreadyDeclared ? 'text-green-800' : ''}`}>{slot}</p>
                         </div>
                         <div className="text-right">
                            <p className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${isAlreadyDeclared ? 'bg-green-600 text-white' : stats?.ready ? 'bg-red-500 text-white' : 'bg-gray-300 text-gray-600'}`}>{isAlreadyDeclared ? 'WINNER DECLARED' : stats?.ready ? 'READY TO DECLARE' : 'INTAKE OPEN'}</p>
                            <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase">Tickets: {stats?.totalQty || 0}</p>
                         </div>
                      </button>
                    );
                  })}
               </div>
            </div>
          )}
          {workflowStep === 'declare' && (
            <div className="animate-in slide-in-from-bottom-6 duration-500 space-y-6">
               <div className="bg-gray-900 rounded-3xl p-6 text-white flex justify-between items-center border-l-[10px] border-[#ff0000]">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-red-500"><Zap size={24} /></div>
                     <div><p className="text-[9px] font-black uppercase opacity-60 tracking-[.2em]">{marketSelection}</p><h2 className="text-2xl font-black font-condensed italic">{selectedSlot}</h2></div>
                  </div>
                  <div className="flex flex-col items-end">
                     <p className="text-[7px] font-black uppercase text-red-500 tracking-widest mb-1">Target Draw Date</p>
                     <input 
                        type="date" 
                        value={dispatchDate} 
                        onChange={(e) => setDispatchDate(e.target.value)}
                        className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-xs font-black outline-none focus:border-red-500"
                     />
                  </div>
                  <button onClick={() => setWorkflowStep('slot')} className="ml-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"><Trash2 size={18} /></button>
               </div>
               <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 space-y-8">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
                     <AlertCircle className="text-amber-600" size={20} />
                     <p className="text-[9px] font-black uppercase text-amber-900 tracking-tight italic">Warning: Results will be synced with tickets purchased on {dispatchDate}. Ensure this is correct.</p>
                  </div>
                    <div className="grid grid-cols-4 gap-4">
                        {['X', 'A', 'B', 'C'].map(col => (
                        <div key={col} className="space-y-2 text-center">
                            <label className="text-[9px] font-black uppercase text-gray-400">{col === 'X' ? 'X / D' : col}</label>
                            <input type="text" inputMode="numeric" pattern="[0-9]*" value={resultDigits[col]} onChange={(e) => handleDigitChange(col, e.target.value)} className="w-full h-20 bg-gray-50 border-2 border-gray-100 rounded-2xl text-center text-4xl font-black focus:border-[#ff0000] outline-none" />
                        </div>
                        ))}
                    </div>
                    
                    <div className="p-6 bg-red-50 rounded-2xl border border-red-100 text-center space-y-2">
                        <ShieldCheck size={24} className="mx-auto text-red-600" />
                        <p className="text-[10px] font-black uppercase text-red-800 tracking-widest">Automatic Prize Allocation</p>
                        <p className="text-[9px] font-bold text-gray-400">The current prize scheme will be applied automatically based on the digits entered above.</p>
                    </div>

                    <button onClick={handleDeclareResult} className="w-full bg-[#ff0000] text-white py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-2xl active:scale-95 transition-all">DECLARE RESULT & PAYOUT</button>
               </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
           {!showDetailSlot ? (
             <div className="space-y-8">
                 {/* Compact Intelligence Header */}
                 <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-red-50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-red-50/50 rounded-full blur-3xl -mr-24 -mt-16"></div>
                    <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-6">
                       <div className="flex items-center gap-5 w-full lg:w-auto">
                          <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-500/10 shrink-0"><BarChart3 size={28} /></div>
                          <div>
                             <h3 className="font-black text-2xl font-condensed italic uppercase tracking-tighter leading-none whitespace-nowrap">Market Intel</h3>
                             <div className="flex items-center gap-2 mt-2 bg-emerald-50 px-3 py-1 rounded-lg w-fit">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Live Terminal</span>
                             </div>
                          </div>
                       </div>
                       
                       <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto justify-end">
                          {/* Date Filter Integration */}
                          <div className="flex items-center gap-3 bg-gray-50 p-3 px-5 rounded-2xl border border-gray-100 w-full sm:w-auto shadow-sm">
                             <Calendar size={18} className="text-red-500 shrink-0" />
                             <div className="flex flex-col">
                                <label className="text-[7px] font-black uppercase text-gray-400 tracking-[0.2em] mb-0.5">Filter Date</label>
                                <input 
                                  type="date" 
                                  value={monitorDate} 
                                  onChange={(e) => setMonitorDate(e.target.value)} 
                                  className="bg-transparent border-none font-black text-sm outline-none cursor-pointer text-gray-950 p-0" 
                                />
                             </div>
                          </div>

                          <div className="text-right shrink-0">
                             <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Network Volume</p>
                             <p className="text-2xl font-black font-condensed italic text-gray-950 leading-none">₹ {Object.values(dynamicAnalyticFeed).reduce((sum, d) => sum + (d.totalValue || 0), 0).toLocaleString()}</p>
                          </div>
                       </div>
                    </div>
                 </div>

                {Object.keys(drawAssignments).map(mKey => (
                   <div key={mKey} className="space-y-4">
                      <div className="flex items-center gap-4 px-2">
                         <div className="bg-gray-900 px-4 py-1.5 rounded-full"><span className="text-[9px] font-black text-white uppercase tracking-[0.2em] italic">{mKey} REGION</span></div>
                         <div className="h-px flex-grow bg-gray-100"></div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                         {drawAssignments[mKey].map(slot => {
                            const data = dynamicAnalyticFeed[slot];
                            return (
                               <div key={slot} onClick={() => setShowDetailSlot(slot)} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-lg flex flex-col gap-6 hover:shadow-2xl transition-all cursor-pointer relative overflow-hidden active:scale-[0.99] group">
                                  <div className="absolute -top-10 -right-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity transform group-hover:rotate-12 duration-1000"><Shapes size={180} /></div>
                                  
                                  <div className="flex justify-between items-start relative z-10">
                                     <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300 group-hover:bg-red-600 group-hover:text-white transition-all"><Clock size={24} /></div>
                                        <div>
                                           <div className="flex items-center gap-2">
                                              <p className="text-xl font-black font-condensed italic leading-none">{slot}</p>
                                              {(data?.totalQty || 0) > 0 && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>}
                                           </div>
                                           <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mt-1">ID: #{Math.floor(Math.random() * 9999)}</p>
                                        </div>
                                     </div>
                                     <div className="text-right">
                                        <p className="text-[9px] font-black text-[#ff0000] uppercase italic mb-0.5">COLLECTION</p>
                                        <p className="text-2xl font-black font-condensed italic text-gray-950 leading-none">₹ {data?.totalValue?.toLocaleString() || 0}</p>
                                     </div>
                                  </div>

                                  <div className="grid grid-cols-3 gap-3 relative z-10">
                                     <div className="bg-gray-50/50 p-3.5 rounded-2xl border border-gray-100/50 flex flex-col items-center">
                                        <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Tickets</p>
                                        <span className="text-lg font-black font-condensed italic text-gray-900">{data?.totalQty || 0}</span>
                                     </div>
                                     <div className="bg-gray-50/50 p-3.5 rounded-2xl border border-gray-100/50 flex flex-col items-center">
                                        <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Boards</p>
                                        <span className="text-lg font-black font-condensed italic text-gray-900">Active</span>
                                     </div>
                                     <div className="bg-gray-950 p-3.5 rounded-2xl flex flex-col items-center justify-center group-hover:bg-[#ff0000] transition-colors">
                                        <p className="text-[7px] font-black text-white/30 uppercase tracking-widest mb-0.5">Status</p>
                                        <div className="text-white font-black text-[9px] uppercase tracking-widest">{data?.ready ? 'STAGED' : 'INTAKE'}</div>
                                     </div>
                                  </div>
                               </div>
                            );
                         })}
                      </div>
                   </div>
                ))}
             </div>
           ) : (
             <div className="space-y-6 animate-in slide-in-from-right-4 pb-20">
                {/* Header Section */}
                <div className="bg-gray-900 rounded-[3rem] p-6 sm:p-10 text-white flex flex-col sm:flex-row justify-between items-center shadow-2xl relative overflow-hidden border-b-8 border-red-600 gap-6">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl"></div>
                   <div className="flex items-center gap-6 relative z-10 w-full sm:w-auto">
                      <button onClick={() => setShowDetailSlot(null)} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 border border-white/5 transition-all"><ChevronRight size={24} className="rotate-180" /></button>
                      <div>
                         <p className="text-[9px] font-black uppercase text-red-500 tracking-[.3em] mb-1">Board Monitoring Terminal</p>
                         <h4 className="text-3xl font-black font-condensed italic leading-none">{showDetailSlot}</h4>
                      </div>
                   </div>
                   <div className="text-right relative z-10 w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between">
                      <div className="text-[8px] font-black uppercase opacity-60 italic tracking-widest text-emerald-400 flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full w-fit">
                         <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div> LIVE
                      </div>
                      <p className="text-2xl font-black font-condensed italic tracking-widest text-white mt-2">₹ {dynamicAnalyticFeed[showDetailSlot]?.totalValue?.toLocaleString() || 0}</p>
                   </div>
                </div>

                 {/* Refined Filter Bar */}
                 <div className="bg-white rounded-[2rem] p-4 sm:p-5 shadow-xl border border-gray-100 space-y-4 sticky top-2 z-[90]">
                    {/* Primary Row: Type & Search */}
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                       <div className="flex gap-1.5 p-1 bg-gray-50 rounded-2xl border border-gray-100">
                          {['1D', '2D', '3D', '4D'].map(type => (
                             <button 
                               key={type} 
                               onClick={() => setMonitorType(type)}
                               className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${monitorType === type ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                             >
                                {type}
                             </button>
                          ))}
                       </div>
                       
                       <div className="relative w-full sm:max-w-[240px]">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                          <input 
                            type="text" 
                            placeholder="Search combination..." 
                            value={monitorSearch}
                            onChange={(e) => setMonitorSearch(e.target.value)}
                            className="w-full pl-11 pr-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[11px] font-black outline-none focus:border-red-600 transition-all placeholder:text-gray-300 shadow-sm"
                          />
                       </div>
                    </div>

                    {/* High-Density Row: Boards & Tiers (No Scrolling) */}
                    <div className="flex flex-wrap gap-x-6 gap-y-3 pt-4 border-t border-gray-100 items-center">
                       <div className="flex flex-wrap gap-2 items-center">
                          {boardOptions[monitorType].map(board => (
                             <button 
                               key={board} 
                               onClick={() => setMonitorBoard(board)}
                               className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border-2 whitespace-nowrap ${monitorBoard === board ? 'border-red-600 text-red-600 bg-red-50 shadow-sm' : 'border-gray-100 text-gray-400 hover:border-gray-200 bg-white'}`}
                             >
                                {board} Board
                             </button>
                          ))}
                       </div>

                       {(monitorType === '3D' || monitorType === '4D') && (
                          <div className="flex flex-wrap items-center gap-2 border-l-0 sm:border-l sm:pl-6 border-gray-100">
                             <div className="flex items-center gap-1.5 shrink-0 mr-1">
                                <ListFilter size={12} className="text-gray-300" />
                                <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Tiers:</span>
                             </div>
                             
                             <button 
                               onClick={() => setMonitorTier('ALL')}
                               className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${monitorTier === 'ALL' ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                             >
                                All
                             </button>
                             {tierOptions[monitorType].map(tier => (
                                <button 
                                  key={tier} 
                                  onClick={() => setMonitorTier(tier)}
                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap ${monitorTier === tier ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-400 border border-gray-100 hover:border-gray-300'}`}
                                >
                                   ₹{tier}
                                </button>
                             ))}
                          </div>
                       )}
                    </div>
                 </div>

                 {/* High-Frequency Analytics Table (Support 3D & 4D) */}
                 {(monitorType === '3D' || monitorType === '4D') && (
                   <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-8 animate-in slide-in-from-left duration-700">
                     <div className="p-6 border-b border-gray-200 bg-red-50/30 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-red-500/20"><Zap size={20} /></div>
                           <div>
                              <h5 className="text-[14px] font-black uppercase tracking-widest italic leading-tight">High-Frequency {monitorType} Analytics</h5>
                              <p className="text-[9px] font-black text-red-600/60 uppercase tracking-widest mt-0.5">Top Purchased {monitorType} Combinations for this Slot</p>
                           </div>
                        </div>
                        {monitorTier !== 'ALL' && (
                          <div className="px-4 py-1.5 rounded-full bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest shadow-md animate-pulse">
                            Tier: ₹{monitorTier}
                          </div>
                        )}
                     </div>
                     
                     <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse border-2 border-[#ff0000]">
                           <thead className="bg-gray-100">
                              <tr>
                                 <th className="px-6 py-4 text-[11px] font-black uppercase text-gray-600 tracking-widest border-2 border-[#ff0000] w-24">Rank</th>
                                 <th className="px-6 py-4 text-[11px] font-black uppercase text-gray-600 tracking-widest border-2 border-[#ff0000]"># Combination</th>
                                 <th className="px-6 py-4 text-[11px] font-black uppercase text-gray-600 tracking-widest border-2 border-[#ff0000] w-32">Volume</th>
                              </tr>
                           </thead>
                           <tbody>
                              {(() => {
                                 const boardData = dynamicAnalyticFeed[showDetailSlot]?.dataStore?.[monitorType]?.[monitorBoard] || {};
                                 const sortedCombos = Object.entries(boardData)
                                   .filter(([_, count]) => count > 0)
                                   .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])); // Full descending list with consistent secondary sort

                                 if (sortedCombos.length === 0) {
                                   return (
                                     <tr>
                                       <td colSpan="3" className="px-6 py-12 text-center text-gray-300 italic text-[11px] font-black uppercase tracking-widest border-2 border-[#ff0000]">
                                         No high-frequency data available for this {monitorType} {monitorTier !== 'ALL' ? `Tier (₹${monitorTier})` : ''} slot yet
                                       </td>
                                     </tr>
                                   );
                                 }

                                 return sortedCombos.map(([num, count], index) => {
                                   return (
                                     <tr key={num} className="group hover:bg-red-50/10 transition-all">
                                       <td className="px-6 py-4 border-2 border-[#ff0000]">
                                         <span className="w-8 h-8 rounded-lg bg-gray-950 text-white flex items-center justify-center font-black italic shadow-md">#{index + 1}</span>
                                       </td>
                                       <td className="px-6 py-4 border-2 border-[#ff0000]">
                                         <div className="flex gap-2">
                                           {num.split('').map((d, i) => (
                                             <span key={i} className="w-10 h-10 rounded-xl bg-white border-2 border-gray-100 flex items-center justify-center font-black text-xl italic text-gray-900 shadow-sm group-hover:border-red-600 transition-all">{d}</span>
                                           ))}
                                         </div>
                                       </td>
                                       <td className="px-6 py-4 border-2 border-[#ff0000]">
                                         <div className="flex flex-col">
                                           <span className="text-sm font-black font-condensed italic text-red-600 tabular-nums">{count}</span>
                                           <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Tickets Purchased</span>
                                         </div>
                                       </td>
                                     </tr>
                                   );
                                 });
                              })()}
                           </tbody>
                        </table>
                     </div>
                   </div>
                 )}

                {/* Detailed Monitoring Table */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-12">
                   <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between bg-gray-50/50 gap-4">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center text-white shadow-lg"><BarChart3 size={20} /></div>
                         <div>
                            <h5 className="text-[14px] font-black uppercase tracking-widest italic leading-tight">{monitorType} - {monitorBoard} Inventory</h5>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Real-time Stock Monitor</p>
                         </div>
                      </div>
                      <div className="flex gap-8">
                        <div className="text-right">
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Total</p>
                           <p className="text-lg font-black font-condensed italic text-gray-950 tabular-nums">{getNumberRange().length}</p>
                        </div>
                        <div className="text-right border-l border-gray-200 pl-8">
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Active</p>
                           <p className="text-lg font-black font-condensed italic text-red-600 tabular-nums">{getNumberRange().filter(n => (dynamicAnalyticFeed[showDetailSlot]?.dataStore?.[monitorType]?.[monitorBoard]?.[n] || 0) > 0).length}</p>
                        </div>
                      </div>
                   </div>

                   <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse border-2 border-[#ff0000]">
                         <thead className="bg-gray-100">
                            <tr>
                               <th className="px-6 py-4 text-[11px] font-black uppercase text-gray-600 tracking-widest border-2 border-[#ff0000] w-1/2"># Combination</th>
                               <th className="px-6 py-4 text-[11px] font-black uppercase text-gray-600 tracking-widest text-center border-2 border-[#ff0000] w-1/2">Tickets Sold</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y-2 divide-[#ff0000]">
                            {getNumberRange().map(num => {
                               const boardData = dynamicAnalyticFeed[showDetailSlot]?.dataStore?.[monitorType]?.[monitorBoard];
                               const count = boardData ? (boardData[num] || 0) : 0;
                               const intensity = Math.min((count / 50) * 100, 100); 

                               return (
                                 <tr key={num} className={`group transition-all ${count > 0 ? 'bg-red-50/20' : 'bg-white hover:bg-gray-50'}`}>
                                    <td className="px-6 py-4 border-2 border-[#ff0000]">
                                       <div className="flex items-center gap-4">
                                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg font-condensed italic transition-all ${count > 0 ? 'bg-red-600 text-white shadow-md' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                                             {num}
                                          </div>
                                          {count > 0 && (
                                            <div className="flex flex-col">
                                               <span className="text-[8px] font-black text-red-600 uppercase italic tracking-widest animate-pulse">Live</span>
                                               <span className="text-[7px] font-bold text-gray-400 uppercase">#{Math.floor(Math.random()*9000)+1000}</span>
                                            </div>
                                          )}
                                       </div>
                                    </td>
                                    <td className="px-6 py-4 border-2 border-[#ff0000]">
                                       <div className="flex flex-col items-center">
                                          <div className="flex items-baseline gap-1">
                                             <span className={`text-2xl font-black font-condensed italic tabular-nums leading-none ${count > 0 ? 'text-gray-950' : 'text-gray-400'}`}>
                                                {count}
                                             </span>
                                             {count > 0 && <span className="text-[9px] font-black text-emerald-500 uppercase italic">Units</span>}
                                          </div>
                                          {count > 0 && (
                                            <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden border border-gray-200">
                                               <div className="h-full bg-red-600 rounded-full shadow-[0_0_8px_rgba(220,38,38,0.5)]" style={{ width: `${intensity}%` }}></div>
                                            </div>
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
                <div className="h-20"></div> {/* Bottom Spacing for mobile overflow */}
             </div>
           )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
           {/* Date Filter Implementation - Refined Grid Layout */}
           <div className="bg-white rounded-[2rem] p-4 shadow-xl border border-gray-100 grid grid-cols-1 md:grid-cols-[auto_1fr_auto] items-center gap-4">
              <div className="w-12 h-12 bg-gray-950 rounded-xl flex items-center justify-center text-white shrink-0">
                 <Calendar size={22} />
              </div>
              
              <div className="flex flex-col">
                 <p className="text-[8px] font-black uppercase tracking-[0.3em] text-[#ff0000] mb-0.5 italic">Record Archive</p>
                 <input 
                   type="date" 
                   value={historyDate} 
                   onChange={(e) => setHistoryDate(e.target.value)} 
                   className="bg-transparent font-black text-lg outline-none cursor-pointer text-gray-950 p-0 border-none w-full min-w-[150px]" 
                 />
              </div>
              
              <button 
                onClick={exportToPDF} 
                className="bg-[#ff0000] text-white px-6 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 active:scale-[0.98] transition-all whitespace-nowrap"
              >
                <Download size={16} /> Export Report
              </button>
           </div>

           <div className="space-y-4 pb-20">
              {filteredHistory.length > 0 ? filteredHistory.map((res, i) => (
                <div key={i} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-lg flex items-center justify-between group hover:border-red-200 transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex flex-col items-center justify-center border border-gray-100 shrink-0">
                       <p className="text-[8px] font-black text-gray-400 uppercase leading-none mb-1">Time</p>
                       <p className="text-xs font-black font-condensed italic text-gray-900">{res.draw}</p>
                    </div>
                    <div>
                       <div className="flex items-center gap-2 mb-1">
                          <Trophy size={12} className="text-red-500" />
                          <p className="text-[10px] font-black text-gray-950 uppercase tracking-tighter">{getBrandBySlot(res.draw)} LOTTERY</p>
                       </div>
                       <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Official Record ID: {String(res.id || "").slice(-6)}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {(res.number || "").split('').map((digit, idx) => (
                      <div key={idx} className="w-10 h-10 bg-gray-950 border-b-4 border-red-600 rounded-xl flex items-center justify-center text-white font-black text-xl italic shadow-md">
                        {digit}
                      </div>
                    ))}
                  </div>
                </div>
              )) : (
                <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
                   <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                      <History size={40} />
                   </div>
                   <p className="text-sm font-black text-gray-300 uppercase tracking-[0.2em] italic">No Records found for this date</p>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnnouncements;
