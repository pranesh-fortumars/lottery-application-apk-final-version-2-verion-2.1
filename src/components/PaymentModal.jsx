import React from 'react';
import { usePayment } from '../context/PaymentContext';
import { X, Copy, CheckCircle2, ShieldCheck, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PaymentModal = ({ isOpen, onClose, amount, onConfirm }) => {
  const { activePayment } = usePayment();
  const [copied, setCopied] = React.useState(false);
  const [showInput, setShowInput] = React.useState(false);
  const [hasStarted, setHasStarted] = React.useState(false);
  const [transactionId, setTransactionId] = React.useState('');
  const [paidAmount, setPaidAmount] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleCopy = () => {
    if (activePayment?.upiId) {
      navigator.clipboard.writeText(activePayment.upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen || !activePayment) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={hasStarted ? undefined : onClose}
          className={`absolute inset-0 bg-black/80 backdrop-blur-sm ${hasStarted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        />

        {/* Modal */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-[92vw] sm:max-w-sm bg-white rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-[#ff0033] p-4 sm:p-5 text-white relative shrink-0">
            {!hasStarted && (
              <button 
                onClick={onClose}
                className="absolute top-5 right-5 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              >
                <X size={20} />
              </button>
            )}
            <div className="flex items-center justify-center gap-3 mb-1">
              <QrCode size={22} />
              <h3 className="text-lg sm:text-xl font-black uppercase italic tracking-tighter">Payment Required</h3>
            </div>
            <p className="text-white/80 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-center">Amount to Pay: ₹{amount}</p>
          </div>

          <div className="p-4 sm:p-5 space-y-3 sm:space-y-4 overflow-y-auto pb-4">
            {/* QR Code */}
            <div className="flex flex-col items-center justify-center p-3 sm:p-4 bg-gray-50 rounded-[1.5rem] border-2 border-dashed border-gray-200">
               <div className="relative p-2 bg-white rounded-2xl shadow-lg mb-2 transform hover:scale-105 transition-transform duration-500 w-[120px] sm:w-[140px] aspect-square flex items-center justify-center">
                  <img src={activePayment.qrUrl} alt="UPI QR Code" className="w-full h-full object-contain rounded-xl" />
                  <div className="absolute inset-0 border-4 border-gray-50/50 rounded-2xl pointer-events-none"></div>
               </div>
               <p className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest text-center px-2 leading-tight">
                  1. Scan QR with any UPI App<br/>
                  2. Make payment of ₹{amount}
               </p>
            </div>

            {/* UPI ID */}
            <div className="bg-red-50/50 p-2 sm:p-3 rounded-2xl border border-red-100 flex flex-col items-center">
               <label className="text-[8px] sm:text-[9px] font-black text-[#ff0033] uppercase tracking-widest mb-1.5 text-center">Manual Transfer Details</label>
               <div className="flex items-center justify-between bg-white w-full px-3 py-2 rounded-xl border border-red-100 shadow-sm">
                  <span className="font-black text-gray-800 text-xs sm:text-sm truncate select-all">{activePayment.upiId}</span>
                  <button 
                    onClick={handleCopy}
                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-[#ff0033] shrink-0 ml-2"
                  >
                    {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                  </button>
               </div>
               <p className="text-[8px] text-gray-400 font-bold uppercase italic text-center mt-2">Beneficiary: {activePayment.bankName}</p>
            </div>

            {/* Input Fields */}
            <div className="space-y-3 w-full">
               <div className="space-y-2 w-full">
                  <div className="w-full text-left">
                    <label className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1 block mb-1">Amount Actually Paid (₹)</label>
                    <input 
                      type="text" 
                      inputMode="decimal"
                      pattern="[0-9]*"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      placeholder="Enter exact amount"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 sm:py-3 text-xs font-bold focus:outline-none focus:border-[#ff0033] focus:ring-2 focus:ring-[#ff0033]/10 transition-all shadow-inner text-gray-900"
                    />
                  </div>
                  <div className="w-full text-left">
                    <label className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1 block mb-1">Transaction ID / UTR (12 Digits)</label>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Enter 12-digit UTR"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 sm:py-3 text-xs font-bold focus:outline-none focus:border-[#ff0033] focus:ring-2 focus:ring-[#ff0033]/10 transition-all shadow-inner text-gray-900"
                    />
                  </div>
               </div>

               <div className="bg-emerald-50 p-2 sm:p-3 rounded-xl flex items-start gap-2 border border-emerald-100 shadow-sm mx-auto">
                  <ShieldCheck className="text-emerald-500 shrink-0 mt-0.5" size={14} />
                  <p className="text-[8px] sm:text-[9px] text-emerald-800 font-bold leading-snug text-left">
                     Double check your Transaction ID and Amount. Incorrect details will result in rejection.
                  </p>
               </div>

               <button 
                  disabled={isSubmitting}
                  onClick={async () => {
                    if (!paidAmount || parseFloat(paidAmount) <= 0) return alert("Please enter the amount you paid");
                    if (!transactionId.trim()) return alert("Please enter Transaction ID");
                    
                    setIsSubmitting(true);
                    try {
                      await onConfirm(transactionId, null, paidAmount);
                      setTransactionId('');
                      setPaidAmount('');
                    } catch (err) {
                      console.error("Confirmation error:", err);
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  className="w-full bg-[#ff0033] text-white py-3 sm:py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
               >
                  {isSubmitting ? 'Processing...' : 'I Have Paid'}
               </button>

               <button 
                  onClick={onClose}
                  className="w-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 py-2.5 sm:py-3 rounded-lg font-black text-[9px] sm:text-[10px] uppercase tracking-widest active:scale-95 transition-all"
               >
                  Cancel Payment
               </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PaymentModal;
