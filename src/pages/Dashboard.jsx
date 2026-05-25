import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, Diamond, QrCode, Shield } from 'lucide-react';
import { usePayment } from '../context/PaymentContext';
import { useCart } from '../context/CartContext';
import { DRAW_SLOTS, getCutoffTime, isSlotClosed } from '../constants/lotteryConfig';
import { SupportSection } from '../components/PageWrapper';

const CountdownTimer = ({ drawTime, brand, appSettings }) => {
  const [timeLeft, setTimeLeft] = useState({ h: '00', m: '00', s: '00' });

  useEffect(() => {
    const calculateTime = () => {
      const cutoff = getCutoffTime(drawTime, brand, appSettings);
      if (!cutoff) return;
      
      const now = new Date();
      let diff = cutoff - now;
      
      if (diff < 0) {
        setTimeLeft({ h: '00', m: '00', s: '00' });
        return;
      }

      const h = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
      const m = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
      const s = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0');

      setTimeLeft({ h, m, s });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [drawTime, brand, appSettings]);

  return (
    <div className="flex flex-col">
       <p className="text-[7px] font-black text-white/50 uppercase tracking-[0.2em] mb-1">Booking Ends In</p>
       <div className="flex gap-1.5">
          <div className="bg-white/10 backdrop-blur-md text-white w-9 h-9 flex items-center justify-center rounded-lg font-black text-lg border border-white/10 shadow-lg">{timeLeft.h}</div>
          <div className="bg-white/10 backdrop-blur-md text-white w-9 h-9 flex items-center justify-center rounded-lg font-black text-lg border border-white/10 shadow-lg">{timeLeft.m}</div>
          <div className="bg-white/10 backdrop-blur-md text-white w-9 h-9 flex items-center justify-center rounded-lg font-black text-lg border border-white/10 shadow-lg">{timeLeft.s}</div>
       </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { activePayment } = usePayment();
  const { appSettings } = useCart();
  const jackpotVisible = appSettings.jackpotVisible;

  const games = DRAW_SLOTS.map(game => {
    const marketName = game.brand;
    const isKerala = marketName.toUpperCase() === 'KERALA';
    const globalLock = appSettings.globalSalesClosed;
    const earlyClosure = isKerala && appSettings.keralaSalesClosed;
    
    // If Kerala early closure is ON, force time to 02:00 PM for logic and display
    const effectiveTime = earlyClosure ? '02:00 PM' : game.time;
    
    return {
      time: effectiveTime,
      originalTime: game.time,
      name: marketName,
      type: marketName.toLowerCase(),
      id: game.id,
      closed: globalLock || isSlotClosed(effectiveTime, marketName, appSettings)
    };
  });

  return (
    <div className="bg-[#f9f9f9]">
      {/* Hero Banner Area - Using newly generated premium banner */}
      <div className="p-4 pt-4">
        <div className="rounded-3xl overflow-hidden shadow-2xl relative border-2 border-white/20">
           <img 
            src="/hero-banner.png" 
            alt="Hero Banner" 
            className="w-full h-auto object-cover"
          />
        </div>
      </div>

      {/* Global Sales Closed Banner */}
      {appSettings.globalSalesClosed && (
        <div className="px-4 mt-2">
           <div className="bg-black border-2 border-red-600 p-6 rounded-[2rem] flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/10 rounded-full blur-2xl -mr-12 -mt-12"></div>
              <Shield className="text-red-600 mb-2 animate-bounce" size={32} />
              <h3 className="text-white font-black text-lg uppercase tracking-tighter italic italic">Sales Closed For Today</h3>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Administrator has manually suspended all ticket intake</p>
           </div>
        </div>
      )}

      {/* Red Promo Bar - Exactly like Image 1 with text */}
      {jackpotVisible && (
        <div className="bg-[#ff0000] mt-2 py-2.5 flex justify-center items-center px-6 shadow-md border-y border-white/10">
          <Mail size={24} className="text-white fill-white" />
          <span className="text-white font-black ml-2 text-sm tracking-widest uppercase animate-pulse">🔥 HOT JACKPOT ALERT : WIN BIG TODAY!</span>
        </div>
      )}

      {/* Active Payment Method Banner - Real-time reflection */}
      {activePayment && (
        <div className="mt-4 px-4">
          <div 
            onClick={() => navigate('/topup')}
            className="bg-white border-2 border-dashed border-red-600/30 p-4 rounded-3xl flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
                <QrCode className="text-white" size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Active Payment ID</p>
                <p className="text-sm font-black text-gray-800 italic uppercase">{activePayment.upiId}</p>
                <p className="text-[8px] font-black text-red-600 uppercase tracking-widest mt-0.5">{activePayment.bankName}</p>
              </div>
            </div>
            <button className="bg-red-600 text-white p-2 rounded-xl shadow-lg active:scale-90 transition-all">
              <Diamond size={16} fill="white" />
            </button>
          </div>
        </div>
      )}

      {/* 3 & 4 Digits Game Title with Diamond Icon */}
      <div className="px-5 py-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
           <Diamond className="text-white fill-white" size={24} />
        </div>
        <h2 className="text-3xl font-black text-red-600 font-sans tracking-tighter uppercase">3 & 4 Digits Game</h2>
      </div>

      {/* Games Grid - Matching card design in Image 1 */}
      <div className="grid grid-cols-2 gap-4 px-4 pb-10">
        {games.map((game, idx) => (
          <div 
            key={idx} 
            className={`game-card-gradient p-4 rounded-3xl relative overflow-hidden h-[160px] shadow-2xl border border-white/5 transition-all ${
              game.closed ? 'opacity-60 grayscale scale-[0.98]' : 'cursor-pointer active:scale-95'
            }`}
            onClick={() => !game.closed && navigate(`/select/${game.id}`)}
          >
            {/* Gold Geometric Lines Overlay - More visible */}
            <div className="absolute top-0 right-0 w-full h-full opacity-40 pointer-events-none">
              <div className="absolute top-0 right-0 border-t-[4px] border-r-[4px] border-yellow-500/80 w-[70%] h-[70%] transform skew-x-[-15deg]"></div>
            </div>
            
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="text-white">
                <p className="text-[12px] font-black opacity-80 leading-tight uppercase tracking-tight">Booking Time</p>
                {game.closed ? (
                  <div className="h-10 flex items-center">
                    <span className="bg-red-600 text-white px-4 py-1.5 rounded-full text-[12px] font-black uppercase tracking-widest animate-pulse shadow-lg">CLOSED</span>
                  </div>
                ) : (
                  <CountdownTimer drawTime={game.time} brand={game.name} appSettings={appSettings} />
                )}
              </div>
              
              <div className="flex justify-between items-end mt-3 border-t border-white/10 pt-2">
                <span className="text-white text-[13px] font-black drop-shadow-md">{game.time}</span>
                {game.type === 'dear' ? (
                  <div className="flex flex-col items-end leading-[0.8]">
                    <span className="text-yellow-400 font-black text-[18px] italic tracking-tighter shadow-black drop-shadow-sm">DEAR</span>
                    <span className="text-cyan-400 text-[9px] font-black tracking-[0.2em]">LOTTERY</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                     <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center font-black text-[12px] text-black shadow-md">K</div>
                     <span className="text-green-500 text-[10px] font-black leading-none uppercase">Kerala<br/>Lottery</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Jackpot Section - Controlled by Admin Toggle */}
      {jackpotVisible && (
        <>
          {/* Jackpot Title with Diamond Icon */}
          <div className="px-5 py-4 flex items-center gap-3 border-t border-gray-100 pt-8">
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
               <Diamond className="text-white fill-white" size={24} />
            </div>
            <h2 className="text-3xl font-black text-red-600 font-sans tracking-tighter uppercase">Jackpot</h2>
          </div>

          {/* Jackpot Banner - New Generated Green Banner */}
          <div className="px-4 py-4">
            <div 
              className="rounded-3xl overflow-hidden shadow-2xl border-2 border-green-500/20"
              onClick={() => navigate('/jackpot')}
            >
              <img 
                src="/jackpot-banner.png" 
                alt="Jackpot Play Banner" 
                className="w-full h-auto"
              />
            </div>
          </div>

          {/* Exact Buttons from Image 1 with higher contrast */}
          <div className="flex gap-4 px-10 pb-20 pt-4">
            <button 
              className="bg-[#ff004d] text-white py-4 px-6 rounded-xl font-black text-xl shadow-[0_10px_20px_rgba(255,0,77,0.3)] active:scale-95 flex-1 uppercase tracking-tight"
              onClick={() => navigate('/jackpot')}
            >
              Wins Wins
            </button>
            <button 
              className="bg-[#ff004d] text-white py-4 px-6 rounded-xl font-black text-xl shadow-[0_10px_20px_rgba(255,0,77,0.3)] active:scale-95 flex-1 uppercase tracking-tight"
              onClick={() => navigate('/jackpot')}
            >
              JackPot
            </button>
          </div>
        </>
      )}
      <SupportSection />
    </div>
  );
};

export default Dashboard;
