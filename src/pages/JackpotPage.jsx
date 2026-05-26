import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { ScrollText, Gavel, ShoppingCart, Sparkles } from 'lucide-react';
import BettingCard from '../components/BettingCard';
import { useCart } from '../context/CartContext';
import { isSlotClosed } from '../constants/lotteryConfig';

const JackpotPage = () => {
  const navigate = useNavigate();
  const { cart, appSettings, loading: cartLoading, prizeScheme } = useCart();
  const jackpotVisible = appSettings.jackpotVisible;

  React.useEffect(() => {
    if (!cartLoading && !jackpotVisible) {
      navigate('/home', { replace: true });
    }
  }, [jackpotVisible, cartLoading, navigate]);

  if (cartLoading) return null;
  if (!jackpotVisible) return null;
  
  const slots = [
    { time: '10.30 AM' },
    { time: '11.30 AM' },
    { time: '12.30 PM' },
    { time: '01.30 PM' },
    { time: '03.30 PM' },
    { time: '05.30 PM' },
    { time: '06.30 PM' },
    { time: '07.30 PM' },
  ].map(s => ({
    ...s,
    status: isSlotClosed(s.time, 'JACKPOT', appSettings) ? 'closed' : 'active'
  }));

  const firstActiveSlot = slots.find(s => s.status === 'active')?.time || slots[slots.length - 1].time;
  const [activeSlot, setActiveSlot] = useState(firstActiveSlot);

  const currentBrandScheme = prizeScheme?.v2 ? prizeScheme['DEAR'] : null;

  const abcTiers = currentBrandScheme ? currentBrandScheme['3D'].filter(t => t.active).map(t => ({
    price: t.price, win: `₹ ${t.ABC}, ${t.BC}, ${t.C}`
  })) : [
    { price: "12.00", win: "₹ 6250, 250, 25" },
    { price: "28.00", win: "₹ 15000, 500, 50" },
    { price: "30.00", win: "₹ 17500, 500, 50" },
    { price: "55.00", win: "₹ 30000, 1000, 100" },
    { price: "60.00", win: "₹ 35000, 1000, 100" },
  ];

  const d1Price = currentBrandScheme ? currentBrandScheme['1D'].price : "11.00";
  const d1Win = currentBrandScheme ? `Win ₹ ${currentBrandScheme['1D'].A}` : "Win ₹ 100";

  const d2Price = currentBrandScheme ? currentBrandScheme['2D'].price : "11.00";
  const d2Win = currentBrandScheme ? `Win ₹ ${currentBrandScheme['2D'].AB}` : "Win ₹ 1000";

  const jackpotFooter = (
    <button 
      onClick={() => navigate('/cart')}
      className="w-full text-white py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-xl shadow-[0_15px_30px_-5px_rgba(255,0,85,0.4)] relative active:scale-95 transition-all bg-[#ff0055]"
    >
      <ShoppingCart size={24} fill="white" /> PAY NOW
      {cart.length > 0 && (
         <span className="absolute -top-3 -right-3 bg-black text-white w-8 h-8 rounded-full text-[12px] flex items-center justify-center border-[3px] border-white font-black shadow-lg">{cart.length}</span>
      )}
    </button>
  );

  return (
    <PageWrapper 
      title="SMS LOTTERY JACKPOT" 
      showNav={true}
      showBack={true}
      footerAction={jackpotFooter}
    >
      <div className="bg-[#f9f9f9]">
        <div className="bg-[#fce4ec] py-3 px-4 shadow-sm border-b border-white/50 text-center mb-4">
           <p className="text-white bg-[#ff1c74] inline-block px-5 py-2 rounded-full text-[10px] font-black tracking-wide uppercase">
             Jackpot lot purchase open till 5 mins before draw
           </p>
        </div>

        <div className="p-4">
          <div className="flex gap-4 mb-8">
             <button onClick={() => navigate('/rules')} className="flex-1 bg-[#ff004d] text-white py-3 rounded-xl flex items-center justify-center gap-2 font-black shadow-lg uppercase tracking-tight">
                <Gavel size={20} /> Rules
             </button>
             <button onClick={() => navigate('/results')} className="flex-1 bg-[#ff004d] text-white py-3 rounded-xl flex items-center justify-center gap-2 font-black shadow-lg uppercase tracking-tight">
                <ScrollText size={20} /> Results
             </button>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-8">
            {slots.map((slot, idx) => (
              <div 
                key={idx}
                onClick={() => slot.status === 'active' && setActiveSlot(slot.time)}
                className={`border-[2px] rounded-2xl p-2.5 text-center transition-all cursor-pointer h-[70px] flex flex-col justify-center ${
                  slot.status === 'active' 
                    ? (activeSlot === slot.time ? 'border-[#ff004d] bg-[#fff0f5] shadow-lg ring-2 ring-[#ff004d]/10' : 'border-[#ff004d] bg-white shadow-sm hover:shadow-md') 
                    : 'border-gray-200 bg-gray-100 opacity-50 grayscale'
                }`}
              >
                <p className={`text-[12px] font-black leading-none mb-1 ${slot.status === 'active' ? 'text-red-500' : 'text-gray-500'}`}>{slot.time}</p>
                <p className={`text-[8px] font-black uppercase leading-tight ${slot.status === 'active' ? 'text-red-500' : 'text-gray-400'}`}>
                  {slot.status === 'active' ? 'Active' : 'Closed'}
                </p>
              </div>
            ))}
          </div>

          <BettingCard title="Single Digit" winText={d1Win} price={d1Price} digits={1} gameName="Jackpot" drawTime={activeSlot} />
          <BettingCard title="Two Digits" winText={d2Win} price={d2Price} digits={2} gameName="Jackpot" drawTime={activeSlot} />
          <BettingCard 
            title="Three Digits" 
            digits={3} 
            gameName="Jackpot" 
            priceOptions={abcTiers}
            drawTime={activeSlot}
          />
        </div>
      </div>
    </PageWrapper>
  );
};

export default JackpotPage;
