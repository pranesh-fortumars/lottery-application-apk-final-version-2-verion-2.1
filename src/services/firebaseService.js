import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

// --- User Management ---

export const getAllUsers = async () => {
  const querySnapshot = await getDocs(collection(db, 'users'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const subscribeToUsers = (callback) => {
  return onSnapshot(collection(db, 'users'), (snapshot) => {
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(users);
  });
};

export const getUserDetails = async (userId) => {
  const userDoc = await getDoc(doc(db, 'users', userId));
  return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
};

export const updateUserBalance = async (userId, newBalance) => {
  await updateDoc(doc(db, 'users', userId), { balance: newBalance });
};

export const updateUserStatus = async (userId, status) => {
  await updateDoc(doc(db, 'users', userId), { status });
};

// --- Result / Game Management ---

export const getResults = async () => {
  const q = query(collection(db, 'results'), orderBy('timestamp', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const subscribeToResults = (callback) => {
  const q = query(collection(db, 'results'), orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(results);
  });
};

export const createResult = async (resultData) => {
  await addDoc(collection(db, 'results'), {
    ...resultData,
    timestamp: serverTimestamp()
  });
};

// --- Announcements ---

export const getAnnouncements = async () => {
  const q = query(collection(db, 'announcements'), orderBy('timestamp', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const createAnnouncement = async (data) => {
  await addDoc(collection(db, 'announcements'), {
    ...data,
    timestamp: serverTimestamp()
  });
};

// --- Tickets / Orders ---

export const getTickets = async (userId = null) => {
  let q = collection(db, 'tickets');
  if (userId) {
    q = query(q, where('userId', '==', userId), orderBy('timestamp', 'desc'));
  } else {
    q = query(q, orderBy('timestamp', 'desc'));
  }
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const subscribeToTickets = (callback, userId = null) => {
  let q = collection(db, 'tickets');
  if (userId) {
    q = query(q, where('userId', '==', userId), orderBy('timestamp', 'desc'));
  } else {
    q = query(q, orderBy('timestamp', 'desc'));
  }
  return onSnapshot(q, (snapshot) => {
    const tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(tickets);
  });
};

// --- App Settings ---

export const getAppSettings = async () => {
  const settingsDoc = await getDoc(doc(db, 'settings', 'app'));
  if (settingsDoc.exists()) {
    return settingsDoc.data();
  }
  // Return default settings if not exists
  return {
    jackpotVisible: true
  };
};

export const subscribeToAppSettings = (callback) => {
  return onSnapshot(doc(db, 'settings', 'app'), (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data());
    } else {
      callback({ jackpotVisible: true });
    }
  });
};

export const updateAppSettings = async (settings) => {
  await setDoc(doc(db, 'settings', 'app'), settings, { merge: true });
};
