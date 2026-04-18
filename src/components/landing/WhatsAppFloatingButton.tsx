import { WHATSAPP_URL } from '@/lib/whatsapp';
import { WhatsAppIcon } from './WhatsAppIcon';

interface Props {
  /** Push the button up to clear the sticky bottom bar. */
  shifted?: boolean;
}

export function WhatsAppFloatingButton({ shifted }: Props) {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className={`group fixed right-5 z-50 flex items-center transition-[bottom] duration-300 ${
        shifted ? 'bottom-[80px]' : 'bottom-5'
      }`}
    >
      {/* Tooltip — appears on hover (md+) */}
      <span className="hidden md:inline-flex items-center mr-3 px-3 py-2 rounded-lg bg-[hsl(220,25%,10%)] border border-white/10 text-white text-xs font-medium opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 shadow-xl pointer-events-none whitespace-nowrap">
        Chat with us on WhatsApp →
      </span>
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_30px_-4px_rgba(37,211,102,0.5)] hover:scale-105 active:scale-95 transition-transform">
        <WhatsAppIcon size={28} />
      </span>
    </a>
  );
}
