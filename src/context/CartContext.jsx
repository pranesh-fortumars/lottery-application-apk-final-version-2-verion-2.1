import * as React from 'react';
import { useAuth } from './AuthContext';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  getDocs,
  writeBatch,
  increment,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { getBrandBySlot, isSlotClosed } from '../constants/lotteryConfig';

const CartContext = React.createContext();

export const useCart = () => {
  const context = React.useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = React.useState([]);
  const [purchasedTickets, setPurchasedTickets] = React.useState([]);
  const [declaredResults, setDeclaredResults] = React.useState([]);
  const [notifications, setNotifications] = React.useState([]);
  const [adminAlerts, setAdminAlerts] = React.useState([]);
  const [prizeScheme, setPrizeScheme] = React.useState(null);
  const [hoveringNews, setHoveringNews] = React.useState('');
  const [appSettings, setAppSettings] = React.useState({
    jackpotVisible: true,
    maintenanceMode: false,
    brandName: 'SMS Lottery',
    sessionPersistence: '04 HOURS (STANDARD)',
    keralaSalesClosed: false,
    globalSalesClosed: false,
    customerCare: '+91 00000 00000',
    whatsapp: '',
    telegram: ''
  });
  const [loading, setLoading] = React.useState(true);

  // --- Subscriptions ---
  React.useEffect(() => {
    // Subscribe to Global App Settings
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'app'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setAppSettings(prev => ({ ...prev, ...data }));
        if (data.hoveringNews !== undefined) setHoveringNews(data.hoveringNews);
      }
    });

    if (!user) {
      setPurchasedTickets([]);
      setNotifications([]);
      setLoading(false);
      return () => {
        unsubscribeSettings();
      };
    }

    // Subscribe to Global Prize Scheme
    const unsubscribeScheme = onSnapshot(doc(db, 'settings', 'prizeScheme'), (snapshot) => {
      if (snapshot.exists()) {
        setPrizeScheme(snapshot.data());
      } else {
        // Initialize default scheme if missing
        const defaultScheme = {
          '1D': { A: '100', B: '100', C: '100' },
          '2D': { AB: '1000', BC: '1000', AC: '1000' },
          '3D': {
            '12': { ABC: '6250', BC: '250', C: '25' },
            '28': { ABC: '15000', BC: '500', C: '50' },
            '30': { ABC: '17500', BC: '500', C: '50' },
            '55': { ABC: '30000', BC: '1000', C: '100' },
            '60': { ABC: '35000', BC: '1000', C: '100' }
          },
          '4D': {
            '20': { XABC: '100000', ABC: '0', BC: '0', C: '0' },
            '50': { XABC: '250000', ABC: '5000', BC: '500', C: '50' },
            '100': { XABC: '500000', ABC: '10000', BC: '1000', C: '100' }
          }
        };
        setPrizeScheme(defaultScheme);
      }
    });

    const unsubscribeTickets = onSnapshot(collection(db, 'tickets'), (snapshot) => {
      const allTickets = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      // Admin sees everything; User sees only their own
      const visibleTickets = user.role === 'admin' 
        ? allTickets 
        : allTickets.filter(t => t.userId === user.uid);
        
      const sortedTickets = [...visibleTickets].sort((a, b) => {
        const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : Date.now();
        const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : Date.now();
        return timeB - timeA;
      });
      setPurchasedTickets(sortedTickets);
    });

    const unsubscribeResults = onSnapshot(collection(db, 'results'), (snapshot) => {
      const allResults = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      
      // 1. Sort by newest first, handling null timestamps (local estimates) gracefully
      const sorted = allResults.sort((a, b) => {
        const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : Date.now();
        const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : Date.now();
        
        if (Math.abs(timeB - timeA) > 1000) return timeB - timeA;
        return String(b.id).localeCompare(String(a.id)); 
      });

      // 2. Deduplicate: Only keep the latest declaration for each unique brand/date/draw slot
      const uniqueResults = [];
      const seenSlots = new Set();

      sorted.forEach(res => {
        // Updated key to include brand to prevent cross-market overwriting
        const slotKey = `${res.brand}_${res.date}_${res.draw}`;
        if (!seenSlots.has(slotKey)) {
          uniqueResults.push(res);
          seenSlots.add(slotKey);
        }
      });

      setDeclaredResults(uniqueResults);
    }, (error) => {
      console.error("Results subscription error:", error);
    });

    const unsubscribeNotifs = onSnapshot(collection(db, 'notifications'), (snapshot) => {
      const allNotifs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      // Admin sees everything; User sees only their own
      const visibleNotifs = user.role === 'admin'
        ? allNotifs
        : allNotifs.filter(n => n.userId === user.uid);

      const sortedNotifs = visibleNotifs.sort((a, b) => {
        const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : Date.now();
        const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : Date.now();
        return timeB - timeA;
      });
      setNotifications(sortedNotifs);
    });

    let unsubscribeAdminTx = () => {};
    let unsubscribeAdminWd = () => {};

    if (user?.role === 'admin') {
      unsubscribeAdminTx = onSnapshot(
        query(collection(db, 'pending_transactions'), where('status', '==', 'pending')),
        (snap) => {
          const alerts = snap.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              userId: data.userId,
              title: data.type === 'topup' ? 'New Wallet Top-Up' : 'New Ticket Purchase',
              message: `${data.userName || 'User'} requested ₹${data.amount}`,
              type: 'admin_alert',
              source: 'transaction',
              read: false,
              timestamp: data.timestamp
            };
          });
          setAdminAlerts(prev => {
            const wdAlerts = prev.filter(a => a.source === 'withdrawal');
            return [...alerts, ...wdAlerts];
          });
        }
      );

      unsubscribeAdminWd = onSnapshot(
        query(collection(db, 'withdrawals'), where('status', '==', 'pending')),
        (snap) => {
          const alerts = snap.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              userId: data.userId,
              title: 'Withdrawal Request',
              message: `${data.userName || 'User'} requested ₹${data.amount}`,
              type: 'admin_alert',
              source: 'withdrawal',
              read: false,
              timestamp: data.timestamp
            };
          });
          setAdminAlerts(prev => {
            const txAlerts = prev.filter(a => a.source === 'transaction');
            return [...txAlerts, ...alerts];
          });
        }
      );
    }

    setLoading(false);
    return () => {
      unsubscribeScheme();
      unsubscribeTickets();
      unsubscribeResults();
      unsubscribeNotifs();
      unsubscribeSettings();
      unsubscribeAdminTx();
      unsubscribeAdminWd();
    };
  }, [user]);

  const updateScheme = async (newScheme) => {
    try {
      await updateDoc(doc(db, 'settings', 'prizeScheme'), newScheme);
      return true;
    } catch (e) {
      // If doc doesn't exist, set it
      try {
        await setDoc(doc(db, 'settings', 'prizeScheme'), newScheme);
        return true;
      } catch (err) {
        console.error("Scheme update failed:", err);
        return false;
      }
    }
  };

  const [lastAnnouncement, setLastAnnouncement] = React.useState(null);
  const ticketsRef = React.useRef([]);
  React.useEffect(() => { ticketsRef.current = purchasedTickets; }, [purchasedTickets]);

  const processingResults = React.useRef(new Set());

  // Sync Engine: Triggers Payouts and Announcements when new results arrive
  React.useEffect(() => {
    if (!declaredResults || declaredResults.length === 0 || !user) return;
    
    // 📣 1. BROADCAST LATEST ANNOUNCEMENT
    const latestResult = declaredResults[0];
    if (latestResult.digits && latestResult.number) {
      setLastAnnouncement({
        message: `RESULT DECLARED: ${latestResult.brand} (${latestResult.draw})`,
        ticker: `WINNING NUMBER FOR ${latestResult.draw}: ${latestResult.number}`,
        draw: latestResult.draw,
        number: latestResult.number
      });
    }

    // 💰 2. SCAN & PROCESS UNPROCESSED PAYOUTS
    const processAudit = async () => {
      if (!user?.uid || declaredResults.length === 0 || purchasedTickets.length === 0) return;

      const userTickets = purchasedTickets.filter(t => t.userId === user.uid);

      for (const res of declaredResults) {
        if (!res?.id || !res?.digits || processingResults.current.has(res.id)) continue;
        
        const resDraw = String(res.draw || "").trim();
        const resDate = String(res.date || "").trim();
        const ticketsToAudit = userTickets.filter(t => 
          String(t.draw || "").trim() === resDraw && 
          String(t.purchaseDate || "").trim() === resDate &&
          t.processedBy !== res.id
        );

        if (ticketsToAudit.length === 0) continue;

        // Lock this result to prevent duplicate processing in the same lifecycle
        processingResults.current.add(res.id);

        const winningCombos = {
          '1D_A': String(res.digits.A || ''), '1D_B': String(res.digits.B || ''), '1D_C': String(res.digits.C || ''),
          '2D_AB': `${res.digits.A || ''}${res.digits.B || ''}`, 
          '2D_BC': `${res.digits.B || ''}${res.digits.C || ''}`, 
          '2D_AC': `${res.digits.A || ''}${res.digits.C || ''}`,
          '3D_ABC': `${res.digits.A || ''}${res.digits.B || ''}${res.digits.C || ''}`,
          '4D_XABC': `${res.digits.X || ''}${res.digits.A || ''}${res.digits.B || ''}${res.digits.C || ''}`
        };

        const batch = writeBatch(db);
        let balanceAdj = 0;
        let anyChanges = false;

        ticketsToAudit.forEach(ticket => {
          if (!ticket.id) return;
          try {
            // Reverse old win ONLY IF it was from a DIFFERENT result ID
            if (ticket.status === 'Won' && ticket.prize && ticket.processedBy !== res.id) {
              const oldVal = parseInt(ticket.prize.replace(/[^\d]/g, '')) || 0;
              balanceAdj -= oldVal;
            }

            let isWinner = false;
            let winAmt = 0;
            const ticketNum = String(ticket.num || '');

            const ticketPriceKey = String(Math.floor(Number(ticket.price || 0)));

            if (ticket.type === '4D') {
              // 4D Tiered Cascading Logic: XABC -> ABC -> BC -> C
              const tierPrizes = res.prizes?.['4D']?.[ticketPriceKey] || {};
              if (ticketNum === winningCombos['4D_XABC']) {
                isWinner = true;
                winAmt = Number(tierPrizes.XABC || 0);
              } else if (ticketNum.slice(-3) === winningCombos['3D_ABC']) {
                isWinner = true;
                winAmt = Number(tierPrizes.ABC || 0);
              } else if (ticketNum.slice(-2) === winningCombos['2D_BC']) {
                isWinner = true;
                winAmt = Number(tierPrizes.BC || 0);
              } else if (ticketNum.slice(-1) === winningCombos['1D_C']) {
                isWinner = true;
                winAmt = Number(tierPrizes.C || 0);
              }
            } else if (ticket.type === '3D') {
              // 3D Tiered Cascading Logic: ABC -> BC -> C
              const tierPrizes = res.prizes?.['3D']?.[ticketPriceKey] || {};
              if (ticketNum === winningCombos['3D_ABC']) {
                isWinner = true;
                winAmt = Number(tierPrizes.ABC || 0);
              } else if (ticketNum.slice(-2) === winningCombos['2D_BC']) {
                isWinner = true;
                winAmt = Number(tierPrizes.BC || 0);
              } else if (ticketNum.slice(-1) === winningCombos['1D_C']) {
                isWinner = true;
                winAmt = Number(tierPrizes.C || 0);
              }
            } else {
              // Standard 1D/2D Positional Logic (Non-tiered)
              const lookupKey = `${ticket.type}_${ticket.pos}`;
              const targetNum = String(winningCombos[lookupKey] || '');
              isWinner = ticketNum === targetNum;
              if (isWinner) {
                winAmt = Number(res.prizes?.[ticket.type]?.[ticket.pos] || 0);
              }
            }
            
            const ticketRef = doc(db, 'tickets', String(ticket.id));
            if (isWinner) {
              const totalPayout = winAmt * Number(ticket.qty || 1);
              balanceAdj += totalPayout;
              batch.update(ticketRef, { 
                status: 'Won', prize: `₹ ${totalPayout}`, 
                processedBy: res.id, payoutDate: serverTimestamp() 
              });
            } else {
              batch.update(ticketRef, { status: 'Closed', prize: '₹ 0', processedBy: res.id });
            }
            anyChanges = true;
          } catch (err) { console.error("Sync error:", err); }
        });

        if (balanceAdj !== 0) {
          batch.update(doc(db, 'users', user.uid), { 
            winningBalance: increment(balanceAdj),
            balance: increment(balanceAdj) 
          });
          addNotification({ 
            userId: user.uid, 
            title: balanceAdj > 0 ? '🏆 WINNER!' : '⚠️ ADJUSTMENT', 
            message: `Result for ${resDraw} processed. Balance adjusted by ₹ ${balanceAdj}.`, 
            type: 'info' 
          });
        }

        if (anyChanges) {
          try { 
            await batch.commit(); 
            console.log(`✅ Audit Complete for: ${resDraw}`); 
          }
          catch (e) { 
            console.error(`❌ Sync failed`, e); 
            processingResults.current.delete(res.id); // Unlock on failure
          }
        } else {
          processingResults.current.delete(res.id);
        }
      }
    };
    processAudit();
  }, [declaredResults, purchasedTickets, user]);

  const addToCart = (entry) => setCart((prev) => [...prev, { ...entry, id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}` }]);
  const removeFromCart = (id) => setCart((prev) => prev.filter((item) => item.id !== id));
  const clearCart = () => setCart([]);

  const confirmPurchase = async (isPrepaid = false, transactionId = null, userUpiId = null, paymentType = 'UPI', bonusUsed = 0, userEnteredAmount = null) => {
    if (cart.length === 0 || !user) return;
    
    const totalCost = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const totalAvailable = (user.depositedBalance || 0) + (user.winningBalance || 0) + (user.bonusBalance || 0);
    
    // If not prepaid, check balance
    if (!isPrepaid && totalAvailable < totalCost) {
      alert("Insufficient Balance!");
      return;
    }

    // Global Safety Override
    if (appSettings?.globalSalesClosed) {
      alert("Ticket booking is currently closed for today by the administrator.");
      return;
    }

    // Final Slot Timing Validation for ALL items in cart
    for (const item of cart) {
      const itemBrand = (item.title || "").toUpperCase().includes('JACKPOT') ? 'JACKPOT' : getBrandBySlot(item.draw);
      if (isSlotClosed(item.draw, itemBrand, appSettings)) {
        alert(`Booking for ${itemBrand} (${item.draw}) is now closed. Please remove expired items from your cart.`);
        return;
      }
    }

    try {
      const txId = `TX${Math.floor(100000 + Math.random() * 900000)}`;
      const batch = writeBatch(db);

      const now = new Date();
      const purchaseDate = now.toISOString().split('T')[0];
      const purchaseTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      if (isPrepaid) {
        // Create pending transaction for manual approval
        const topupRef = doc(collection(db, 'pending_transactions'));
        batch.set(topupRef, {
          userId: user.uid,
          userName: user.name || 'Unknown',
          userMobile: user.mobile || 'No Mobile',
          type: 'purchase',
          paymentType: paymentType,
          amount: totalCost,
          bonusUsed: bonusUsed,
          amountPaid: totalCost - bonusUsed,
          userEnteredAmount: userEnteredAmount ? parseFloat(userEnteredAmount) : (paymentType === 'Referral Bonus' ? 0 : null),
          transactionId: transactionId || (paymentType === 'Referral Bonus' ? `REF-${txId}` : null),
          status: 'pending',
          cartItems: cart,
          purchaseId: txId,
          timestamp: serverTimestamp()
        });

        // For Referral Bonus or mixed payments, we deduct the bonus immediately
        if (bonusUsed > 0) {
          const userRef = doc(db, 'users', user.uid);
          batch.update(userRef, { 
            bonusBalance: increment(-bonusUsed),
            balance: increment(-bonusUsed)
          });
        }
      } else {
        // Direct purchase using wallet
        cart.forEach(item => {
          const ticketRef = doc(collection(db, 'tickets'));
          batch.set(ticketRef, {
            ...item,
            userId: user.uid,
            userName: user.name || 'Unknown',
            purchaseId: txId,
            purchaseDate: purchaseDate,
            purchaseTime: purchaseTime,
            status: 'Active',
            paidVia: paymentType,
            prize: '-',
            timestamp: serverTimestamp()
          });
        });

        // Smart Deduction Strategy:
        // 1. Bonus Balance (Restricted - Use first)
        // 2. Deposited Balance
        // 3. Winning Balance
        
        let remainingToDeduct = totalCost;
        const bonus = user.bonusBalance || 0;
        const deposited = user.depositedBalance || 0;
        const winnings = user.winningBalance || 0;
        
        let newBonus = bonus;
        let newDeposited = deposited;
        let newWinnings = winnings;

        // Step 1: Deduct from Bonus
        if (newBonus >= remainingToDeduct) {
          newBonus -= remainingToDeduct;
          remainingToDeduct = 0;
        } else {
          remainingToDeduct -= newBonus;
          newBonus = 0;
        }

        // Step 2: Deduct from Deposited
        if (remainingToDeduct > 0) {
          if (newDeposited >= remainingToDeduct) {
            newDeposited -= remainingToDeduct;
            remainingToDeduct = 0;
          } else {
            remainingToDeduct -= newDeposited;
            newDeposited = 0;
          }
        }

        // Step 3: Deduct from Winnings
        if (remainingToDeduct > 0) {
          newWinnings -= remainingToDeduct;
          remainingToDeduct = 0;
        }

        const userRef = doc(db, 'users', user.uid);
        batch.update(userRef, { 
          bonusBalance: newBonus,
          depositedBalance: newDeposited,
          winningBalance: newWinnings,
          balance: increment(-totalCost)
        });
      }

      await batch.commit();
      clearCart();
      if (isPrepaid) {
        alert("Payment Recorded! Your tickets will be confirmed after verification.");
      } else {
        addNotification({ 
          userId: user.uid,
          title: 'Confirmation', 
          message: `Receipt ${txId} generated successfully.`, 
          type: 'success' 
        });
      }
    } catch (error) {
      console.error("Purchase error:", error);
      alert("Transaction failed!");
    }
  };

  const addNotification = async (notif) => {
    await addDoc(collection(db, 'notifications'), {
      ...notif,
      timestamp: serverTimestamp(),
      read: false
    });
  };

  const markAllRead = async () => {
    if (!user) return;
    const batch = writeBatch(db);
    notifications.forEach(n => {
      if (!n.read) {
        batch.update(doc(db, 'notifications', n.id), { read: true });
      }
    });
    await batch.commit();
  };

  const addResult = async (data) => {
    const { X, A, B, C } = data.digits;
    const fullNum = `${X}${A}${B}${C}`;
    
    // Explicitly normalize everything to strings for the DB
    const normalizedDigits = {
      X: String(X),
      A: String(A),
      B: String(B),
      C: String(C)
    };

    await addDoc(collection(db, 'results'), {
      ...data,
      brand: getBrandBySlot(data.draw), // Strict enforcement
      digits: normalizedDigits,
      number: fullNum,
      timestamp: serverTimestamp()
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const refreshTickets = React.useCallback(async () => {
    if (!user) return;
    try {
      const ticketsQuery = user.role === 'admin' 
        ? collection(db, 'tickets')
        : query(collection(db, 'tickets'), where('userId', '==', user.uid));
        
      const snapshot = await getDocs(ticketsQuery);
      const tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sortedTickets = [...tickets].sort((a, b) => {
        const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : Date.now();
        const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : Date.now();
        return timeB - timeA;
      });
      setPurchasedTickets(sortedTickets);
      // Wait for a smooth UI transition for the pull-to-refresh
      await new Promise(r => setTimeout(r, 600));
    } catch (error) {
      console.error("Manual refresh error:", error);
    }
  }, [user]);

  const updateAppSettings = async (newSettings) => {
    try {
      await setDoc(doc(db, 'settings', 'app'), newSettings, { merge: true });
      return true;
    } catch (e) {
      console.error("Settings update failed:", e);
      return false;
    }
  };

  const updateHoveringNews = (text) => updateAppSettings({ hoveringNews: text });

  return (
    <CartContext.Provider value={{ 
      cart, addToCart, removeFromCart, clearCart, confirmPurchase,
      cartTotal, purchasedTickets, declaredResults, addResult, lastAnnouncement,
      notifications, adminAlerts, markAllRead, addNotification, loading, refreshTickets,
      prizeScheme, updateScheme, hoveringNews, updateHoveringNews,
      appSettings, updateAppSettings
    }}>
      {children}
    </CartContext.Provider>
  );
};

