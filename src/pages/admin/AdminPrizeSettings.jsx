import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Edit3, Settings2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const SettingRow = ({ label, desc, children }) => (
  <div className="flex flex-col justify-between items-start py-6 gap-4 first:pt-4 last:pb-4 border-b border-gray-50 last:border-none group">
    <div className="space-y-1">
       <h4 className="text-base font-black text-gray-800 tracking-tight uppercase italic group-hover:text-[#f42464] transition-colors">{label}</h4>
       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed italic">{desc}</p>
    </div>
    <div className="w-full shrink-0">
       {children}
    </div>
  </div>
);

const InputField = ({ label, value, onChange }) => (
  <div className="flex flex-col h-full justify-end">
    <label className="text-[10px] font-black uppercase tracking-wider text-gray-600 mb-2 leading-tight text-center">{label}</label>
    <input
      type="text"
      inputMode="decimal"
      pattern="[0-9]*"
      value={value || ''}
      onChange={(e) => {
        // Allow only numbers and decimals
        const val = e.target.value.replace(/[^0-9.]/g, '');
        onChange(val);
      }}
      className="w-full min-w-0 bg-gray-50 border border-gray-200 rounded-xl px-2 py-2.5 font-black text-gray-900 text-sm outline-none focus:bg-white focus:border-[#ff004d] transition-all shadow-inner text-center"
    />
  </div>
);

const AdminPrizeSettings = () => {
  const { prizeScheme, updateScheme } = useCart();
  const [localScheme, setLocalScheme] = useState(null);
  const [activeBrand, setActiveBrand] = useState('DEAR'); // DEAR or KERALA
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (prizeScheme && prizeScheme.v2) {
      setLocalScheme(JSON.parse(JSON.stringify(prizeScheme))); // deep copy
    }
  }, [prizeScheme]);

  if (!localScheme) return <div className="p-8 text-center text-gray-400 font-black uppercase tracking-widest text-[10px] animate-pulse">Initializing Configuration...</div>;

  const currentBrandConfig = localScheme[activeBrand];

  const handle1D2DChange = (type, field, value) => {
    setLocalScheme(prev => ({
      ...prev,
      [activeBrand]: {
        ...prev[activeBrand],
        [type]: {
          ...prev[activeBrand][type],
          [field]: value
        }
      }
    }));
  };

  const handleTierChange = (type, tierId, field, value) => {
    setLocalScheme(prev => {
      const updatedTiers = prev[activeBrand][type].map(tier => 
        tier.id === tierId ? { ...tier, [field]: value } : tier
      );
      return {
        ...prev,
        [activeBrand]: {
          ...prev[activeBrand],
          [type]: updatedTiers
        }
      };
    });
  };

  const handleAddTier = (type) => {
    const newId = `tier_${Date.now()}`;
    const newTier = type === '3D' 
      ? { id: newId, price: '0', ABC: '0', BC: '0', C: '0', active: true }
      : { id: newId, price: '0', XABC: '0', ABC: '0', BC: '0', C: '0', active: true };

    setLocalScheme(prev => ({
      ...prev,
      [activeBrand]: {
        ...prev[activeBrand],
        [type]: [...prev[activeBrand][type], newTier]
      }
    }));
  };

  const handleRemoveTier = (type, tierId) => {
    if (!window.confirm('Are you sure you want to remove this tier entirely?')) return;
    setLocalScheme(prev => ({
      ...prev,
      [activeBrand]: {
        ...prev[activeBrand],
        [type]: prev[activeBrand][type].filter(t => t.id !== tierId)
      }
    }));
  };

  const handleToggleTier = (type, tierId) => {
    setLocalScheme(prev => {
      const updatedTiers = prev[activeBrand][type].map(tier => 
        tier.id === tierId ? { ...tier, active: !tier.active } : tier
      );
      return {
        ...prev,
        [activeBrand]: {
          ...prev[activeBrand],
          [type]: updatedTiers
        }
      };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateScheme(localScheme);
      alert("Prize scheme updated successfully!");
    } catch (e) {
      alert("Failed to update prize scheme.");
    }
    setIsSaving(false);
  };



  return (
    <div className="space-y-6">
      {/* Brand Toggle */}
      <div className="flex bg-gray-100 p-1.5 rounded-2xl shadow-inner border border-gray-200 mb-8 w-full max-w-sm mx-auto">
        <button 
          onClick={() => setActiveBrand('DEAR')}
          className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${activeBrand === 'DEAR' ? 'bg-[#ff004d] text-white shadow-lg shadow-red-500/20' : 'text-gray-500 hover:text-gray-900'}`}
        >
          Dear Lottery
        </button>
        <button 
          onClick={() => setActiveBrand('KERALA')}
          className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${activeBrand === 'KERALA' ? 'bg-[#00d084] text-white shadow-lg shadow-emerald-500/20' : 'text-gray-500 hover:text-gray-900'}`}
        >
          Kerala Lottery
        </button>
      </div>

      <div className="flex justify-between items-end border-b border-gray-100 pb-4">
         <div>
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-gray-900 leading-none">
              <span className={activeBrand === 'DEAR' ? 'text-[#ff004d]' : 'text-[#00d084]'}>{activeBrand}</span> Configurations
            </h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">Manage ticket prices & payouts</p>
         </div>
      </div>

      {/* 1D CONFIG */}
      <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 shadow-sm">
         <h4 className="text-lg font-black italic tracking-tighter mb-4 flex items-center gap-2"><Edit3 size={18} className="text-gray-400" /> 1D Lottery Base Configuration</h4>
         <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
            <InputField label="Ticket Price (₹)" value={currentBrandConfig['1D'].price} onChange={(v) => handle1D2DChange('1D', 'price', v)} />
            <InputField label="'A' Board Payout" value={currentBrandConfig['1D'].A} onChange={(v) => handle1D2DChange('1D', 'A', v)} />
            <InputField label="'B' Board Payout" value={currentBrandConfig['1D'].B} onChange={(v) => handle1D2DChange('1D', 'B', v)} />
            <InputField label="'C' Board Payout" value={currentBrandConfig['1D'].C} onChange={(v) => handle1D2DChange('1D', 'C', v)} />
         </div>
      </div>

      {/* 2D CONFIG */}
      <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 shadow-sm">
         <h4 className="text-lg font-black italic tracking-tighter mb-4 flex items-center gap-2"><Edit3 size={18} className="text-gray-400" /> 2D Lottery Base Configuration</h4>
         <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
            <InputField label="Ticket Price (₹)" value={currentBrandConfig['2D'].price} onChange={(v) => handle1D2DChange('2D', 'price', v)} />
            <InputField label="'AB' Match Payout" value={currentBrandConfig['2D'].AB} onChange={(v) => handle1D2DChange('2D', 'AB', v)} />
            <InputField label="'BC' Match Payout" value={currentBrandConfig['2D'].BC} onChange={(v) => handle1D2DChange('2D', 'BC', v)} />
            <InputField label="'AC' Match Payout" value={currentBrandConfig['2D'].AC} onChange={(v) => handle1D2DChange('2D', 'AC', v)} />
         </div>
      </div>

      {/* 3D CONFIG */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-md">
         <div className="flex justify-between items-center mb-6">
            <h4 className="text-lg font-black italic tracking-tighter flex items-center gap-2"><Settings2 size={18} className="text-[#ff004d]" /> 3D Lottery Tiers</h4>
            <button onClick={() => handleAddTier('3D')} className="bg-gray-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-all shadow-lg hover:bg-[#ff004d]">
               <Plus size={14} /> Add Tier
            </button>
         </div>
         
         <div className="space-y-4">
            {currentBrandConfig['3D'].map((tier, idx) => (
              <div key={tier.id} className={`p-5 rounded-2xl border transition-all ${tier.active ? 'bg-gray-50 border-gray-200' : 'bg-gray-100 border-gray-200 opacity-60'}`}>
                 <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                       <span className="bg-black text-white w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-black">{idx + 1}</span>
                       <span className="text-sm font-black italic tracking-tight uppercase">3D Tier Config</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <button onClick={() => handleToggleTier('3D', tier.id)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${tier.active ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-200 text-gray-500 border-gray-300'}`}>
                          {tier.active ? 'Active' : 'Disabled'}
                       </button>
                       <button onClick={() => handleRemoveTier('3D', tier.id)} className="p-1.5 bg-red-50 text-red-500 border border-red-100 rounded-lg hover:bg-red-500 hover:text-white transition-colors">
                          <Trash2 size={14} />
                       </button>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
                    <InputField label="Ticket Price (₹)" value={tier.price} onChange={(v) => handleTierChange('3D', tier.id, 'price', v)} />
                    <InputField label="1st Prize (ABC)" value={tier.ABC} onChange={(v) => handleTierChange('3D', tier.id, 'ABC', v)} />
                    <InputField label="2nd Prize (BC)" value={tier.BC} onChange={(v) => handleTierChange('3D', tier.id, 'BC', v)} />
                    <InputField label="3rd Prize (C)" value={tier.C} onChange={(v) => handleTierChange('3D', tier.id, 'C', v)} />
                 </div>
              </div>
            ))}
            {currentBrandConfig['3D'].length === 0 && (
               <p className="text-center text-gray-400 text-[10px] font-black uppercase py-4 italic">No 3D Tiers found.</p>
            )}
         </div>
      </div>

      {/* 4D CONFIG */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-md">
         <div className="flex justify-between items-center mb-6">
            <h4 className="text-lg font-black italic tracking-tighter flex items-center gap-2"><Settings2 size={18} className="text-[#ff004d]" /> 4D Lottery Tiers</h4>
            <button onClick={() => handleAddTier('4D')} className="bg-gray-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-all shadow-lg hover:bg-[#ff004d]">
               <Plus size={14} /> Add Tier
            </button>
         </div>
         
         <div className="space-y-4">
            {currentBrandConfig['4D'].map((tier, idx) => (
              <div key={tier.id} className={`p-5 rounded-2xl border transition-all ${tier.active ? 'bg-gray-50 border-gray-200' : 'bg-gray-100 border-gray-200 opacity-60'}`}>
                 <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                       <span className="bg-black text-white w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-black">{idx + 1}</span>
                       <span className="text-sm font-black italic tracking-tight uppercase">4D Tier Config</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <button onClick={() => handleToggleTier('4D', tier.id)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${tier.active ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-200 text-gray-500 border-gray-300'}`}>
                          {tier.active ? 'Active' : 'Disabled'}
                       </button>
                       <button onClick={() => handleRemoveTier('4D', tier.id)} className="p-1.5 bg-red-50 text-red-500 border border-red-100 rounded-lg hover:bg-red-500 hover:text-white transition-colors">
                          <Trash2 size={14} />
                       </button>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mt-4">
                    <InputField label="Ticket Price (₹)" value={tier.price} onChange={(v) => handleTierChange('4D', tier.id, 'price', v)} />
                    <InputField label="1st (XABC)" value={tier.XABC} onChange={(v) => handleTierChange('4D', tier.id, 'XABC', v)} />
                    <InputField label="2nd (ABC)" value={tier.ABC} onChange={(v) => handleTierChange('4D', tier.id, 'ABC', v)} />
                    <InputField label="3rd (BC)" value={tier.BC} onChange={(v) => handleTierChange('4D', tier.id, 'BC', v)} />
                    <InputField label="4th (C)" value={tier.C} onChange={(v) => handleTierChange('4D', tier.id, 'C', v)} />
                 </div>
              </div>
            ))}
            {currentBrandConfig['4D'].length === 0 && (
               <p className="text-center text-gray-400 text-[10px] font-black uppercase py-4 italic">No 4D Tiers found.</p>
            )}
         </div>
      </div>

      {/* Save Action */}
      <div className="mt-8 bg-gray-900 p-6 rounded-3xl border border-gray-800 shadow-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
         <div className="text-center sm:text-left">
            <p className="text-sm font-black text-[#ff004d] uppercase tracking-tight">Warning</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Changes apply instantly to live tickets</p>
         </div>
         <button 
           onClick={handleSave}
           disabled={isSaving}
           className="w-full sm:w-auto bg-[#ff004d] text-white px-10 py-4 rounded-2xl text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-[0_10px_20px_-5px_rgba(255,0,77,0.4)] disabled:opacity-50"
         >
           {isSaving ? 'Synchronizing...' : 'Save All Configurations'} <Save size={18} />
         </button>
      </div>

    </div>
  );
};

export default AdminPrizeSettings;
