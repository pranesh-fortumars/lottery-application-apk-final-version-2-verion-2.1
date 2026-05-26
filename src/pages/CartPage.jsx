import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { ShoppingCart, Trash2, CreditCard, ChevronLeft, QrCode, Info, AlertCircle, ChevronRight, Wallet } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { usePayment } from '../context/PaymentContext';
import PaymentModal from '../components/PaymentModal';
import { getBrandBySlot, isSlotClosed } from '../constants/lotteryConfig';
import { motion, AnimatePresence } from 'framer-motion';

const BalanceWarningModal = ({ isOpen, onClose, cartTotal, currentBalance, onRecharge }) => {
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-sm bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border-2 border-red-500/20"
        >
          <div className="bg-[#ff0033] p-8 text-white text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
             <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30">
                <AlertCircle size={32} />
             </div>
             <h3 className="text-2xl font-black uppercase italic tracking-tighter">Insufficient Balance</h3>
             <p className="text-white/70 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Refill required to continue</p>
          </div>

          <div className="p-8 space-y-6">
             <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                   <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Your Balance</p>
                   <p className="text-lg font-black text-gray-800">₹{currentBalance.toFixed(2)}</p>
                </div>
                <div className="text-right">
                   <p className="text-[8px] font-black text-red-400 uppercase tracking-widest leading-none mb-1">Shortfall</p>
                   <p className="text-lg font-black text-red-600">₹{(cartTotal - currentBalance).toFixed(2)}</p>
                </div>
             </div>

             <div className="space-y-4">
                <div className="flex gap-3 items-start">
                   <div className="w-6 h-6 bg-emerald-50 rounded-full flex items-center justify-center shrink-0 mt-0.5 border border-emerald-100">
                      <Wallet size={12} className="text-emerald-600" />
                   </div>
                   <p className="text-[10px] text-gray-500 font-bold leading-relaxed">
                      Only <span className="text-gray-900">Winning Prizes</span> earned from lottery results are eligible for direct withdrawal to your bank.
                   </p>
                </div>
                <div className="flex gap-3 items-start">
                   <div className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center shrink-0 mt-0.5 border border-blue-100">
                      <CreditCard size={12} className="text-blue-600" />
                   </div>
                   <p className="text-[10px] text-gray-500 font-bold leading-relaxed">
                      Deposited balance and Referral bonus are primarily intended for <span className="text-gray-900">Ticket Purchases</span> only.
                   </p>
                </div>
                <div className="flex gap-3 items-start">
                   <div className="w-6 h-6 bg-[#ff0033]/5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border border-[#ff0033]/10">
                      <Info size={12} className="text-[#ff0033]" />
                   </div>
                   <p className="text-[10px] text-gray-500 font-bold leading-relaxed">
                      Please recharge your wallet to complete this purchase. All deposits are manually verified by admins.
                   </p>
                </div>
             </div>

             <div className="pt-4 space-y-3">
                <button 
                  onClick={onRecharge}
                  className="w-full bg-[#ff0033] text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                   Recharge Wallet <ChevronRight size={16} />
                </button>
                <button 
                  onClick={onClose}
                  className="w-full bg-gray-100 text-gray-400 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                >
                   Cancel Purchase
                </button>
             </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const CartPage = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, clearCart, cartTotal, confirmPurchase, appSettings } = useCart();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const { activePayment } = usePayment();

  const closedItems = cart.filter(item => {
    const itemBrand = (item.title || "").toUpperCase().includes('JACKPOT') ? 'JACKPOT' : getBrandBySlot(item.draw);
    return isSlotClosed(item.draw, itemBrand, appSettings);
  });
  const anyClosed = closedItems.length > 0;
  
  const bonusAvailable = user?.bonusBalance || 0;
  const bonusUsed = Math.min(cartTotal, bonusAvailable);
  const walletBalance = (user?.depositedBalance || 0) + (user?.winningBalance || 0);
  const totalUsableBalance = walletBalance + bonusAvailable;
  const remainingToPay = cartTotal - bonusUsed;
  const isFullBonus = remainingToPay === 0;

  const handlePay = async () => {
    if (cart.length === 0 || anyClosed) return;

    if (totalUsableBalance >= cartTotal) {
      // User has enough in wallet (including bonus) to pay directly
      const paymentType = isFullBonus ? 'Referral Bonus' : 'Wallet';
      const confirmMsg = isFullBonus 
        ? `Use ₹${bonusUsed} from your Referral Bonus to purchase these tickets?`
        : `Pay ₹${cartTotal.toFixed(2)} from your wallet balance to purchase these tickets?`;

      if (window.confirm(confirmMsg)) {
        setIsProcessing(true);
        try {
          // isPrepaid = false means direct deduction from wallet
          await confirmPurchase(false, null, null, paymentType, bonusUsed);
          alert("Purchase Successful!");
          navigate('/home');
        } catch (error) {
          alert("Failed to complete purchase.");
        } finally {
          setIsProcessing(false);
        }
      }
    } else {
      // Insufficient wallet balance, show informational warning modal
      setShowWarning(true);
    }
  };

  const handleRechargeRedirect = () => {
    setShowWarning(false);
    navigate('/topup', { state: { requiredAmount: (cartTotal - totalUsableBalance).toFixed(2) } });
  };

  const currentDate = new Date().toLocaleDateString('en-GB');

  // --- Fixed Footer Actions for Cart ---
  const cartFooter = (
    <div className="w-full flex gap-3">
      <button 
        onClick={handlePay}
        disabled={isProcessing || cart.length === 0 || anyClosed}
        className={`flex-1 text-white py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-sm shadow-[0_15px_30px_-5px_rgba(255,0,85,0.4)] active:scale-95 transition-all disabled:opacity-50 border-b-4 border-black/10 ${anyClosed ? 'bg-gray-400' : 'bg-[#ff0033]'}`}
      >
        <ShoppingCart size={20} fill="white" /> {isProcessing ? 'Waiting...' : (anyClosed ? 'Slot Expired' : (isFullBonus ? 'Pay with Bonus' : 'Confirm Pay'))}
      </button>
      
      <button 
        onClick={clearCart}
        className="px-6 bg-gray-900 text-white rounded-2xl flex items-center justify-center gap-2 font-black text-sm shadow-xl active:scale-95 transition-all border-b-4 border-black/10"
      >
        <Trash2 size={20} />
      </button>
    </div>
  );

  return (
    <PageWrapper title="SHOPPING CART" footerAction={cartFooter}>
      <div className="bg-white flex flex-col items-center">
        {/* Header Bar */}
        <div className="w-full max-w-sm bg-[#ff0033] text-white py-3 mt-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg mb-8 shadow-[#ff0033]/20">
           <ShoppingCart size={24} fill="white" />
           <span className="text-xl font-black uppercase tracking-tight font-serif">Your Cart</span>
        </div>

        {/* Slot Closure Warning */}
        {anyClosed && (
          <div className="w-full max-w-sm bg-red-50 border border-red-200 p-4 rounded-2xl mb-6 flex flex-col items-center text-center gap-2">
            <ShoppingCart className="text-red-600 animate-bounce" size={24} />
            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">
              Action Required: Slots Expired
            </p>
            <p className="text-[8px] font-bold text-gray-500 leading-relaxed uppercase">
              Some items in your cart belong to draws that are now closed. Please remove these items to proceed.
            </p>
            <div className="flex flex-wrap gap-1 justify-center mt-1">
               {closedItems.map((it, idx) => (
                 <span key={idx} className="bg-red-600 text-white text-[7px] px-2 py-0.5 rounded-full font-black">{it.draw}</span>
               ))}
            </div>
          </div>
        )}

        {/* Cart Table */}
        <div className="w-full max-w-sm mb-8 overflow-hidden px-1">
          <table className="w-full border-collapse border border-red-600 text-left text-sm font-serif">
            <tbody>
              <tr className="border border-red-600">
                <td colSpan={4} className="p-2 border-r border-red-600 font-bold">Name: {user?.name || 'Guest'}</td>
                <td colSpan={2} className="p-2 text-right font-bold italic">Date: {currentDate}</td>
              </tr>
              
              {/* Row 2: Headers */}
              <tr className="border border-red-600 bg-gray-50/50">
                <td className="p-2 border-r border-red-600 font-bold">Lot Details</td>
                <td className="p-2 border-r border-red-600 font-bold text-center">Number</td>
                <td className="p-2 border-r border-red-600 font-bold text-center">Unit</td>
                <td className="p-2 border-r border-red-600 font-bold text-center">₹</td>
                <td className="p-2 border-r border-red-600 font-bold text-right">Amount ₹</td>
                <td className="p-2 font-bold text-center w-8"></td>
              </tr>

              {/* Data Rows */}
              {cart.map((item) => (
                <tr key={item.id} className="border border-red-600 relative group">
                  <td className="p-2 border-r border-red-600">
                    <div className="flex flex-col">
                      <span className="font-bold text-[10px] leading-tight uppercase">{item.title}</span>
                      {item.board && <span className="text-[8px] text-red-500 font-black">Board: {item.board}</span>}
                    </div>
                  </td>
                  <td className="p-2 border-r border-red-600 text-center font-black">{item.num}</td>
                  <td className="p-2 border-r border-red-600 text-center">{item.qty}</td>
                  <td className="p-2 border-r border-red-600 text-center">{item.price}</td>
                  <td className="p-2 border-r border-red-600 text-right font-black">{(item.price * item.qty).toFixed(2)}</td>
                  <td className="p-1 text-center align-middle">
                    <button 
                      onClick={() => removeFromCart(item.id)} 
                      className="p-1.5 text-red-500 hover:text-white hover:bg-red-600 rounded-lg transition-colors mx-auto flex items-center justify-center active:scale-90"
                      title="Remove Ticket"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}

              {cart.length === 0 && (
                <tr className="border border-red-600">
                  <td colSpan={6} className="p-10 text-center text-gray-300 italic">No tickets in cart</td>
                </tr>
              )}

              {/* Total Amount Row */}
              <tr className="border border-red-600 bg-gray-50 font-black">
                <td colSpan={4} className="p-2 border-r border-red-600 text-center uppercase tracking-widest text-[10px]">Grand Total:</td>
                <td className="p-2 border-r border-red-600 text-right text-lg">{cartTotal.toFixed(2)}</td>
                <td className="p-2 bg-white"></td>
              </tr>
            </tbody>
          </table>
          
          <div className="border-x border-b border-red-600 p-2 bg-white mb-4">
             <p className="text-[10px] font-bold text-gray-800 leading-tight italic">
               ** Some items are removed automatically if draw time expires.
             </p>
          </div>

          {/* Wallet Balance Info */}
          <div className="bg-gradient-to-r from-red-50 to-white border-2 border-red-600/20 rounded-2xl p-4 flex items-center justify-between mb-6 shadow-sm">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#ff0033] rounded-xl flex items-center justify-center shadow-lg">
                   <Wallet size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Usable Wallet Balance</p>
                  <p className="text-xs font-black text-gray-800 italic uppercase">₹{totalUsableBalance.toFixed(2)}</p>
                </div>
             </div>
             <div className="flex flex-col items-end">
                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${totalUsableBalance >= cartTotal ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                  {totalUsableBalance >= cartTotal ? 'Sufficient' : 'Low Balance'}
                </span>
             </div>
          </div>
        </div>

        <button 
          onClick={() => navigate('/home')} 
          className="mt-6 mb-10 flex items-center gap-2 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-red-500 transition-colors"
        >
          <ChevronLeft size={14} /> Add more tickets
        </button>
      </div>

      <BalanceWarningModal 
        isOpen={showWarning} 
        onClose={() => setShowWarning(false)} 
        cartTotal={cartTotal}
        currentBalance={totalUsableBalance}
        onRecharge={handleRechargeRedirect}
      />
    </PageWrapper>
  );
};

export default CartPage;
