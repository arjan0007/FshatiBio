import { useState, useEffect } from 'react';

export default function CountdownTimer({ endDate, onComplete, className = '' }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const difference = end - now;

      if (difference <= 0) {
        setExpired(true);
        if (onComplete) onComplete();
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000)
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate, onComplete]);

  if (expired) {
    return (
      <div className={`text-red-600 font-bold ${className}`}>
        Oferta ka përfunduar!
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1 sm:gap-2">
        <div className="bg-red-600 text-white px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-center min-w-[3rem]">
          <div className="text-xs sm:text-sm font-semibold opacity-80">Ditë</div>
          <div className="text-lg sm:text-2xl font-bold">{String(timeLeft.days).padStart(2, '0')}</div>
        </div>
        <span className="text-red-600 font-bold text-xl">:</span>
        <div className="bg-red-600 text-white px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-center min-w-[3rem]">
          <div className="text-xs sm:text-sm font-semibold opacity-80">Orë</div>
          <div className="text-lg sm:text-2xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</div>
        </div>
        <span className="text-red-600 font-bold text-xl">:</span>
        <div className="bg-red-600 text-white px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-center min-w-[3rem]">
          <div className="text-xs sm:text-sm font-semibold opacity-80">Min</div>
          <div className="text-lg sm:text-2xl font-bold">{String(timeLeft.minutes).padStart(2, '0')}</div>
        </div>
        <span className="text-red-600 font-bold text-xl">:</span>
        <div className="bg-red-600 text-white px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-center min-w-[3rem] animate-pulse">
          <div className="text-xs sm:text-sm font-semibold opacity-80">Sek</div>
          <div className="text-lg sm:text-2xl font-bold">{String(timeLeft.seconds).padStart(2, '0')}</div>
        </div>
      </div>
    </div>
  );
}

