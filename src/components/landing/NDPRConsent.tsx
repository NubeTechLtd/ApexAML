import { Link } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';

interface Props {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  id?: string;
  /** Render in a darker variant on bright backgrounds — defaults to dark theme. */
  className?: string;
}

/**
 * NDPR consent checkbox + data-handling micro-copy.
 * Use below every submit button on lead-capture forms. Submit must be disabled
 * until the user explicitly checks the box.
 */
export function NDPRConsent({ checked, onCheckedChange, id = 'ndpr-consent', className = '' }: Props) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label htmlFor={id} className="flex items-start gap-3 cursor-pointer">
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={(c) => onCheckedChange(c === true)}
          className="mt-0.5 border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          aria-required="true"
        />
        <span className="text-xs text-white/55 leading-relaxed">
          I agree to ApexAML's{' '}
          <Link
            to="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Privacy Policy
          </Link>{' '}
          and consent to being contacted in accordance with the Nigeria Data Protection Act 2023.
        </span>
      </label>
      <p className="text-[10px] text-white/35 leading-relaxed pl-7">
        Your data is stored on AWS servers in Nigeria. We never sell or share your information. You can request deletion at any time.
      </p>
    </div>
  );
}
