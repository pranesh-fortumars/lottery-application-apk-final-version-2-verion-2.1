/**
 * Global Lottery Configuration
 * Strictly defines the relationship between Time Slots and Lottery Brands
 */

export const DRAW_SLOTS = [
  { time: '01:00 PM', brand: 'DEAR', id: 1 },
  { time: '03:00 PM', brand: 'KERALA', id: 4 },
  { time: '06:00 PM', brand: 'DEAR', id: 2 },
  { time: '08:00 PM', brand: 'DEAR', id: 3 }
];

export const getBrandBySlot = (time) => {
  const slot = DRAW_SLOTS.find(s => s.time === time);
  return slot ? slot.brand : 'UNKNOWN';
};

export const getSlotById = (id) => {
  return DRAW_SLOTS.find(s => s.id === Number(id));
};

export const MARKET_GROUPS = {
  'DEAR': ['01:00 PM', '06:00 PM', '08:00 PM'],
  'KERALA': ['03:00 PM']
};

/**
 * Standardized Slot Closing Logic
 * @param {string} slotTime - The official draw time (e.g. '01:00 PM')
 * @param {string} brand - 'DEAR' or 'KERALA'
 * @param {object} appSettings - Firestore settings for dynamic overrides
 * @returns {boolean} - True if slot is closed for purchasing
 */
import { getTrueISTDate } from '../utils/timeHelpers';

export const getCutoffTime = (drawTime, brand, appSettings) => {
  const parts = drawTime.match(/(\d+):(\d+)\s*(AM|PM)/);
  if (!parts) return null;
  
  let hours = parseInt(parts[1]);
  const minutes = parseInt(parts[2]);
  const ampm = parts[3];
  
  if (ampm === 'PM' && hours !== 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  
  const cutoff = getTrueISTDate();
  cutoff.setHours(hours, minutes, 0, 0);
  
  if (brand === 'DEAR' || brand === 'JACKPOT') {
    cutoff.setMinutes(cutoff.getMinutes() - 5);
  } else if (brand === 'KERALA' && appSettings?.keralaSalesClosed) {
    cutoff.setHours(14, 0, 0, 0);
  }
  
  return cutoff;
};

export const isSlotClosed = (drawTime, brand, appSettings) => {
  if (appSettings?.globalSalesClosed) return true;
  const now = getTrueISTDate();
  const cutoff = getCutoffTime(drawTime, brand, appSettings);
  return !cutoff || now >= cutoff;
};
