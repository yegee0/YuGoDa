import { useState, useEffect } from 'react';

export const useCountdown = (initialTime: string) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);

  useEffect(() => {
    if (!initialTime) return;

    const parseTime = (time: string) => {
      const [hours, minutes, seconds] = time.split(':').map(Number);
      return hours * 3600 + minutes * 60 + seconds;
    };

    const formatTime = (totalSeconds: number) => {
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      return [hours, minutes, seconds]
        .map((v) => v.toString().padStart(2, '0'))
        .join(':');
    };

    let seconds = parseTime(initialTime);

    const timer = setInterval(() => {
      seconds -= 1;
      if (seconds <= 0) {
        setTimeLeft('00:00:00');
        clearInterval(timer);
      } else {
        setTimeLeft(formatTime(seconds));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [initialTime]);

  return timeLeft;
};
