import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { ScrollText, Gavel, ShoppingCart, Lock, Info } from 'lucide-react';
import BettingCard from '../components/BettingCard';
import { useCart } from '../context/CartContext';
import { getSlotById, isSlotClosed } from '../constants/lotteryConfig';

const SelectionPage = () => {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const { cart, appSettings } = useCart();
  
  const slotData = getSlotById(gameId);
  const marketName = slotData?.brand || 'DEAR';
  const isKerala = marketName.toUpperCase() === 'KERALA';
  const earlyClosure = isKerala && appSettings?.keralaSalesClosed;
  
  // If Early Closure is ON, override the display time to 02:00 PM
  const drawTime = earlyClosure ? '02:00 PM' : (slotData?.time || '01:00 PM');
  
  const getGameName = () => `${marketName} LOTTERY`;
  
  const globalLock = appSettings?.globalSalesClosed;
  // Let the time-based cutoff handle kerala early closure dynamically
  const closed = globalLock || isSlotClosed(drawTime, marketName, appSettings);

  const abcTiers = [
    { price: "12.00", win: "₹ 6250, 250, 25" },
    { price: "28.00", win: "₹ 15000, 500, 50" },
    { price: "30.00", win: "₹ 17500, 500, 50" },
    { price: "55.00", win: "₹ 30000, 1000, 100" },
    { price: "60.00", win: "₹ 35000, 1000, 100" },
  ];

  const xabcTiers = [
    { price: "20.00", win: "₹ 100000" },
    { price: "50.00", win: "₹ 250000, 5000, 500, 50" },
    { price: "100.00", win: "₹ 500000, 10000, 1000, 100" },
  ];

  // --- Persistent Footer Action ---
  const footerBtn = (
    <button 
      onClick={() => navigate('/cart')}
      disabled={closed}
      className={`w-full text-white py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-xl shadow-[0_15px_30px_-5px_rgba(255,0,85,0.4)] relative active:scale-95 transition-all ${closed ? 'bg-gray-400' : 'bg-[#ff0055]'}`}
    >
      <ShoppingCart size={24} fill="white" /> {closed ? (globalLock ? 'SALES CLOSED' : 'EXPIRED') : 'PAY NOW'}
      {cart.length > 0 && !closed && (
         <span className="absolute -top-3 -right-3 bg-black text-white w-8 h-8 rounded-full text-[12px] flex items-center justify-center border-[3px] border-white font-black shadow-lg">{cart.length}</span>
      )}
    </button>
  );

  return (
    <PageWrapper 
      title={getGameName()} 
      showNav={true}
      showBack={true}
      footerAction={footerBtn}
    >
      <div className="bg-[#f9f9f9]">
        {/* Draw Status Banner */}
        <div className={`py-4 px-6 flex justify-between items-center shadow-lg border-b border-white/10 ${closed ? 'bg-black' : 'bg-gradient-to-r from-[#ff004d] to-[#ff4d6a]'}`}>
           <div>
              <p className="text-white text-[9px] font-black uppercase tracking-[0.2em] opacity-80">{marketName} DRAW</p>
              <h2 className="text-white text-xl font-black font-condensed italic">{drawTime}</h2>
           </div>
           <div className="text-right">
              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-white shadow-inner ${closed ? (globalLock ? 'text-red-600' : 'text-black') : 'text-[#ff004d]'}`}>
                {closed ? (globalLock ? 'SALES CLOSED' : 'EXPIRED') : 'OPEN'}
              </span>
           </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex gap-3">
             <button onClick={() => navigate('/rules')} className="flex-1 bg-white border-2 border-gray-100 text-gray-900 py-2.5 rounded-xl flex items-center justify-center gap-2 font-black shadow-sm uppercase tracking-tight text-[10px] hover:border-[#ff004d] transition-all">
                <Gavel size={16} className="text-[#ff004d]" /> Rules
             </button>
             <button onClick={() => navigate('/results')} className="flex-1 bg-white border-2 border-gray-100 text-gray-900 py-2.5 rounded-xl flex items-center justify-center gap-2 font-black shadow-sm uppercase tracking-tight text-[10px] hover:border-[#ff004d] transition-all">
                <ScrollText size={16} className="text-[#ff004d]" /> History
             </button>
          </div>

          <div className={`${closed ? 'opacity-40 grayscale pointer-events-none blur-[0.5px]' : ''} space-y-6`}>
            {/* Single Digit Matrix */}
            <BettingCard 
                title="Single Digit" 
                winText="₹ 100" 
                price="11.00" 
                gameName={getGameName()} 
                drawTime={drawTime}
                customRows={[
                { labels: ['A'], digits: 1 },
                { labels: ['B'], digits: 1 },
                { labels: ['C'], digits: 1 }
                ]}
            />

            {/* Double Digit Combinations */}
            <BettingCard 
                title="Double Digits" 
                winText="₹ 1000" 
                price="11.00" 
                gameName={getGameName()} 
                drawTime={drawTime}
                customRows={[
                { labels: ['A', 'B'], digits: 2 },
                { labels: ['A', 'C'], digits: 2 },
                { labels: ['B', 'C'], digits: 2 }
                ]}
            />
            
            {/* Triple Digit - ABC (Split by Tier) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 ml-2">
                 <div className="w-4 h-4 bg-[#ff004d]/10 rounded-md flex items-center justify-center">
                    <img src="https://img.icons8.com/fluency/48/000000/3-dots.png" alt="3D" className="w-2.5 h-2.5" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='block'; }} />
                    <div style={{display: 'none'}} className="w-1 h-1 bg-[#ff004d] rounded-full"></div>
                 </div>
                 <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">3D Pricing Categories</h4>
              </div>
              {abcTiers.map((tier, idx) => (
                <BettingCard 
                  key={`abc-${idx}`}
                  title="Three Digits" 
                  digits={3} 
                  price={tier.price} 
                  winText={`Win ${tier.win}`}
                  gameName={getGameName()} 
                  drawTime={drawTime}
                  singleRow={true}
                />
              ))}
            </div>

            {/* 4D - XABC (Split by Tier) */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 ml-2">
                 <div className="w-4 h-4 bg-black/10 rounded-md flex items-center justify-center">
                    <img src="https://img.icons8.com/fluency/48/000000/number-4.png" alt="4D" className="w-2.5 h-2.5" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='block'; }} />
                    <div style={{display: 'none'}} className="w-1 h-1 bg-black rounded-full"></div>
                 </div>
                 <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">4D Pricing Categories</h4>
              </div>
              {xabcTiers.map((tier, idx) => (
                <BettingCard 
                  key={`xabc-${idx}`}
                  title="4D XABC" 
                  digits={4} 
                  price={tier.price} 
                  winText={`Win ${tier.win}`}
                  gameName={getGameName()} 
                  drawTime={drawTime}
                  singleRow={true}
                />
              ))}
            </div>
          </div>
          
          {closed && (
            <div className="bg-red-50 p-6 rounded-3xl border border-red-100 text-center space-y-2">
                <Lock className="mx-auto text-red-500 mb-2" size={32} />
                <p className="text-red-600 font-black uppercase text-xs tracking-widest">
                  {globalLock ? 'GLOBAL SALES CLOSED' : (earlyClosure ? 'EARLY MARKET CLOSURE' : 'BOOKING FINISHED')}
                </p>
                <p className="text-gray-400 text-[10px] font-bold">
                  {globalLock 
                    ? 'Ticket booking is currently closed for today across all markets by the administrator.'
                    : (earlyClosure 
                        ? `The administrator has activated the 2:00 PM early closure for Kerala Lottery.` 
                        : 'Registration for this draw is officially closed. Please check the next available slot.')}
                </p>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default SelectionPage;
