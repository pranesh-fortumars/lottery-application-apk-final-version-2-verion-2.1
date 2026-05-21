import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';

const PullToRefresh = ({ onRefresh, children }) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const controls = useAnimation();

  const PULL_THRESHOLD = 80;

  const handleTouchStart = (e) => {
    if (window.scrollY === 0 && !isRefreshing) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!isPulling || isRefreshing) return;
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;

    if (diff > 0 && window.scrollY === 0) {
      // Prevent default scroll behavior to enable smooth pull down
      if (e.cancelable) e.preventDefault();
      const progress = Math.min(diff / PULL_THRESHOLD, 1);
      setPullProgress(progress);
      controls.set({ y: Math.min(diff * 0.4, 60) });
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling || isRefreshing) return;
    setIsPulling(false);

    if (pullProgress >= 1 && onRefresh) {
      setIsRefreshing(true);
      controls.start({ y: 50, transition: { type: 'spring', stiffness: 300, damping: 20 } });
      try {
        await onRefresh();
      } catch (error) {
        console.error("Refresh failed:", error);
      }
      setIsRefreshing(false);
    }
    
    setPullProgress(0);
    controls.start({ y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } });
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd, { passive: true });
      return () => {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isPulling, isRefreshing, pullProgress, onRefresh]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-screen">
      {/* Indicator */}
      <motion.div 
        className="absolute left-0 right-0 flex justify-center items-center z-50 pointer-events-none"
        animate={controls}
        initial={{ y: -50 }}
      >
        <div 
          className="bg-white rounded-full p-2.5 shadow-lg border border-gray-100 flex items-center justify-center transition-transform"
          style={{ transform: `scale(${isRefreshing ? 1 : Math.max(pullProgress, 0.5)})`, opacity: pullProgress > 0 || isRefreshing ? 1 : 0 }}
        >
          <RefreshCw 
            className={`text-[#ff004d] ${isRefreshing ? 'animate-spin' : ''}`} 
            size={22} 
            style={{ transform: `rotate(${pullProgress * 180}deg)` }}
          />
        </div>
      </motion.div>
      
      {/* Content wrapper */}
      <motion.div animate={controls} className="w-full h-full">
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefresh;
