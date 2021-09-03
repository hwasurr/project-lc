import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * 카운트다운 위한 훅
 * startCountdown(seconds) 와 같이 사용
 * 
 const { clearTimer, startCountdown, seconds } = useCountdown();

 return (
  <div>
    { seconds > 0 
      ? (<button onClick={() => startCountdown(10)}>10초 카운트다운 시작</button>)
      : (<div>{seconds}</div>)
    }
  </div>
 );
 */
export function useCountdown() {
  const [seconds, setSeconds] = useState<number>(0);
  const intervalCallbackRef = useRef(() => setSeconds((second) => second - 1));
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSeconds(0);
  }, []);

  useEffect(() => {
    if (seconds < 0) clearTimer();
  }, [clearTimer, seconds]);

  const startCountdown = useCallback((startSecond: number) => {
    setSeconds(startSecond);
    intervalRef.current = setInterval(intervalCallbackRef.current, 1000);
  }, []);

  return {
    startCountdown,
    clearTimer,
    seconds,
    setSeconds,
    intervalRef,
    intervalCallbackRef,
  };
}
