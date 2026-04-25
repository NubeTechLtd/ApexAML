import { useEffect, useState } from 'react';

export function useCountdown(target: Date | string) {
  const targetTime = typeof target === 'string' ? new Date(target).getTime() : target.getTime();

  const compute = () => {
    const diff = Math.max(0, targetTime - Date.now());
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return { days, hours, minutes, seconds, total: diff };
  };

  const [time, setTime] = useState(compute);

  useEffect(() => {
    const id = setInterval(() => setTime(compute()), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetTime]);

  return time;
}
