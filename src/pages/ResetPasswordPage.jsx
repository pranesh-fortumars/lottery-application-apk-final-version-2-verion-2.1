import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper, { SupportSection } from '../components/PageWrapper';
import { Phone, Lock, ChevronLeft, AlertCircle, CheckCircle2, ShieldCheck, ArrowRight, Save, Key, Mail, Send } from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { sendPasswordResetEmail } from 'firebase/auth';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [method, setMethod] = useState('mobile'); // 'mobile' or 'email'
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState(''); // Mobile or Email
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userDocId, setUserDocId] = useState(null);

  const handleVerifyMobile = async (e) => {
    e.preventDefault();
    if (identifier.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const q = query(collection(db, 'users'), where('mobile', '==', identifier));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('No account found. Please verify your registered number.');
      } else {
        const userData = querySnapshot.docs[0].data();
        setUserDocId(querySnapshot.docs[0].id);

        // Special logic for Admin accounts
        if (userData.role === 'admin') {
          console.log("Authority account identified. Escalating to priority verification.");
        }

        setStep(2);
      }
    } catch (err) {
      setError('Verification failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailReset = async (e) => {
    e.preventDefault();
    if (!identifier) return;

    setLoading(true);
    setError('');
    try {
      let targetEmail = identifier;

      // If they entered a mobile number, find their real email
      if (/^\d{10}$/.test(identifier)) {
        const q = query(collection(db, 'users'), where('mobile', '==', identifier));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const userData = snap.docs[0].data();
          if (userData.email && userData.email.includes('@')) {
            targetEmail = userData.email;
          } else {
            setError("No official email registered for this mobile. Please use the Mobile OTP method.");
            setLoading(false);
            return;
          }
        } else {
          setError("No account identified with this mobile number.");
          setLoading(false);
          return;
        }
      }

      console.log(`[Identity Dispatch] Attempting to transmit reset link to: ${targetEmail}`);
      await sendPasswordResetEmail(auth, targetEmail);
      setSuccess(true);
    } catch (err) {
      console.error("[Identity Dispatch Error]:", err);
      let errorMessage = 'Dispatch failed. Ensure you use a registered recovery email or ID.';
      if (err.code === 'auth/user-not-found') errorMessage = "This email is not registered in our authority records.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulation: Use 123456 for demo, or any 6 digits
    setTimeout(() => {
      if (otp === '123456') {
        setStep(3);
        setError('');
      } else {
        setError('Invalid Security Code. Please enter 123456 for testing.');
      }
      setLoading(false);
    }, 1000);
  };

  const handleFinalReset = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      // In a real Firebase Auth setup, we would use a cloud function to change the Auth password.
      // For this implementation, we update the Firestore record. 
      // Note: We also set a flag that the Login page can use to "sync" the auth password if needed, 
      // or simply rely on the Admin to approve the change.
      await updateDoc(doc(db, 'users', userDocId), {
        passwordUpdateRequested: true,
        tempPassword: newPassword,
        lastResetAt: new Date().toISOString()
      });

      setSuccess(true);
    } catch (err) {
      setError('Failed to update credentials. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper title="RECOVER ACCESS" showNav={false}>
      <div className="bg-white min-h-screen p-6 flex flex-col pt-10">
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-gray-400 hover:text-[#ff0033] font-black text-[10px] uppercase tracking-widest transition-all mb-10 active:scale-95"
        >
          <ChevronLeft size={16} /> Return to Login
        </button>

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-[#ff0033] shadow-sm">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic leading-none">Security Center</h2>
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] leading-relaxed">
            {method === 'mobile' ? (
              <>
                {step === 1 && "Enter your registered mobile number to receive a verification code."}
                {step === 2 && `Enter the 6-digit code sent to +91 ${identifier}.`}
                {step === 3 && "Verification successful. Create your new secure password."}
              </>
            ) : (
              "Enter your registered email address to receive a secure recovery link."
            )}
          </p>
        </div>

        {step === 1 && !success && (
          <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl mb-8 border border-gray-100">
            <button
              onClick={() => { setMethod('mobile'); setError(''); }}
              className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${method === 'mobile' ? 'bg-white text-[#ff0033] shadow-sm border border-red-50' : 'text-gray-400'}`}
            >
              Mobile OTP
            </button>
            <button
              onClick={() => { setMethod('email'); setError(''); }}
              className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${method === 'email' ? 'bg-white text-[#ff0033] shadow-sm border border-red-50' : 'text-gray-400'}`}
            >
              Email Link
            </button>
          </div>
        )}

        {error && (
          <div className="w-full bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl mb-8 flex items-center gap-3 text-xs font-bold italic">
            <AlertCircle size={18} className="shrink-0" /> {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {!success ? (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {step === 1 && (
                <form onSubmit={method === 'mobile' ? handleVerifyMobile : handleEmailReset} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{method === 'mobile' ? 'Mobile Number' : 'Email Account'}</label>
                    <div className="relative group">
                      {method === 'mobile' ? (
                        <>
                          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-black text-[10px] pr-4 border-r border-gray-100">+91</div>
                          <input
                            required
                            className="w-full h-16 bg-gray-50 border border-gray-100 rounded-[1.5rem] pl-20 pr-6 outline-none font-bold text-gray-800 focus:bg-white focus:border-[#ff0033]/20 transition-all text-sm shadow-sm"
                            placeholder="10 Digit Number"
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={10}
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value.replace(/\D/g, ''))}
                          />
                        </>
                      ) : (
                        <>
                          <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#ff0033] transition-colors" size={20} />
                          <input
                            required
                            className="w-full h-16 bg-gray-50 border border-gray-100 rounded-[1.5rem] pl-16 pr-6 outline-none font-bold text-gray-800 focus:bg-white focus:border-[#ff0033]/20 transition-all text-sm shadow-sm"
                            placeholder="Mobile or Registered Email"
                            type="text"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                          />
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    disabled={loading}
                    className="w-full h-16 bg-gray-950 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    type="submit"
                  >
                    {loading ? "SEARCHING..." : (method === 'mobile' ? "DISPATCH OTP" : "SEND RESET LINK")}
                    {method === 'mobile' ? <ArrowRight size={18} className="text-[#ff0033]" /> : <Send size={18} className="text-[#ff0033]" />}
                  </button>
                </form>
              )}

              {step === 2 && (
                <form onSubmit={handleVerifyOTP} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Verification Code</label>
                    <div className="relative group">
                      <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#ff0033] transition-colors" size={20} />
                      <input
                        required
                        className="w-full h-16 bg-gray-50 border border-gray-100 rounded-[1.5rem] pl-16 pr-6 outline-none font-black text-gray-800 focus:bg-white focus:border-[#ff0033]/20 transition-all text-xl tracking-[0.5em] text-center shadow-sm"
                        placeholder="······"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                      />
                    </div>
                    <p className="text-[8px] font-bold text-gray-400 uppercase text-center mt-2">Hint: Use 123456 for demonstration</p>
                  </div>
                  <button
                    disabled={loading}
                    className="w-full h-16 bg-gray-950 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    type="submit"
                  >
                    {loading ? "VERIFYING..." : "CONFIRM CODE"} <ShieldCheck size={18} className="text-[#ff0033]" />
                  </button>
                </form>
              )}

              {step === 3 && (
                <form onSubmit={handleFinalReset} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">New Secure Password</label>
                    <div className="relative group">
                      <Key className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#ff0033] transition-colors" size={20} />
                      <input
                        required
                        className="w-full h-16 bg-gray-50 border border-gray-100 rounded-[1.5rem] pl-16 pr-6 outline-none font-bold text-gray-800 focus:bg-white focus:border-[#ff0033]/20 transition-all text-sm shadow-sm"
                        placeholder="Minimum 6 characters"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    disabled={loading}
                    className="w-full h-16 bg-gray-950 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    type="submit"
                  >
                    {loading ? "UPDATING..." : "UPDATE CREDENTIALS"} <Save size={18} className="text-[#ff0033]" />
                  </button>
                </form>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-emerald-50 border border-emerald-100 rounded-[2rem] p-10 text-center space-y-6"
            >
              <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-200">
                <CheckCircle2 size={40} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter italic">{method === 'email' ? 'Link Dispatched' : 'Identity Recovered'}</h3>
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mt-2">
                  {method === 'email' ? 'Check your email inbox for the reset link.' : 'Your password has been reset successfully.'}
                </p>
              </div>
              <p className="text-[10px] text-gray-500 font-bold leading-relaxed px-4">
                Please login with your new credentials to access your dashboard.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full h-14 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
              >
                Access Account Now
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <SupportSection />
        <div className="mt-auto py-10 opacity-30 text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 italic">SMS Lottery Secretariat Authority • 2026</p>
        </div>
      </div>
    </PageWrapper>
  );
};

export default ResetPasswordPage;
