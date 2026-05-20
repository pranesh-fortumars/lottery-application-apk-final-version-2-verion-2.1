import * as React from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { COMMON_REFERRAL_CODE } from '../constants/referralConfig';

const AuthContext = React.createContext();

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let unsubscribeUserDoc = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
        unsubscribeUserDoc = null;
      }

      if (firebaseUser) {
        try {
          unsubscribeUserDoc = onSnapshot(doc(db, 'users', firebaseUser.uid), async (userDoc) => {
            if (userDoc.exists()) {
              const userData = userDoc.data();
              
              // SECURITY GATE: Automatic logout for blocked entities
              if (userData.status === 'Blocked') {
                console.warn("Blocked user attempt detected. Terminating session...");
                await signOut(auth);
                setUser(null);
                setLoading(false);
                return;
              }

              // SECURITY GATE: Automatic logout for deleted entities
              if (userData.status === 'Deleted' || userData.isDeleted || userData.active === false) {
                console.warn("Deleted user attempt detected. Terminating session...");
                await signOut(auth);
                setUser(null);
                setLoading(false);
                return;
              }

              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                ...userData
              });
              setLoading(false);
            } else {
              // Check if this is an old account that was hard-deleted from the database
              const creationTime = new Date(firebaseUser.metadata.creationTime).getTime();
              const now = Date.now();
              if (now - creationTime > 60000) { // older than 1 minute
                 console.warn("User document missing for old account (hard-deleted). Terminating session...");
                 await signOut(auth);
                 setUser(null);
                 setLoading(false);
                 return;
              }

              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                role: 'user',
                name: firebaseUser.displayName || 'User',
                balance: 0,
                depositedBalance: 0,
                winningBalance: 0,
                bonusBalance: 0
              });
              setLoading(false);
            }
          }, (error) => {
            console.error("User snapshot error:", error);
            setUser(null);
            setLoading(false);
          });
        } catch (err) {
          console.error("Auth hydration error:", err);
          setUser(null);
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
      }
    };
  }, []);

  const signup = async (email, password, additionalData) => {
    try {
      const usersRef = collection(db, 'users');
      
      // 1. Uniqueness Validation: Check if mobile is already registered
      if (additionalData.mobile) {
        const mobileQ = query(usersRef, where('mobile', '==', additionalData.mobile.trim()));
        const mobileSnap = await getDocs(mobileQ);
        if (!mobileSnap.empty) {
          return { success: false, message: "Mobile number is already registered. Please log in." };
        }
      }

      // 2. Uniqueness Validation: Check if username is already registered
      if (additionalData.name) {
        const nameQ = query(usersRef, where('name', '==', additionalData.name.trim()));
        const nameSnap = await getDocs(nameQ);
        if (!nameSnap.empty) {
          return { success: false, message: "Username is already taken. Please choose another username." };
        }
      }

      // 3. Uniqueness Validation: Check if email is already registered in Firestore
      if (additionalData.email) {
        const emailQ = query(usersRef, where('email', '==', additionalData.email.trim().toLowerCase()));
        const emailSnap = await getDocs(emailQ);
        if (!emailSnap.empty) {
          return { success: false, message: "Email address is already registered. Please log in." };
        }
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      const isReferralValid = additionalData.referral?.toUpperCase() === COMMON_REFERRAL_CODE;
      const bonus = isReferralValid ? 50 : 0;

      // Save additional user data to Firestore including email for flexible login
      const userData = {
        name: additionalData.name ? additionalData.name.trim() : '',
        mobile: additionalData.mobile ? additionalData.mobile.trim() : '',
        email: additionalData.email ? additionalData.email.trim().toLowerCase() : email.trim().toLowerCase(),
        referral: additionalData.referral ? additionalData.referral.trim() : '',
        referralApplied: isReferralValid,
        role: 'user',
        depositedBalance: 0,
        winningBalance: 0,
        bonusBalance: bonus,
        balance: bonus, // Initial total balance
        status: 'Active',
        createdAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      
      return { success: true };
    } catch (error) {
      console.error("Signup error:", error);
      return { success: false, message: error.message };
    }
  };

  const login = async (identifier, password) => {
    let loginEmail = null;
    try {
      const idTrimmed = identifier.trim();
      const idLower = idTrimmed.toLowerCase();

      // 1. Check legacy mock shortcuts first to maintain existing default account behaviors
      if (idLower === 'admin') {
        loginEmail = 'smswinsms@gmail.com';
      } else if (idLower === 'user') {
        loginEmail = 'user@lottery.com';
      }

      // 2. Dynamic validation against the registered user database (Firestore 'users' collection)
      if (!loginEmail) {
        const usersRef = collection(db, 'users');
        const cleanMobile = idTrimmed.replace(/^\+91/, '').replace(/\s+/g, '');
        
        // Query across mobile, name (exact, case-sensitive), and email
        const mobileQuery = query(usersRef, where('mobile', '==', cleanMobile));
        const nameQuery = query(usersRef, where('name', '==', idTrimmed));
        const emailQuery = query(usersRef, where('email', '==', idLower));

        const [mobileSnap, nameSnap, emailSnap] = await Promise.all([
          getDocs(mobileQuery),
          getDocs(nameQuery),
          getDocs(emailQuery)
        ]);

        let matchedUserDoc = null;
        if (!mobileSnap.empty) matchedUserDoc = mobileSnap.docs[0];
        else if (!nameSnap.empty) matchedUserDoc = nameSnap.docs[0];
        else if (!emailSnap.empty) matchedUserDoc = emailSnap.docs[0];

        if (matchedUserDoc) {
          const userData = matchedUserDoc.data();
          if (userData.status === 'Blocked') {
            return { success: false, message: "Your account has been blocked by the administrator." };
          }
          if (userData.status === 'Deleted' || userData.isDeleted || userData.active === false) {
            return { success: false, message: "This account has been deleted. Please contact support." };
          }
          loginEmail = userData.email || `${userData.mobile}@lottery.com`;
        } else {
          // Fallback check if identifier is a direct email or 10-digit mobile pattern not yet in Firestore metadata
          if (idTrimmed.includes('@')) {
            loginEmail = idTrimmed;
          } else if (/^\d{10}$/.test(cleanMobile)) {
            loginEmail = `${cleanMobile}@lottery.com`;
          } else {
            return { success: false, message: "Account not found. Please check your Username, Mobile number, or Email." };
          }
        }
      }

      // 3. Perform Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, password);
      
      // 4. Verify account status post-authentication to catch hard-deleted or soft-deleted via fallback
      const sessionUserDocRef = doc(db, 'users', userCredential.user.uid);
      const sessionUserDoc = await getDoc(sessionUserDocRef);
      if (!sessionUserDoc.exists()) {
        await signOut(auth);
        return { success: false, message: "Account no longer exists." };
      }
      
      const sessionUserData = sessionUserDoc.data();
      if (sessionUserData.status === 'Deleted' || sessionUserData.isDeleted || sessionUserData.active === false) {
        await signOut(auth);
        return { success: false, message: "This account has been deleted. Please contact support." };
      }

      return { success: true };
    } catch (error) {
      // Special Auto-Provisioning for Default Mock Accounts
      const isDefaultAdmin = loginEmail === 'smswinsms@gmail.com' && password === 'admin123';
      const isDefaultUser = loginEmail === 'user@lottery.com' && password === 'user123';

      if (isDefaultAdmin || isDefaultUser) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
          console.log(`Auto-provisioning default ${isDefaultAdmin ? 'admin' : 'user'} account...`);
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, loginEmail, password);
            const firebaseUser = userCredential.user;
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              name: isDefaultAdmin ? 'Super Admin' : 'Test User',
              mobile: isDefaultAdmin ? '0000000000' : '9999999999',
              email: loginEmail,
              role: isDefaultAdmin ? 'admin' : 'user',
              balance: isDefaultAdmin ? 999999 : 0,
              status: 'Active',
              createdAt: new Date().toISOString()
            });
            return { success: true };
          } catch (signupError) {
            if (signupError.code !== 'auth/email-already-in-use') {
              console.error("Default account setup failed:", signupError);
              return { success: false, message: "Setup failed. Please try again or use Signup." };
            }
          }
        }
      }
      
      console.error("Login error:", error);

      // Check for Mobile Reset Sync
      const mobileMatch = loginEmail?.match(/^(\d{10})@/);
      if (mobileMatch) {
        const mobile = mobileMatch[1];
        const q = query(collection(db, 'users'), where('mobile', '==', mobile));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          const userData = snap.docs[0].data();
          if (userData.passwordUpdateRequested && userData.tempPassword === password) {
             return { 
               success: false, 
               message: "OTP VERIFICATION SYNC: Your new password is set in the system but needs one-time Admin activation. Please contact support." 
             };
          }
        }
      }

      let message = "Incorrect password or invalid credentials. Please try again.";
      if (error.code === 'auth/too-many-requests') message = "Too many failed login attempts. Please try again later.";
      if (error.code === 'auth/network-request-failed') message = "Network error. Check your connection.";
      
      return { success: false, message: message };
    }
  };


  const logout = async () => {
    try {
      await signOut(auth);
      // Hard reload to prevent framer-motion AnimatePresence routing bugs
      window.location.href = '/login';
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, message: error.message };
    }
  };

  const updateBalance = async (amount) => {
    if (!user) return;
    const newBalance = (user.balance || 0) + amount;
    const updatedUser = { ...user, balance: newBalance };
    
    try {
      await setDoc(doc(db, 'users', user.uid), { balance: newBalance }, { merge: true });
      setUser(updatedUser);
    } catch (error) {
      console.error("Update balance error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, updateBalance, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

