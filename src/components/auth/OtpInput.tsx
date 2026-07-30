import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  shake?: boolean;
  autoFocus?: boolean;
  length?: number;
}

/** Six individual digit boxes with auto-advance / backspace handling. */
export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled,
  shake,
  autoFocus,
  length = 6,
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const setDigit = (index: number, digit: string) => {
    const chars = value.padEnd(length, ' ').split('');
    chars[index] = digit || ' ';
    const next = chars.join('').replace(/\s/g, '').slice(0, length);
    onChange(next);
    return next;
  };

  const handleChange = (index: number, raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) {
      setDigit(index, '');
      return;
    }
    if (digits.length > 1) {
      // Paste support
      const next = digits.slice(0, length);
      onChange(next);
      const focusIndex = Math.min(next.length, length - 1);
      refs.current[focusIndex]?.focus();
      if (next.length === length) onComplete?.(next);
      return;
    }
    const next = setDigit(index, digits);
    if (index < length - 1) refs.current[index + 1]?.focus();
    if (next.length === length) onComplete?.(next);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      e.preventDefault();
      onChange(value.slice(0, index - 1));
      refs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < length - 1) refs.current[index + 1]?.focus();
  };

  return (
    <div className={cn('flex justify-center gap-2', shake && 'animate-shake')}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          inputMode="numeric"
          type="tel"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={length}
          disabled={disabled}
          aria-label={`Digit ${i + 1}`}
          value={value[i] ?? ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className={cn(
            'h-14 w-11 rounded-md border border-input bg-background text-center font-mono text-xl',
            'text-foreground shadow-sm outline-none transition-colors',
            'focus:border-primary focus:ring-2 focus:ring-ring/40 disabled:opacity-50',
            shake && 'border-destructive',
          )}
        />
      ))}
    </div>
  );
}
