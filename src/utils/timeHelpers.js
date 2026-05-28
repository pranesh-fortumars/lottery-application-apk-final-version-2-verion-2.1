import { ref, onValue } from 'firebase/database';
import { rtdb, db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

let serverTimeOffset = 0;

/**
 * Initialize the connection to Firebase RTDB to sync the clock offset.
 * Should be called once at app startup.
 */
export const initTimeSync = () => {
  if (!rtdb) return;
  const offsetRef = ref(rtdb, '.info/serverTimeOffset');
  onValue(offsetRef, (snap) => {
    serverTimeOffset = snap.val() || 0;
  });
};

/**
 * Returns the exact Firebase Server Time in milliseconds.
 * Protects against local clock manipulation.
 */
export const getTrueServerTime = () => {
  return Date.now() + serverTimeOffset;
};

/**
 * Returns a Javascript Date object that strictly acts as if it is in Indian Standard Time (IST),
 * regardless of the user's actual local device timezone.
 */
export const getTrueISTDate = () => {
  const trueTime = getTrueServerTime();
  
  // Format the true time strictly to Asia/Kolkata
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  });
  
  // Create a new Date object based on the formatted IST string
  const istDateString = formatter.format(new Date(trueTime));
  return new Date(istDateString);
};

/**
 * Checks if the local device clock significantly deviates from the true server time.
 * If manipulation is detected, returns an error object, otherwise null.
 */
export const detectTimeFraud = async (user) => {
  const localTime = Date.now();
  const trueTime = getTrueServerTime();
  const diffMinutes = Math.abs(trueTime - localTime) / 1000 / 60;
  
  // 3-minute tolerance for natural clock drift
  if (diffMinutes > 3) {
    const errorMsg = "Incorrect device date/time detected. Please enable automatic date & time settings to continue using the application.";
    
    // Log to security_logs
    try {
      if (user) {
        await addDoc(collection(db, 'security_logs'), {
          type: 'TIME_MANIPULATION_FRAUD',
          userId: user.uid,
          userName: user.displayName || 'Unknown',
          userPhone: user.phoneNumber || 'Unknown',
          deviceTimeReported: new Date(localTime).toISOString(),
          actualServerTimeIST: getTrueISTDate().toISOString(),
          differenceMinutes: diffMinutes,
          timestamp: serverTimestamp(),
          warning: errorMsg
        });
      }
    } catch (err) {
      console.error("Failed to write security log", err);
    }

    return { error: true, message: errorMsg };
  }
  return null;
};
