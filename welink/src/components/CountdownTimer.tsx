import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  expiryDate: string;
  className?: string;
  onExpired?: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  expiryDate,
  className = '',
  onExpired
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!expiryDate) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
      }
      const parsedDate = Date.parse(expiryDate);
      if (isNaN(parsedDate)) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
      }
      const difference = parsedDate - Date.now();
      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isExpired: false
      };
    };

    // Initialize
    const initial = calculateTimeLeft();
    setTimeLeft(initial);
    if (initial.isExpired && onExpired) {
      onExpired();
    }

    const timer = setInterval(() => {
      const calculated = calculateTimeLeft();
      setTimeLeft(calculated);
      
      if (calculated.isExpired) {
        clearInterval(timer);
        if (onExpired) {
          onExpired();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiryDate, onExpired]);

  if (timeLeft.isExpired) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] bg-red-950/80 text-red-500 px-2 py-0.5 rounded border border-red-600/50 font-mono font-bold uppercase tracking-wider animate-pulse">
        Terminé ❌
      </span>
    );
  }

  const hrs = String(timeLeft.hours).padStart(2, '0');
  const mins = String(timeLeft.minutes).padStart(2, '0');
  const secs = String(timeLeft.seconds).padStart(2, '0');

  return (
    <div 
      className={`inline-flex items-center gap-1 bg-black/95 text-red-500 border-2 border-red-600 rounded-lg px-2 py-1 shadow-[0_0_12px_rgba(239,68,68,0.5)] font-mono ${className}`}
    >
      <div className="flex items-center gap-1 text-[10px] text-orange-500 font-sans font-black uppercase tracking-wider animate-pulse">
        <Clock className="w-3.5 h-3.5 text-amber-500 animate-spin" style={{ animationDuration: '3s' }} />
        <span className="hidden xs:inline">Flash</span>
      </div>
      <div className="flex items-center gap-0.5 text-xs font-black">
        {timeLeft.days > 0 && (
          <>
            <span className="bg-red-900/40 text-rose-100 px-1 rounded border border-red-800/65 shadow-inner">
              {timeLeft.days}
            </span>
            <span className="text-[10px] text-orange-400 font-sans font-bold">j</span>
          </>
        )}
        <span className="bg-red-950 text-red-400 px-1 py-0.5 rounded border border-red-700/60 shadow-inner">
          {hrs}
        </span>
        <span className="text-red-600 font-black animate-pulse">:</span>
        <span className="bg-red-950 text-orange-400 px-1 py-0.5 rounded border border-red-700/60 shadow-inner">
          {mins}
        </span>
        <span className="text-red-600 font-black animate-pulse">:</span>
        <span className="bg-red-950 text-amber-400 px-1 py-0.5 rounded border border-red-700/60 shadow-inner">
          {secs}
        </span>
      </div>
    </div>
  );
};

